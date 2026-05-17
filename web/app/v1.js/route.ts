// Serves /v1.js — the self-hosted CinchPay browser SDK.
// Pinned to the host's origin (no npm, no version drift, no registry trust).
// Loaded with <script src="https://cinchpay.app/v1.js"></script>

import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 3600; // re-build hourly so origin/contract changes ship

function sdkSource(opts: { origin: string }) {
  return `/*! CinchPay v1 — MIT licensed · ${opts.origin} */
(function () {
  if (window.CinchPay && window.CinchPay.__v >= 1) return;

  var ORIGIN = ${JSON.stringify(opts.origin)};
  var openModalEl = null;
  var openCallbacks = null;
  var msgHandler = null;

  function bytes32Random() {
    var bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    var hex = "";
    for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return "0x" + hex;
  }

  function buildUrl(opts) {
    var params = new URLSearchParams();
    if (!opts.merchant) throw new Error("CinchPay: 'merchant' is required");
    if (opts.amount === undefined || opts.amount === null) throw new Error("CinchPay: 'amount' is required");
    params.set("merchant", String(opts.merchant));
    params.set("amount", String(opts.amount));
    if (opts.token) params.set("token", String(opts.token));
    if (opts.orderId) params.set("orderId", String(opts.orderId));
    if (opts.paymentId) params.set("paymentId", String(opts.paymentId));
    if (opts.returnUrl) params.set("returnUrl", String(opts.returnUrl));
    if (opts.cancelUrl) params.set("cancelUrl", String(opts.cancelUrl));
    return ORIGIN + "/checkout?" + params.toString();
  }

  function injectStyles() {
    if (document.getElementById("cp-style")) return;
    var s = document.createElement("style");
    s.id = "cp-style";
    s.textContent = [
      "@keyframes cp-fade{from{opacity:0}to{opacity:1}}",
      "@keyframes cp-pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}",
      ".cp-backdrop{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(7,8,10,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px;animation:cp-fade .2s ease}",
      ".cp-frame{width:100%;max-width:460px;height:720px;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:#fff;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);overflow:hidden;animation:cp-pop .24s cubic-bezier(.2,.8,.2,1)}",
      ".cp-close{position:absolute;top:18px;right:18px;width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;display:flex;align-items:center;justify-content:center;font:600 16px/1 -apple-system,Segoe UI,Inter,sans-serif;cursor:pointer;transition:background .15s ease}",
      ".cp-close:hover{background:rgba(255,255,255,.18)}",
      "@media (prefers-color-scheme: light){.cp-frame{border-color:rgba(0,0,0,.12)}}",
    ].join("");
    document.head.appendChild(s);
  }

  function close() {
    if (msgHandler) {
      window.removeEventListener("message", msgHandler);
      msgHandler = null;
    }
    if (openModalEl) {
      openModalEl.remove();
      openModalEl = null;
    }
  }

  function open(opts) {
    if (openModalEl) close();
    opts = opts || {};

    var paymentId = opts.paymentId || bytes32Random();
    var url = buildUrl(Object.assign({}, opts, { paymentId: paymentId }));

    injectStyles();
    var backdrop = document.createElement("div");
    backdrop.className = "cp-backdrop";

    var iframe = document.createElement("iframe");
    iframe.className = "cp-frame";
    iframe.title = "CinchPay checkout";
    iframe.allow = "clipboard-write";
    iframe.src = url;

    var closeBtn = document.createElement("button");
    closeBtn.className = "cp-close";
    closeBtn.setAttribute("aria-label", "Close checkout");
    closeBtn.innerHTML = "✕";
    closeBtn.onclick = function () {
      try { opts.onClose && opts.onClose({ paymentId: paymentId }); } catch (e) { console.error(e); }
      close();
    };

    backdrop.appendChild(iframe);
    backdrop.appendChild(closeBtn);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeBtn.click();
    });
    document.body.appendChild(backdrop);
    openModalEl = backdrop;

    openCallbacks = {
      onReady: opts.onReady,
      onSuccess: opts.onSuccess,
      onClose: opts.onClose,
    };

    msgHandler = function (e) {
      if (e.origin !== ORIGIN) return;
      var d = e.data;
      if (!d || typeof d.type !== "string") return;
      if (d.type === "cinchpay:ready" && openCallbacks && openCallbacks.onReady) {
        try { openCallbacks.onReady(d.payload || {}); } catch (err) { console.error(err); }
      }
      if (d.type === "cinchpay:success") {
        try { openCallbacks && openCallbacks.onSuccess && openCallbacks.onSuccess(d.payload || {}); } catch (err) { console.error(err); }
        // auto-close after a beat so users see the success state inside the frame
        setTimeout(close, 1800);
      }
      if (d.type === "cinchpay:close") {
        try { openCallbacks && openCallbacks.onClose && openCallbacks.onClose(d.payload || {}); } catch (err) { console.error(err); }
        close();
      }
    };
    window.addEventListener("message", msgHandler);

    return { close: close, paymentId: paymentId };
  }

  // data-attribute auto-binder: any <button data-cinchpay data-merchant="…" data-amount="…">
  function bindDataAttributes() {
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("[data-cinchpay]") : null;
      if (!el) return;
      e.preventDefault();
      open({
        merchant: el.getAttribute("data-merchant"),
        amount: el.getAttribute("data-amount"),
        token: el.getAttribute("data-token") || undefined,
        orderId: el.getAttribute("data-order-id") || undefined,
        returnUrl: el.getAttribute("data-return-url") || undefined,
        cancelUrl: el.getAttribute("data-cancel-url") || undefined,
      });
    }, false);
  }
  bindDataAttributes();

  window.CinchPay = { __v: 1, open: open, close: close, version: "1.0.0", origin: ORIGIN };
})();`;
}

export function GET(req: Request) {
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  const body = sdkSource({ origin });
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
