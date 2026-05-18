"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, Check, ExternalLink, X } from "lucide-react";
import { newPaymentId, shortAddr } from "@/lib/format";
import { EXPLORER } from "@/lib/contract";

const ALL_PRODUCTS = [
  { id: "tee", name: "Essential Tee", variant: "Charcoal, Medium", price: 28, image: "/products/tee.avif" },
  { id: "trainer", name: "Trainer 01", variant: "Off-white, 42", price: 128, image: "/products/shoe.avif" },
  { id: "headphones", name: "Studio Headphones", variant: "Over-ear, 30h", price: 349, image: "/products/headphones.webp" },
  { id: "case", name: "Field Case", variant: "Silicone, MagSafe", price: 24, image: "/products/case.avif" },
  { id: "carry", name: "Daily Carry", variant: "Modular kit", price: 64, image: "/products/accessory.avif" },
  { id: "whitening", name: "Pearl Whitening", variant: "7-day kit", price: 48, image: "/products/teeth.avif" },
  { id: "print", name: "Print Tee", variant: "Cotton blend, Large", price: 34, image: "/products/tshirt.jpg" },
];

// 4 curated pairs, rotated every 2s
const PAIRS: [number, number][] = [
  [0, 1], // tee + trainer
  [2, 3], // headphones + case
  [4, 5], // carry + whitening
  [6, 1], // print tee + trainer
];

const ROTATE_MS = 2000;

export function HeroDemoCard() {
  const { address, isConnected } = useAccount();
  const [checkout, setCheckout] = useState<{ paymentId: `0x${string}`; total: number } | null>(null);
  const [paid, setPaid] = useState<{ total: number; txHash: string } | null>(null);
  const [pairIdx, setPairIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Rotate pairs every ROTATE_MS unless user is hovering / checkout open
  useEffect(() => {
    if (paused || checkout || paid) return;
    const i = setInterval(
      () => setPairIdx((p) => (p + 1) % PAIRS.length),
      ROTATE_MS,
    );
    return () => clearInterval(i);
  }, [paused, checkout, paid]);

  const currentPair = PAIRS[pairIdx];
  const products = currentPair.map((i) => ALL_PRODUCTS[i]);
  const total = products.reduce((s, p) => s + p.price, 0);

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
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
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
              form-studio.shop / checkout
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
            USDC on Arc
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

        {/* Product cards — auto-rotating pair with cross-fade */}
        <div className="mx-5 mt-5 rounded-xl border border-[var(--border)] bg-[var(--paper)] p-3">
          <div className="relative">
            {/* Invisible ghost holds the height; all real pairs are absolute overlays */}
            <div className="grid grid-cols-2 gap-3 invisible">
              <ProductSkeleton />
              <ProductSkeleton />
            </div>

            {PAIRS.map((pair, idx) => {
              const pairProducts = pair.map((i) => ALL_PRODUCTS[i]);
              const visible = idx === pairIdx;
              return (
                <div
                  key={idx}
                  aria-hidden={!visible}
                  className="absolute inset-0 grid grid-cols-2 gap-3 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "scale(1)" : "scale(0.985)",
                    pointerEvents: visible ? "auto" : "none",
                  }}
                >
                  {pairProducts.map((p) => (
                    <article
                      key={p.id}
                      className="group rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-colors hover:border-[var(--border-strong)]"
                    >
                      <div className="relative aspect-square overflow-hidden bg-[var(--surface)]">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-[13px] font-bold tracking-tight text-[var(--fg)] truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[var(--fg-muted)] truncate">{p.variant}</div>
                        <div className="mt-1.5 font-bold tabular text-[var(--fg)]">
                          ${p.price.toFixed(2)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Pagination dots */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {PAIRS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPairIdx(i)}
                aria-label={`Show pair ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  i === pairIdx
                    ? "w-6 bg-[var(--accent)]"
                    : "w-1.5 bg-[var(--border-strong)] hover:bg-[var(--fg-muted)]"
                }`}
              />
            ))}
          </div>

          <div className="mt-3">
            {isConnected ? (
              <button
                onClick={startPay}
                className="group flex w-full items-center justify-between rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-[14px] font-bold text-[var(--accent-fg)] hover:bg-[var(--accent)]/15 transition-colors btn-anim"
              >
                <span>Pay {total} USDC</span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)]">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5 arrow-nudge" />
                </span>
              </button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="flex w-full items-center justify-between rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-[14px] font-bold text-[var(--accent-fg)] hover:bg-[var(--accent)]/15 transition-colors btn-anim"
                  >
                    <span>Pay {total} USDC</span>
                    <span className="text-[12px] font-semibold text-[var(--accent)]">
                      Connect wallet →
                    </span>
                  </button>
                )}
              </ConnectButton.Custom>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--border)] px-5 py-3 text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
          <span className="font-semibold">Powered by CinchPay</span>
          <span className="font-mono">arc, &lt;1slt;1s on arc</span>
        </div>
      </div>

      {/* Modals */}
      {checkout && address && (
        <CheckoutModal
          merchant={address}
          amount={checkout.total}
          paymentId={checkout.paymentId}
          onClose={() => setCheckout(null)}
        />
      )}
      {paid && <PaidModal total={paid.total} txHash={paid.txHash} onClose={() => setPaid(null)} />}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <article className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="aspect-square" />
      <div className="p-3">
        <div className="text-[13px] font-bold">—</div>
        <div className="text-[11px]">—</div>
        <div className="mt-1.5 font-bold">—</div>
      </div>
    </article>
  );
}

function ChatBubble({ side, children }: { side: "me" | "them"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "me" ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
          side === "me"
            ? "bg-[var(--accent-soft)] text-[var(--accent-fg)] rounded-bl-md font-medium"
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
          className="mt-6 w-full rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-bold text-[var(--primary-fg)] btn-anim"
        >
          Close
        </button>
      </div>
    </div>
  );
}
