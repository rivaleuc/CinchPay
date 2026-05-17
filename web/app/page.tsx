"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Code2, ArrowRight, Copy, Check } from "lucide-react";
import { Button, Label, Pill } from "@/components/cinch/primitives";

const snippet = `<iframe
  src="https://cinchpay.app/checkout?merchant=0xD140...&amount=29.99&token=USDC"
  width="420"
  height="640"
  style="border:0;border-radius:16px;"
></iframe>`;

export default function Landing() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <Pill dot>Live on Arc Testnet</Pill>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-50 md:text-6xl">
            USDC checkout for any site.
          </h1>
          <p className="mt-3 text-2xl tracking-tight text-zinc-500 md:text-3xl">
            5 lines of code.
          </p>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            Sub-second settlement on Arc Network with a webhook-driven design built for production merchants.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/demo">
              <Button>
                Try the demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/integrate">
              <Button variant="outline">Integration docs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Code snippet section */}
      <section className="border-b border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:gap-16">
          <div>
            <Label>Integration</Label>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
              Add USDC checkout in seconds.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
              Drop in the iframe, link, or modal. Receive a webhook the instant funds settle onchain. No custodial accounts, no KYC for the merchant.
            </p>
            <div className="mt-6 flex flex-col gap-3 text-sm text-zinc-400">
              <Row k="Settlement" v="< 1s" />
              <Row k="Currencies" v="USDC, EURC" />
              <Row k="Fee" v="1.0%" />
            </div>
          </div>
          <CodeBlock language="HTML" code={snippet} />
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-white/[0.06]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3">
          <Feature
            icon={<Zap className="h-4 w-4" />}
            iconAccent
            title="Sub-second settlement"
            desc="Atomic onchain transfer. The moment your customer signs, the funds are yours."
          />
          <Feature
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Stablecoin only"
            desc="USDC and EURC. No volatility, no surprises, no exchange step required."
          />
          <Feature
            icon={<Code2 className="h-4 w-4" />}
            title="Open source"
            desc="Contracts, widget, and dashboard are MIT licensed. Self-host if you prefer."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Label>Flow</Label>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
            Three steps. No middlemen.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-3">
            <Step n="01" title="Embed the widget" desc="A single iframe or payment link. Pre-filled with amount, currency, and your merchant address." />
            <Step n="02" title="Customer pays" desc="Wallet connects, approves USDC, and signs. Settlement happens in the same transaction." />
            <Step n="03" title="You get paid" desc="Funds land in your wallet. Webhook fires. Order is fulfilled." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 text-xs text-zinc-600">
        <span className="font-mono">CinchPay · Arc Network</span>
        <span className="font-mono">v0.1.0 · testnet</span>
      </footer>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{k}</span>
      <span className="tabular font-mono text-zinc-300">{v}</span>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
  iconAccent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  iconAccent?: boolean;
}) {
  return (
    <div className="bg-[#07080a] p-8 md:p-10">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
          iconAccent
            ? "border-[#5b8cff]/30 bg-[#5b8cff]/10 text-[#5b8cff]"
            : "border-white/10 bg-white/[0.03] text-zinc-300"
        }`}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-[15px] font-medium tracking-tight text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="bg-[#0c0e11] p-8">
      <span className="font-mono text-xs text-zinc-600">{n} /</span>
      <h3 className="mt-4 text-base font-medium text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{desc}</p>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0e11]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{language}</span>
        <button
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed">
        <code
          dangerouslySetInnerHTML={{
            __html: code
              .replace(/(<|&lt;)(\/?[a-zA-Z0-9]+)/g, '<span style="color:#5b8cff">$1$2</span>')
              .replace(/([a-z-]+)=/g, '<span style="color:#a1a1aa">$1</span>=')
              .replace(/("[^"]*")/g, '<span style="color:#10b981">$1</span>'),
          }}
        />
      </pre>
    </div>
  );
}
