import Link from "next/link";
import { ArrowUpRight, Check, Code2, Zap, Lock, GitBranch } from "lucide-react";
import { Footer } from "@/components/Footer";
import { HeroDemoCard } from "@/components/HeroDemoCard";

export default function Landing() {
  return (
    <>
      {/* Hero — text left, demo right */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-24 md:pb-32">
        <div className="grid gap-12 md:grid-cols-[1.05fr_1fr] md:gap-16 md:items-center">
          {/* Left: copy */}
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] font-semibold">
              <span className="h-px w-8 bg-[var(--border-strong)]" />
              Version 0.1 · Live on Arc Testnet
            </div>
            <h1 className="display mt-7 text-balance text-[42px] leading-[1.02] md:text-[64px]">
              Stablecoin checkout, refined for the open web.
            </h1>
            <p className="mt-7 max-w-md text-pretty text-[15px] leading-relaxed text-[var(--fg-muted)]">
              CinchPay is a USDC checkout processor built on Arc, the Layer-1 by
              Circle. Customers pay in stablecoins. Merchants settle in under a
              second. One percent, no surprises.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-3 text-sm font-bold text-[var(--primary-fg)] btn-anim"
              >
                See the checkout
                <ArrowUpRight className="h-4 w-4 arrow-nudge" />
              </Link>
              <Link
                href="/integrate"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold hover:bg-[var(--surface)] transition-colors btn-anim"
              >
                Read the docs
              </Link>
            </div>
          </div>

          {/* Right: live demo card */}
          <div className="relative">
            <HeroDemoCard />
          </div>
        </div>
      </section>

      {/* Stat band */}
      <section className="border-y border-[var(--border)] bg-[var(--paper)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[var(--border)] md:grid-cols-4">
          {(
            [
              ["< 1s", "Settlement"],
              ["1.00%", "Processor fee"],
              ["USDC", "Native stablecoin"],
              ["MIT", "Open source"],
            ] as const
          ).map(([v, l]) => (
            <div key={l} className="stat-hover px-6 py-10">
              <div className="stat-value font-serif text-4xl tracking-tight">{v}</div>
              <div className="mt-2 text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-32">
        <div className="grid gap-16 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] font-semibold">— Product</div>
            <h2 className="editorial-display mt-4 text-5xl">A processor that disappears into your stack.</h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group border-t border-[var(--border)] pt-6 transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--paper)] text-[var(--accent)] transition-colors group-hover:border-[var(--accent)]/40 group-hover:bg-[var(--accent-soft)]">
                  <f.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-bold text-xl tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="mx-auto max-w-6xl px-6 pb-32">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] font-semibold">— Integration</div>
            <h2 className="editorial-display mt-4 text-5xl">Drop in. Get paid.</h2>
            <p className="mt-6 max-w-md text-[var(--fg-muted)]">
              A single iframe is all it takes. CinchPay handles wallet
              connection, signing, broadcast, and confirmation. You receive a
              webhook the moment funds settle.
            </p>
            <ul className="mt-8 space-y-3 text-sm font-medium">
              {["No SDK install", "No PCI scope", "Works with any backend", "Self-host or hosted"].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-[var(--accent)]" strokeWidth={2.5} />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="lift rounded-lg border border-[var(--border-strong)] bg-[var(--paper)] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--border-strong)]" />
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--border-strong)]" />
              <span className="h-2.5 w-2.5 rounded-full border border-[var(--border-strong)]" />
              <span className="ml-2 font-mono text-xs text-[var(--fg-muted)]">checkout.html</span>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-[var(--fg)]">
{`<iframe
  src="https://cinchpay.app/checkout
    ?merchant=0x8a3f...c21d
    &amount=49.00
    &token=USDC"
  width="420" height="640">
</iframe>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-6 py-32 text-center">
          <p className="display text-balance text-3xl md:text-4xl">
            &ldquo;Card rails were never designed for software. CinchPay is what
            checkout looks like when the protocol settles in milliseconds.&rdquo;
          </p>
          <div className="mt-10 text-sm text-[var(--fg-muted)] font-medium">
            Anya Mitchell · Founder, Form Studio
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

const FEATURES = [
  { icon: Zap, title: "Sub-second settlement", body: "Arc finalizes blocks in under a second. Your customer's receipt and your funds arrive at the same time." },
  { icon: Code2, title: "Drop-in iframe", body: "One iframe URL. The widget handles wallets, signing, and confirmation. No SDK to install or maintain." },
  { icon: Lock, title: "Non-custodial", body: "Funds move wallet-to-wallet. CinchPay never holds merchant balances. We take 1% at settlement." },
  { icon: GitBranch, title: "Open source", body: "MIT licensed end-to-end. Audit the widget, the contracts, the webhook signer. Or self-host the lot." },
];
