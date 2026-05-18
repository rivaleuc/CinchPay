"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { EXPLORER, PROCESSOR_ADDRESS } from "@/lib/contract";

const sections = [
  { id: "intro", label: "Introduction" },
  { id: "install", label: "Install", primary: true },
  { id: "script", label: "Script tag" },
  { id: "link", label: "Payment link" },
  { id: "checkout", label: "Embed iframe" },
  { id: "events", label: "Modal & events" },
  { id: "returnurl", label: "Return URL" },
  { id: "webhooks", label: "Self-hosted webhooks" },
  { id: "contract", label: "Contract" },
];

const scriptSnippet = `<!-- 1. Load the SDK from cinchpay.app (no npm, no version drift) -->
<script src="https://cinchpay.app/v1.js"></script>

<!-- 2a. Data-attribute mode — zero JavaScript -->
<button
  data-cinchpay
  data-merchant="0xD140...0164"
  data-amount="29.99"
  data-token="USDC"
  data-order-id="ORD_8f2a"
>
  Pay 29.99 USDC
</button>

<!-- 2b. Or call CinchPay.open() with callbacks -->
<script>
  document.querySelector("#buy").addEventListener("click", () => {
    CinchPay.open({
      merchant: "0xD140...0164",
      amount: 29.99,
      token: "USDC",
      orderId: "ORD_8f2a",
      onSuccess: ({ txHash, paymentId }) => {
        fetch("/api/fulfill", {
          method: "POST",
          body: JSON.stringify({ paymentId, txHash }),
        });
      },
      onClose: () => console.log("Customer cancelled"),
    });
  });
</script>`;

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

const webhookSnippet = `// Drop-in self-hosted webhook listener using Viem (Node, Next.js, Cloudflare Workers, etc.)
// Watches Payment events for your merchant address on Arc Testnet and calls your handler.

import { createPublicClient, http, parseAbiItem } from "viem";

const arc = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.drpc.testnet.arc.network"] } },
};

const client = createPublicClient({ chain: arc, transport: http() });

const PROCESSOR = "0xD4aBC1dbc1Bfa47B702a3F23Ec6f6EBF89D80A36";
const MERCHANT = "0xYourMerchantAddress";

const PAYMENT = parseAbiItem(
  "event Payment(address indexed merchant, address indexed payer, address indexed token, uint256 grossAmount, uint256 netAmount, uint256 fee, bytes32 paymentId, bytes32 metadata)"
);

// Subscribe — invoked the instant a payment to your address is confirmed onchain.
client.watchEvent({
  address: PROCESSOR,
  event: PAYMENT,
  args: { merchant: MERCHANT },
  onLogs: async (logs) => {
    for (const log of logs) {
      const { paymentId, netAmount, payer, metadata, token } = log.args;
      // metadata is a bytes32 — decode your orderId however you packed it
      console.log("Paid", { paymentId, netAmount, payer, token, txHash: log.transactionHash });

      // Fulfill the order in your own backend
      await fetch("https://yoursite.com/api/fulfill", {
        method: "POST",
        body: JSON.stringify({ paymentId, txHash: log.transactionHash }),
      });
    }
  },
});`;

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
                className={
                  "block transition-colors " +
                  (s.primary
                    ? "font-bold text-[var(--accent)] hover:text-[var(--accent-fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]")
                }
              >
                {s.label}
                {s.primary && (
                  <span className="ml-1.5 inline-block rounded border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-fg)]">
                    Start here
                  </span>
                )}
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

          <Section id="install" eyebrow="Quickstart" title="Install CinchPay in under 60 seconds.">
            <p>
              CinchPay is a static script — no npm package, no SDK install, no bundler config.
              Your customers pay USDC on Arc Network, you receive funds directly in your wallet.
            </p>

            <Step
              n="01"
              title="Prerequisites"
              body={
                <>
                  <p>
                    All you need is a wallet address that can receive USDC on Arc — that&apos;s
                    your merchant ID. No signup, no API key.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm leading-relaxed list-disc list-inside">
                    <li>An EVM-compatible wallet (MetaMask, Coinbase Wallet, Privy, Circle Wallet, etc.)</li>
                    <li>The wallet address added as a network on Arc — chain ID <code className="font-mono text-xs">5042002</code></li>
                    <li>(For testing) A small amount of testnet USDC from <a className="text-[var(--accent)] hover:underline" href="https://faucet.circle.com" target="_blank" rel="noreferrer">faucet.circle.com</a></li>
                  </ul>
                </>
              }
            />

            <Step
              n="02"
              title="Add the script"
              body={
                <>
                  <p>
                    Drop this single tag into any HTML page — works on Shopify, WordPress,
                    Webflow, Next.js, vanilla HTML, anywhere.
                  </p>
                  <CodeBlock
                    language="html"
                    code={`<script src="https://cinchpay.app/v1.js"></script>`}
                  />
                </>
              }
            />

            <Step
              n="03"
              title="Pick how customers pay"
              body={
                <>
                  <p>Three patterns. Pick the one that fits your stack.</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Choice
                      label="A — Zero JavaScript"
                      desc="Add data attributes to any button. The script auto-binds clicks."
                      best="Best for: Shopify, WordPress, no-code sites"
                    />
                    <Choice
                      label="B — Programmatic"
                      desc="Call CinchPay.open() in your own JS with onSuccess / onClose callbacks."
                      best="Best for: React, Vue, Next.js apps"
                    />
                  </div>

                  <p className="mt-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    A · Data-attribute button
                  </p>
                  <CodeBlock
                    language="html"
                    code={`<button
  data-cinchpay
  data-merchant="0xYourWalletAddress"
  data-amount="29.99"
  data-token="USDC"
  data-order-id="ORDER-001"
>
  Pay 29.99 USDC
</button>`}
                  />

                  <p className="mt-6 text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    B · Programmatic open
                  </p>
                  <CodeBlock
                    language="js"
                    code={`document.querySelector("#buy").addEventListener("click", () => {
  CinchPay.open({
    merchant: "0xYourWalletAddress",
    amount: 29.99,
    token: "USDC",
    orderId: "ORDER-001",
    onSuccess: ({ txHash, paymentId }) => {
      // Mark the order as paid in your backend
      fetch("/api/orders/fulfill", {
        method: "POST",
        body: JSON.stringify({ paymentId, txHash }),
      });
    },
    onClose: () => console.log("Customer cancelled"),
  });
});`}
                  />
                </>
              }
            />

            <Step
              n="04"
              title="Wire up your backend (optional but recommended)"
              body={
                <>
                  <p>
                    The <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs">onSuccess</code>{" "}
                    callback fires in the browser, but a determined user could skip it.
                    For trustworthy fulfillment, listen to the <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs">Payment</code>{" "}
                    event on-chain from a long-running worker.
                  </p>
                  <CodeBlock
                    language="ts"
                    code={`import { createPublicClient, http, parseAbiItem } from "viem";

const client = createPublicClient({
  chain: {
    id: 5042002,
    rpcUrls: { default: { http: ["https://rpc.drpc.testnet.arc.network"] } },
  },
  transport: http(),
});

client.watchEvent({
  address: "${PROCESSOR_ADDRESS}",
  event: parseAbiItem(
    "event Payment(address indexed merchant, address indexed payer, address indexed token, uint256 grossAmount, uint256 netAmount, uint256 fee, bytes32 paymentId, bytes32 metadata)"
  ),
  args: { merchant: "0xYourWalletAddress" },
  onLogs: async (logs) => {
    for (const log of logs) {
      await fulfillOrder({
        paymentId: log.args.paymentId,
        txHash: log.transactionHash,
        amount: log.args.netAmount,
      });
    }
  },
});`}
                  />
                  <p className="text-sm">
                    Run this anywhere: Node, Next.js API route, Cloudflare Worker, AWS Lambda,
                    a tiny VPS. No webhook signing secrets — events are signed by Arc validators.
                  </p>
                </>
              }
            />

            <Step
              n="05"
              title="Test on Arc Testnet"
              body={
                <>
                  <p>Before going live, run an end-to-end test with testnet USDC.</p>
                  <ol className="mt-3 space-y-2 text-sm leading-relaxed list-decimal list-inside">
                    <li>Visit <a className="text-[var(--accent)] hover:underline" href="https://faucet.circle.com" target="_blank" rel="noreferrer">faucet.circle.com</a> and request testnet USDC for any wallet</li>
                    <li>Open your page with the CinchPay button</li>
                    <li>Click pay → connect the funded wallet → approve → confirm</li>
                    <li>Watch the funds land in your merchant wallet within a second</li>
                    <li>Verify your backend received the <code className="font-mono text-xs">Payment</code> event</li>
                  </ol>
                  <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--paper)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg)]">
                      Live demo
                    </p>
                    <p className="mt-2 text-sm text-[var(--fg-muted)]">
                      Try a real testnet purchase right now at{" "}
                      <a className="text-[var(--accent)] hover:underline" href="/demo">/demo</a>
                      {" "}— it&apos;s a working store wired to the same script you just installed.
                    </p>
                  </div>
                </>
              }
            />

            <Step
              n="06"
              title="Go to production"
              body={
                <>
                  <p>
                    When Arc mainnet launches, deployment is a one-line config change.
                    Your installation code stays identical.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm leading-relaxed list-disc list-inside">
                    <li>Swap the mainnet contract address (we&apos;ll publish it here on launch)</li>
                    <li>Point your backend listener at the mainnet RPC</li>
                    <li>Replace your testnet wallet with your production receiving wallet</li>
                  </ul>
                  <p className="text-sm">
                    That&apos;s it. No SDK upgrade, no breaking change, no NPM dependency to audit.
                  </p>
                </>
              }
            />
          </Section>

          <Section id="script" eyebrow="Path 00 · Recommended" title="Script tag.">
            <p>
              One <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs">&lt;script&gt;</code>{" "}
              tag, no npm, no bundler. The SDK ships from our origin — you always
              get the latest version, supply-chain-safe by construction.
            </p>
            <CodeBlock language="html" code={scriptSnippet} />
            <div className="rounded-md border border-[var(--border)] bg-[var(--paper)] p-4 text-sm text-[var(--fg-muted)]">
              <p className="font-semibold text-[var(--fg)] text-xs uppercase tracking-wider">
                What you get
              </p>
              <ul className="mt-3 space-y-1.5 list-disc list-inside">
                <li><code className="font-mono text-xs">CinchPay.open(opts)</code> — opens the modal programmatically.</li>
                <li><code className="font-mono text-xs">data-cinchpay</code> attribute — zero-JS auto-binder on any element.</li>
                <li><code className="font-mono text-xs">onSuccess(payload)</code> / <code className="font-mono text-xs">onClose(payload)</code> callbacks.</li>
                <li>Origin-checked <code className="font-mono text-xs">postMessage</code> handling done for you.</li>
                <li>Self-contained — no React, no jQuery, ~3 KB gzipped.</li>
              </ul>
            </div>
          </Section>

          <Section id="link" eyebrow="Path 01" title="Payment link.">
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

          <Section
            id="webhooks"
            eyebrow="Real-time"
            title="Self-hosted webhooks."
          >
            <p>
              CinchPay doesn&apos;t run a webhook dispatcher — payments are public on-chain
              events. Subscribe to <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs">Payment</code>{" "}
              events from your own backend and call any internal handler when funds settle.
            </p>
            <p className="text-sm">
              This pattern works on Node, Next.js routes, Cloudflare Workers, Vercel
              Functions, AWS Lambda — anywhere you can run a long-lived process or
              a cron poll. Drop in the snippet below.
            </p>
            <CodeBlock language="ts" code={webhookSnippet} />
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--paper)] p-4 text-sm text-[var(--fg-muted)]">
              <p className="font-semibold text-[var(--fg)] text-xs uppercase tracking-wider">
                Why self-hosted?
              </p>
              <ul className="mt-3 space-y-1.5 list-disc list-inside">
                <li>No third-party in the critical path — your backend reads the chain directly.</li>
                <li>No webhook secret to leak or rotate — events are signed by validators.</li>
                <li>Replay any history at any time with the same code.</li>
                <li>If your worker dies, no payments are lost — they&apos;re onchain forever.</li>
              </ul>
            </div>
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
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-muted)] font-semibold">{eyebrow}</div>
      <h2 className="mt-3 editorial-display text-3xl md:text-4xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[var(--fg-muted)]">
        {children}
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: React.ReactNode }) {
  return (
    <div className="mt-8 border-l-2 border-[var(--border)] pl-6 hover:border-[var(--accent)] transition-colors">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-[var(--fg-faint)] tracking-widest">{n}</span>
        <h3 className="text-[18px] font-bold tracking-tight text-[var(--fg)]">{title}</h3>
      </div>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[var(--fg-muted)]">
        {body}
      </div>
    </div>
  );
}

function Choice({ label, desc, best }: { label: string; desc: string; best: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--paper)] p-4 hover:border-[var(--border-strong)] transition-colors">
      <div className="text-[13px] font-bold tracking-tight text-[var(--fg)]">{label}</div>
      <p className="mt-1 text-[12px] text-[var(--fg-muted)] leading-relaxed">{desc}</p>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--accent)] font-semibold">
        {best}
      </p>
    </div>
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
