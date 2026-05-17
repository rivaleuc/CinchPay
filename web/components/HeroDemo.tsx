"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  Shirt,
  Sparkles,
  X,
} from "lucide-react";
import { newPaymentId, shortAddr } from "@/lib/format";
import { EXPLORER } from "@/lib/contract";

const PRODUCTS = [
  { id: "tee", name: "Studio Tee", variant: "Charcoal · Medium", price: 28, accent: "from-zinc-400 to-zinc-700" },
  { id: "hood", name: "Workshop Hoodie", variant: "Navy · Medium", price: 64, accent: "from-slate-500 to-slate-800" },
];

export function HeroDemo() {
  const { address, isConnected } = useAccount();
  const [checkout, setCheckout] = useState<{ paymentId: `0x${string}`; total: number } | null>(null);
  const [paid, setPaid] = useState<{ total: number; txHash: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const total = PRODUCTS.reduce((s, p) => s + p.price, 0);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "cinchpay:success") {
        setPaid({ total: checkout?.total ?? total, txHash: e.data.payload?.txHash || "" });
        setCheckout(null);
      }
      if (e.data?.type === "cinchpay:close") setCheckout(null);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [checkout, total]);

  function startPay() {
    if (!isConnected || !address) return;
    setCheckout({ paymentId: newPaymentId(), total });
  }

  return (
    <section className="relative border-t border-[var(--border)] bg-[var(--paper)] overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent-fg)]">
              <Sparkles className="h-3 w-3" />
              Live preview
            </div>
            <h2 className="display mt-5 text-balance text-4xl md:text-5xl">
              From cart to wallet in one tap.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--fg-muted)]">
              CinchPay drops into any storefront. Customers see your products,
              tap pay, and watch the funds land in your wallet — atomically,
              onchain, in under a second.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-fg)] btn-anim"
              >
                Open the demo shop
                <ArrowUpRight className="h-4 w-4 arrow-nudge" />
              </Link>
              <Link
                href="/integrate"
                className="link-grow text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Or read the docs →
              </Link>
            </div>
          </div>

          {/* Right: framed demo */}
          <div ref={ref} className="relative">
            {/* Sparkle backdrop */}
            <div className="absolute -inset-8 rounded-[2rem]">
              <div className="sparkle-field" />
              <div className="sparkle-glow" />
            </div>

            <div className="relative lift rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] shadow-[0_30px_80px_-30px_oklch(0.55_0.08_240/0.25)] overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                  <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                  <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                  <span className="ml-2 font-mono text-[11px] text-[var(--fg-muted)]">
                    strata.shop / checkout
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
                  USDC · Arc
                </span>
              </div>

              {/* Chat */}
              <div className="space-y-3 px-5 pt-6">
                <ChatBubble side="them">
                  I&apos;m refreshing my wardrobe. Can you recommend cozy basics in size M?
                </ChatBubble>
                <ChatBubble side="me">
                  Two essentials below. Pay in USDC — settles in under a second.
                </ChatBubble>
              </div>

              {/* Product cards */}
              <div className="mx-5 mt-5 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-3">
                <div className="grid grid-cols-2 gap-3">
                  {PRODUCTS.map((p) => (
                    <article
                      key={p.id}
                      className="group rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--border-strong)]"
                    >
                      <div
                        className={`relative aspect-square overflow-hidden bg-gradient-to-br ${p.accent}`}
                      >
                        <Shirt
                          className="absolute inset-0 m-auto h-1/2 w-1/2 text-white/80 transition-transform duration-500 group-hover:scale-110"
                          strokeWidth={1}
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-[13px] font-semibold tracking-tight text-[var(--fg)]">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[var(--fg-muted)]">{p.variant}</div>
                        <div className="mt-1.5 font-semibold tabular text-[var(--fg)]">
                          ${p.price.toFixed(2)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pay button */}
                <div className="mt-3">
                  {isConnected ? (
                    <button
                      onClick={startPay}
                      className="group flex w-full items-center justify-between rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-[14px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent)]/15 transition-colors btn-anim"
                    >
                      <span>Pay {total} USDC</span>
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
                        Continue
                        <ArrowRight className="h-3.5 w-3.5 arrow-nudge" />
                      </span>
                    </button>
                  ) : (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={openConnectModal}
                          className="flex w-full items-center justify-between rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-[14px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent)]/15 transition-colors btn-anim"
                        >
                          <span>Pay {total} USDC</span>
                          <span className="text-[12px] font-medium text-[var(--accent)]">
                            Connect wallet →
                          </span>
                        </button>
                      )}
                    </ConnectButton.Custom>
                  )}
                </div>
              </div>

              {/* Footer ledger */}
              <div className="mt-5 border-t border-[var(--border)] px-5 py-3 text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
                <span>Powered by CinchPay</span>
                <span className="font-mono">arc · &lt;1s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real checkout modal */}
      {checkout && address && (
        <CheckoutModal
          merchant={address}
          amount={checkout.total}
          paymentId={checkout.paymentId}
          onClose={() => setCheckout(null)}
        />
      )}

      {paid && <PaidModal total={paid.total} txHash={paid.txHash} onClose={() => setPaid(null)} />}
    </section>
  );
}

function ChatBubble({ side, children }: { side: "me" | "them"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "me" ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
          side === "me"
            ? "bg-[var(--accent-soft)] text-[var(--accent-fg)] rounded-bl-md"
            : "bg-[var(--surface)] text-[var(--fg)] rounded-br-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function CheckoutModal({
  merchant,
  amount,
  paymentId,
  onClose,
}: {
  merchant: `0x${string}`;
  amount: number;
  paymentId: `0x${string}`;
  onClose: () => void;
}) {
  const url = `/checkout?merchant=${merchant}&amount=${amount.toFixed(2)}&token=USDC&orderId=HERO_${Date.now()}&paymentId=${paymentId}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/40 backdrop-blur-sm px-4 fade-in">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--paper)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)] btn-anim"
      >
        <X className="h-4 w-4" />
      </button>
      <iframe
        src={url}
        title="CinchPay checkout"
        className="h-[720px] w-full max-w-[460px] rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] shadow-2xl"
      />
    </div>
  );
}

function PaidModal({ total, txHash, onClose }: { total: number; txHash: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/40 backdrop-blur-sm px-4 fade-in">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--paper)] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)]">
          <Check className="h-6 w-6 text-[var(--accent)]" strokeWidth={2.5} />
        </div>
        <h2 className="display mt-5 text-3xl">Order settled</h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          <span className="tabular">${total.toFixed(2)} USDC</span> moved wallet-to-wallet on Arc Testnet.
        </p>
        {txHash && (
          <a
            href={`${EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] transition-colors"
          >
            {shortAddr(txHash)}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-fg)] btn-anim"
        >
          Close
        </button>
      </div>
    </div>
  );
}
