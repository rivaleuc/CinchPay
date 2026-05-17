"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { EXPLORER, PROCESSOR_ADDRESS } from "@/lib/contract";

const sections = [
  { id: "intro", label: "Introduction" },
  { id: "install", label: "Payment link" },
  { id: "checkout", label: "Embed iframe" },
  { id: "events", label: "Modal & events" },
  { id: "returnurl", label: "Return URL" },
  { id: "contract", label: "Contract" },
];

const linkSnippet = `https://cinchpay.app/checkout?merchant=0xD140...0164&amount=29.99&token=USDC&orderId=ORD_8f2a&returnUrl=https://yoursite.com/thanks`;

const iframeSnippet = `<iframe
  src="https://cinchpay.app/checkout?merchant=0xD140...&amount=29.99&token=USDC"
  width="420"
  height="640"
  style="border:0;border-radius:16px;"
></iframe>`;

const jsSnippet = `// Listen for events from the CinchPay checkout iframe
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
});`;

const returnUrlSnippet = `https://yoursite.com/thanks?order=ORD_8f2a&tx=0x9c2a4f01&status=success`;

export default function Docs() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 grid gap-12 md:grid-cols-[200px_1fr]">
        <aside className="md:sticky md:top-12 md:self-start">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
            Documentation
          </div>
          <nav className="mt-4 space-y-1.5 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="mt-10 rounded-md border border-[var(--border)] bg-[var(--paper)] p-4">
            <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">
              Version
            </div>
            <div className="font-mono text-sm mt-1">v0.1.0</div>
            <div className="mt-3 text-xs text-[var(--fg-muted)]">
              MIT licensed.{" "}
              <a
                href="https://github.com/rivaleuc/CinchPay"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                GitHub →
              </a>
            </div>
          </div>
        </aside>

        <article className="max-w-2xl">
          <Section id="intro" eyebrow="Getting started" title="A USDC checkout you can ship today.">
            <p>
              CinchPay is a stablecoin checkout processor built on Arc, the Layer-1 by Circle.
              Customers pay in USDC. Merchants receive USDC, minus a one-percent processor fee,
              in under a second.
            </p>
            <p>
              The fastest integration is a single URL. You can also embed the iframe directly,
              or self-host the entire widget from our MIT-licensed repository.
            </p>
          </Section>

          <Section id="install" eyebrow="Path 01" title="Payment link.">
            <p>Share a hosted checkout URL. Zero code, works in any channel.</p>
            <CodeBlock language="text" code={linkSnippet} />
            <ParamsTable />
          </Section>

          <Section id="checkout" eyebrow="Path 02" title="Embedded iframe.">
            <p>Drop the iframe directly into your product page or cart.</p>
            <CodeBlock language="html" code={iframeSnippet} />
          </Section>

          <Section id="events" eyebrow="Path 03" title="Modal with callbacks.">
            <p>
              Open the checkout in a modal and react to{" "}
              <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs">postMessage</code>{" "}
              events.
            </p>
            <CodeBlock language="js" code={jsSnippet} />

            <h3 className="mt-12 font-serif text-2xl">Events</h3>
            <p className="mt-2">Messages posted to the parent window from the checkout iframe.</p>
            <div className="mt-6 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--paper)]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
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
          </Section>

          <Section id="returnurl" eyebrow="Redirect flow" title="Return URL.">
            <p>When using the payment link method, customers are redirected with query parameters.</p>
            <CodeBlock language="text" code={returnUrlSnippet} />
          </Section>

          <Section id="contract" eyebrow="On-chain" title="Contract.">
            <p>CinchPayProcessor deployment on Arc Testnet.</p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-[var(--border)] bg-[var(--paper)] p-4 hover:border-[var(--border-strong)] transition-colors">
              <span className="break-all font-mono text-sm tabular text-[var(--fg)]">
                {PROCESSOR_ADDRESS}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <CopyButton text={PROCESSOR_ADDRESS} />
                <a
                  href={`${EXPLORER}/address/${PROCESSOR_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] btn-anim"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </Section>
        </article>
      </div>
      <Footer />
    </>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 first:mt-0 scroll-mt-12">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">{eyebrow}</div>
      <h2 className="mt-3 editorial-display text-3xl md:text-4xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[var(--fg-muted)]">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="lift overflow-hidden rounded-md border border-[var(--border)] bg-[var(--paper)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-[var(--fg)]">
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
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] btn-anim"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ParamsTable() {
  const rows = [
    { p: "merchant", r: true, d: "Merchant wallet address (also accepts `to`)." },
    { p: "amount", r: true, d: 'Decimal string. e.g. "29.99".' },
    { p: "token", r: false, d: '"USDC" or "EURC" (also accepts `currency`).' },
    { p: "orderId", r: false, d: "Your internal order id, echoed back." },
    { p: "paymentId", r: false, d: "32-byte hex. Auto-generated if omitted." },
    { p: "returnUrl", r: false, d: "Where to redirect after payment." },
    { p: "cancelUrl", r: false, d: "Where to redirect on cancel." },
  ];
  return (
    <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--paper)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
            <Th>Param</Th>
            <Th>Required</Th>
            <Th>Description</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p} className="row-hover border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 font-mono text-[var(--fg)]">{r.p}</td>
              <td className="px-4 py-3">
                {r.r ? (
                  <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] text-[var(--accent-fg)]">
                    yes
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--fg-muted)]">no</span>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--fg-muted)]">{r.d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRow({ type, payload, desc }: { type: string; payload: string; desc: string }) {
  return (
    <tr className="row-hover border-b border-[var(--border)] last:border-0">
      <td className="px-4 py-3 font-mono text-xs text-[var(--fg)]">{type}</td>
      <td className="px-4 py-3 font-mono text-xs text-[var(--fg-muted)]">{payload}</td>
      <td className="px-4 py-3 text-sm text-[var(--fg-muted)]">{desc}</td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">
      {children}
    </th>
  );
}
