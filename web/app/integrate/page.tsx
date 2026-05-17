"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Label } from "@/components/cinch/primitives";
import { EXPLORER, PROCESSOR_ADDRESS } from "@/lib/contract";

const linkSnippet = `https://cinchpay.app/checkout?merchant=0xD140...0164&amount=29.99&token=USDC&orderId=ORD_8f2a&returnUrl=https://yoursite.com/thanks`;

const iframeSnippet = `<iframe
  src="https://cinchpay.app/checkout?merchant=0xD140...&amount=29.99&token=USDC"
  width="420"
  height="640"
  style="border:0;border-radius:16px;"
></iframe>`;

const jsSnippet = `// Listen for events from the cinchpay checkout iframe
window.addEventListener("message", (event) => {
  if (event.origin !== "https://cinchpay.app") return;

  const { type, payload } = event.data;

  if (type === "cinchpay:success") {
    console.log("Payment confirmed", payload.txHash);
    fulfillOrder(payload.orderId);
  }

  if (type === "cinchpay:close") {
    closeModal();
  }
});

// Open the checkout in a modal
const url = "https://cinchpay.app/checkout" +
  "?merchant=0xD140...0164" +
  "&amount=29.99" +
  "&token=USDC" +
  "&orderId=ORD_8f2a";
openModal(\`<iframe src="\${url}" width="420" height="640"></iframe>\`);`;

const returnUrlSnippet = `https://yoursite.com/thanks?order=ORD_8f2a&tx=0x8f2a91c4b419&status=success`;

export default function IntegrateDocs() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <section className="border-b border-white/[0.06] pb-12">
        <Label className="text-[#5b8cff]">Docs</Label>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">
          Integrate CinchPay.
        </h1>
        <p className="mt-4 text-[15px] text-zinc-400">
          Three integration methods. Pick the one that matches your stack.
        </p>
      </section>

      <Path n="01" title="Payment link" desc="Share a hosted checkout URL. Zero code, works in any channel.">
        <CodeBlock language="text" code={linkSnippet} />
        <ParamsTable />
      </Path>

      <Path n="02" title="Embedded iframe" desc="Drop the iframe directly into your product page or cart.">
        <CodeBlock language="html" code={iframeSnippet} />
      </Path>

      <Path n="03" title="Modal with callbacks" desc="Open the checkout in a modal and react to postMessage events.">
        <CodeBlock language="js" code={jsSnippet} />
      </Path>

      <section className="mt-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-xl font-medium tracking-tight text-zinc-100">Events</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Messages posted to the parent window from the checkout iframe.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <Th>Type</Th>
                <Th>Payload</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              <EventRow type="cinchpay:ready" payload="{ paymentId }" desc="Iframe finished loading." />
              <EventRow
                type="cinchpay:success"
                payload="{ txHash, orderId, amount, currency, merchant }"
                desc="Payment settled onchain."
              />
              <EventRow type="cinchpay:close" payload="{ paymentId }" desc="User dismissed the checkout." />
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-xl font-medium tracking-tight text-zinc-100">Return URL flow</h2>
        <p className="mt-2 text-sm text-zinc-500">
          When using the payment link method, customers are redirected with query parameters.
        </p>
        <div className="mt-6">
          <CodeBlock language="text" code={returnUrlSnippet} />
        </div>
      </section>

      <section className="mt-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-xl font-medium tracking-tight text-zinc-100">Contract</h2>
        <p className="mt-2 text-sm text-zinc-500">CinchPayProcessor deployment on Arc Testnet.</p>
        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#0c0e11] p-4">
          <span className="break-all font-mono text-sm text-zinc-200">{PROCESSOR_ADDRESS}</span>
          <div className="flex shrink-0 items-center gap-2">
            <CopyButton text={PROCESSOR_ADDRESS} />
            <a
              href={`${EXPLORER}/address/${PROCESSOR_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function Path({
  n,
  title,
  desc,
  children,
}: {
  n: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <span className="font-mono text-xs text-zinc-600">{n} /</span>
      <h2 className="mt-3 text-xl font-medium tracking-tight text-zinc-100">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">{desc}</p>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0e11]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-100 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ParamsTable() {
  const rows = [
    { p: "merchant", r: true, d: "Merchant wallet address (also accepts `to`)." },
    { p: "amount", r: true, d: 'Decimal string. e.g. "29.99".' },
    { p: "token", r: false, d: '"USDC" or "EURC" (also accepts `currency`).' },
    { p: "orderId", r: false, d: "Your internal order id. Echoed back." },
    { p: "paymentId", r: false, d: "32-byte hex. Auto-generated if omitted." },
    { p: "returnUrl", r: false, d: "Where to redirect after payment." },
    { p: "cancelUrl", r: false, d: "Where to redirect on cancel." },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <Th>Param</Th>
            <Th>Required</Th>
            <Th>Description</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p} className="border-b border-white/[0.04] last:border-0">
              <td className="px-4 py-3 font-mono text-zinc-200">{r.p}</td>
              <td className="px-4 py-3">
                {r.r ? (
                  <span className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-0.5 text-[11px] text-emerald-400">
                    yes
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-500">no</span>
                )}
              </td>
              <td className="px-4 py-3 text-zinc-400">{r.d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRow({ type, payload, desc }: { type: string; payload: string; desc: string }) {
  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="px-4 py-3 font-mono text-xs text-zinc-200">{type}</td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{payload}</td>
      <td className="px-4 py-3 text-sm text-zinc-400">{desc}</td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
      {children}
    </th>
  );
}
