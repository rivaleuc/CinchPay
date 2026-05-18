/**
 * CinchPay SDK — vanilla TypeScript / browser
 *
 * @example
 * import { CinchPay } from "@cinchpay/sdk";
 *
 * CinchPay.open({
 *   merchant: "0x...",
 *   amount: 29.99,
 *   token: "USDC",
 *   orderId: "ORD-001",
 *   onSuccess: ({ txHash, paymentId }) => fulfill(paymentId, txHash),
 * });
 */

import type {
  CinchPayConfig,
  ClosePayload,
  OpenHandle,
  PaymentOptions,
  ReadyPayload,
  SuccessPayload,
} from "./types.js";

export type {
  CinchPayConfig,
  ClosePayload,
  OpenHandle,
  PaymentOptions,
  ReadyPayload,
  SuccessPayload,
  TokenSymbol,
} from "./types.js";

const DEFAULT_ORIGIN = "https://cinchpay.app";

interface Internal {
  origin: string;
  modal: HTMLDivElement | null;
  handler: ((e: MessageEvent) => void) | null;
}

const state: Internal = {
  origin: DEFAULT_ORIGIN,
  modal: null,
  handler: null,
};

function randomPaymentId(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return `0x${hex}` as `0x${string}`;
}

function ensureStyles() {
  if (document.getElementById("cp-sdk-style")) return;
  const s = document.createElement("style");
  s.id = "cp-sdk-style";
  s.textContent = [
    "@keyframes cp-fade{from{opacity:0}to{opacity:1}}",
    "@keyframes cp-pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}",
    ".cp-bd{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(7,8,10,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px;animation:cp-fade .2s ease}",
    ".cp-fr{width:100%;max-width:460px;height:720px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:#fff;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);overflow:hidden;animation:cp-pop .24s cubic-bezier(.2,.8,.2,1)}",
    ".cp-cl{position:absolute;top:18px;right:18px;width:36px;height:36px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;display:flex;align-items:center;justify-content:center;font:600 16px/1 -apple-system,Segoe UI,Inter,sans-serif;cursor:pointer;transition:background .15s ease}",
    ".cp-cl:hover{background:rgba(255,255,255,.18)}",
  ].join("");
  document.head.appendChild(s);
}

function buildUrl(opts: PaymentOptions, paymentId: `0x${string}`): string {
  if (!opts.merchant) throw new Error("CinchPay: 'merchant' is required");
  if (opts.amount === undefined || opts.amount === null) {
    throw new Error("CinchPay: 'amount' is required");
  }
  const params = new URLSearchParams();
  params.set("merchant", String(opts.merchant));
  params.set("amount", String(opts.amount));
  if (opts.token) params.set("token", opts.token);
  if (opts.orderId) params.set("orderId", opts.orderId);
  params.set("paymentId", paymentId);
  if (opts.returnUrl) params.set("returnUrl", opts.returnUrl);
  if (opts.cancelUrl) params.set("cancelUrl", opts.cancelUrl);
  return `${state.origin}/checkout?${params.toString()}`;
}

function detachHandler() {
  if (state.handler) {
    window.removeEventListener("message", state.handler);
    state.handler = null;
  }
}

function teardown() {
  detachHandler();
  if (state.modal) {
    state.modal.remove();
    state.modal = null;
  }
}

/** Configure the SDK (e.g. override origin for self-hosted deployments). */
export function configure(config: CinchPayConfig): void {
  if (config.origin) state.origin = config.origin.replace(/\/$/, "");
}

/**
 * Open the CinchPay checkout in a modal iframe.
 * Returns a handle with .close() and the assigned paymentId.
 */
export function open(opts: PaymentOptions): OpenHandle {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("CinchPay.open can only be called in the browser");
  }

  // Close any existing modal first
  teardown();
  ensureStyles();

  const paymentId = (opts.paymentId ?? randomPaymentId()) as `0x${string}`;
  const url = buildUrl(opts, paymentId);

  const backdrop = document.createElement("div");
  backdrop.className = "cp-bd";

  const iframe = document.createElement("iframe");
  iframe.className = "cp-fr";
  iframe.title = "CinchPay checkout";
  iframe.allow = "clipboard-write";
  iframe.src = url;

  const closeBtn = document.createElement("button");
  closeBtn.className = "cp-cl";
  closeBtn.setAttribute("aria-label", "Close checkout");
  closeBtn.textContent = "✕";

  const handle: OpenHandle = {
    close: () => {
      try {
        opts.onClose?.({ paymentId } satisfies ClosePayload);
      } catch (e) {
        console.error(e);
      }
      teardown();
    },
    paymentId,
  };

  closeBtn.onclick = handle.close;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) handle.close();
  });

  backdrop.appendChild(iframe);
  backdrop.appendChild(closeBtn);
  document.body.appendChild(backdrop);
  state.modal = backdrop;

  state.handler = (e: MessageEvent) => {
    if (e.origin !== state.origin) return;
    const data = e.data as { type?: string; payload?: unknown } | undefined;
    if (!data || typeof data.type !== "string") return;

    if (data.type === "cinchpay:ready") {
      try {
        opts.onReady?.((data.payload as ReadyPayload) ?? { paymentId });
      } catch (err) {
        console.error(err);
      }
    }
    if (data.type === "cinchpay:success") {
      try {
        const payload = (data.payload as SuccessPayload) ?? {
          paymentId,
          txHash: "0x" as `0x${string}`,
          merchant: opts.merchant,
          amount: String(opts.amount),
          currency: opts.token ?? "USDC",
          orderId: opts.orderId,
        };
        opts.onSuccess?.(payload);
      } catch (err) {
        console.error(err);
      }
      // Let users see the success state briefly then auto-close
      setTimeout(teardown, 1800);
    }
    if (data.type === "cinchpay:close") {
      handle.close();
    }
  };
  window.addEventListener("message", state.handler);

  return handle;
}

/** Close the currently open CinchPay modal, if any. */
export function close(): void {
  teardown();
}

/** Generate a fresh 32-byte payment id. Useful for pre-creating ids server-side. */
export function newPaymentId(): `0x${string}` {
  return randomPaymentId();
}

/**
 * Default export with the namespaced API.
 * @example
 * import CinchPay from "@cinchpay/sdk";
 * CinchPay.open({ ... });
 */
export const CinchPay = {
  open,
  close,
  configure,
  newPaymentId,
  version: "0.1.0",
} as const;

export default CinchPay;
