"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Check, ExternalLink, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/cinch/primitives";
import { newPaymentId, shortAddr } from "@/lib/format";
import { EXPLORER } from "@/lib/contract";

type Product = {
  id: number;
  title: string;
  detail: string;
  price: number;
  tag: string;
  image: string;
};

const PRODUCTS: Product[] = [
  { id: 1, title: "Essential Tee", detail: "Heavyweight cotton, charcoal", price: 28, tag: "Apparel", image: "/products/tee.avif" },
  { id: 2, title: "Trainer 01", detail: "Off-white, EU 42", price: 128, tag: "Footwear", image: "/products/shoe.avif" },
  { id: 3, title: "Studio Headphones", detail: "Over-ear, 30h battery", price: 349, tag: "Audio", image: "/products/headphones.webp" },
  { id: 4, title: "Field Case", detail: "Silicone, magnetic", price: 24, tag: "Accessory", image: "/products/case.avif" },
  { id: 5, title: "Daily Carry", detail: "Modular kit", price: 64, tag: "Accessory", image: "/products/accessory.avif" },
];

export default function Demo() {
  const { address, isConnected } = useAccount();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState<{ amount: number; paymentId: `0x${string}` } | null>(null);
  const [paid, setPaid] = useState<{ amount: number; txHash: string } | null>(null);

  const items = Object.entries(cart).map(([id, qty]) => ({
    ...PRODUCTS.find((p) => p.id === Number(id))!,
    qty,
  }));
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalCount = items.reduce((s, i) => s + i.qty, 0);

  const add = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: number) =>
    setCart((c) => {
      const n = (c[id] ?? 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "cinchpay:success") {
        setPaid({
          amount: checkoutOpen?.amount ?? 0,
          txHash: e.data.payload?.txHash || "",
        });
        setCheckoutOpen(null);
        setCart({});
        setOpen(false);
      }
      if (e.data?.type === "cinchpay:close") {
        setCheckoutOpen(null);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [checkoutOpen]);

  function startCheckout() {
    if (!isConnected || !address) return;
    setCheckoutOpen({
      amount: subtotal,
      paymentId: newPaymentId(),
    });
  }

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-xs text-[var(--fg-muted)]">
          <span className="uppercase tracking-[0.18em]">Demo shop · powered by CinchPay</span>
          <Link href="/" className="link-grow hover:text-[var(--fg)] transition-colors">
            ← Back to CinchPay
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <div className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">Form Studio</div>
        <h1 className="display mt-4 text-5xl md:text-6xl max-w-3xl">
          A modern goods store, paid in stablecoins.
        </h1>
        <p className="mt-6 max-w-xl text-[var(--fg-muted)]">
          A working demo of CinchPay on a real storefront. Add anything to your cart and check
          out with USDC on Arc Testnet — settles in under a second.
        </p>
        <div className="mt-5 text-sm text-[var(--fg-muted)]">
          Payments settle to:{" "}
          {isConnected ? (
            <span className="font-mono text-[var(--fg)]">{shortAddr(address)}</span>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  Connect a wallet
                </button>
              )}
            </ConnectButton.Custom>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-32">
        <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 border border-[var(--border)] rounded-lg overflow-hidden">
          {PRODUCTS.map((p) => (
            <article
              key={p.id}
              className="group bg-[var(--paper)] p-6 transition-colors hover:bg-[var(--surface)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--surface)] transition-shadow group-hover:shadow-[0_12px_30px_-12px_oklch(0.55_0.08_240/0.3)]">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">
                    {p.tag}
                  </div>
                  <div className="mt-1 font-serif text-xl truncate">{p.title}</div>
                  <div className="text-xs text-[var(--fg-muted)] truncate">{p.detail}</div>
                </div>
                <div className="font-mono text-sm tabular shrink-0">${p.price}.00</div>
              </div>
              <button
                onClick={() => add(p.id)}
                className="mt-5 w-full rounded-md border border-[var(--border)] px-3 py-2 text-xs font-medium hover:border-[var(--border-strong)] hover:bg-[var(--bg)] transition-colors btn-anim"
              >
                Add to cart
              </button>
            </article>
          ))}
        </div>
      </section>

      {totalCount > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--primary)] px-5 py-3 text-sm text-[var(--primary-fg)] shadow-lg btn-anim fade-in"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{totalCount} items</span>
          <span className="font-mono tabular">${subtotal}.00</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-[var(--fg)]/20 backdrop-blur-sm fade-in"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-full max-w-md bg-[var(--paper)] border-l border-[var(--border-strong)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="font-serif text-2xl">Your cart</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <p className="text-sm text-[var(--fg-muted)]">Cart is empty.</p>
              ) : (
                <ul className="space-y-5">
                  {items.map((i) => (
                    <li
                      key={i.id}
                      className="flex gap-4 border-b border-[var(--border)] pb-5 last:border-0"
                    >
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--surface)]">
                        <Image
                          src={i.image}
                          alt={i.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-lg leading-tight truncate">{i.title}</div>
                        <div className="text-xs text-[var(--fg-muted)] truncate">{i.detail}</div>
                        <div className="mt-3 inline-flex items-center gap-3 rounded-md border border-[var(--border)] px-2 py-1">
                          <button
                            onClick={() => sub(i.id)}
                            className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-xs w-3 text-center tabular">{i.qty}</span>
                          <button
                            onClick={() => add(i.id)}
                            className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-sm tabular">${i.price * i.qty}.00</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-[var(--border)] px-6 py-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--fg-muted)]">Subtotal</span>
                  <span className="font-mono tabular">${subtotal}.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--fg-muted)]">Processor (1%)</span>
                  <span className="font-mono tabular">${(subtotal * 0.01).toFixed(2)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-3">
                  <span className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">
                    Total · USDC
                  </span>
                  <span className="font-serif text-2xl tabular">${subtotal.toFixed(2)}</span>
                </div>
                {isConnected ? (
                  <Button onClick={startCheckout} className="mt-2 w-full">
                    Checkout with CinchPay
                  </Button>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button onClick={openConnectModal} className="mt-2 w-full">
                        Connect to pay
                      </Button>
                    )}
                  </ConnectButton.Custom>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && address && (
        <CheckoutModal
          merchant={address}
          amount={checkoutOpen.amount}
          paymentId={checkoutOpen.paymentId}
          onClose={() => setCheckoutOpen(null)}
        />
      )}

      {paid && <SuccessModal amount={paid.amount} txHash={paid.txHash} onClose={() => setPaid(null)} />}

      <Footer />
    </>
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
  const url = `/checkout?merchant=${merchant}&amount=${amount.toFixed(2)}&token=USDC&orderId=ORD_${Date.now()}&paymentId=${paymentId}`;
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

function SuccessModal({
  amount,
  txHash,
  onClose,
}: {
  amount: number;
  txHash: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/40 backdrop-blur-sm px-4 fade-in">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--paper)] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)]">
          <Check className="h-6 w-6 text-[var(--accent)]" strokeWidth={2} />
        </div>
        <h2 className="mt-5 font-serif text-3xl">Order confirmed</h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Thank you. Your books will ship in 2 business days.
        </p>
        <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--bg)] p-4 text-left space-y-2 text-xs">
          <Line k="Paid" v={`$${amount.toFixed(2)} USDC`} />
          <Line k="Tx" v={`${txHash.slice(0, 8)}…${txHash.slice(-6)}`} href={`${EXPLORER}/tx/${txHash}`} />
        </div>
        <Button onClick={onClose} className="mt-6 w-full">
          Keep shopping
        </Button>
      </div>
    </div>
  );
}

function Line({ k, v, href }: { k: string; v: string; href?: string }) {
  const inner = (
    <span className="inline-flex items-center gap-1 font-mono tabular text-[var(--fg)]">
      {v}
      {href && <ExternalLink className="h-3 w-3 text-[var(--fg-muted)]" />}
    </span>
  );
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{k}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition-colors">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
