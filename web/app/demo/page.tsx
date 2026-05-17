"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Shirt,
  Headphones,
  Coffee,
  Disc3,
  Music,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button, Label } from "@/components/cinch/primitives";
import { newPaymentId, shortAddr } from "@/lib/format";
import { EXPLORER } from "@/lib/contract";

type Product = {
  id: string;
  name: string;
  sub: string;
  price: string;
  Icon: typeof Shirt;
};

const products: Product[] = [
  { id: "tee_001", name: "CinchPay tee", sub: "Heavyweight cotton, charcoal", price: "29.99", Icon: Shirt },
  { id: "hood_002", name: "CinchPay hoodie", sub: "Cropped fit, midnight", price: "74.00", Icon: Shirt },
  { id: "buds_003", name: "wireless earbuds", sub: "Active noise cancelling", price: "129.00", Icon: Headphones },
  { id: "mug_004", name: "enamel mug", sub: "12oz, matte finish", price: "18.00", Icon: Coffee },
  { id: "vinyl_005", name: "vinyl record", sub: "Original soundtrack, 180g", price: "34.00", Icon: Disc3 },
  { id: "cap_006", name: "field cap", sub: "Embroidered logo, unstructured", price: "32.00", Icon: Music },
];

export default function DemoShop() {
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState<Product | null>(null);
  const [paid, setPaid] = useState<{ product: Product; txHash: string } | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "cinchpay:success") {
        const product = open;
        if (product) {
          setPaid({ product, txHash: e.data.payload?.txHash || "" });
          setOpen(null);
        }
      }
      if (e.data?.type === "cinchpay:close") setOpen(null);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [open]);

  return (
    <div className="flex-1">
      {/* Hero band */}
      <section className="relative border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <Label className="text-[#5b8cff]">Demo shop</Label>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">
            Fictional store, real payments.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
            Everything except the checkout is fake. Click buy on any item to see a live USDC payment flow on Arc Testnet.
          </p>
          <p className="mt-5 text-sm text-zinc-500">
            You receive payments at:{" "}
            {isConnected ? (
              <span className="font-mono text-zinc-300">{shortAddr(address)}</span>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="font-medium text-[#5b8cff] hover:underline"
                  >
                    Connect a wallet
                  </button>
                )}
              </ConnectButton.Custom>
            )}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0e11] transition-colors hover:border-white/15"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#11141a] via-[#0c0e11] to-[#0a0b0e]">
                <div className="absolute inset-0 bg-dots opacity-40" />
                <div className="relative flex h-full items-center justify-center">
                  <p.Icon
                    className="h-12 w-12 text-zinc-700 transition-colors group-hover:text-zinc-500"
                    strokeWidth={1.25}
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-zinc-100">{p.name}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{p.sub}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="tabular text-[15px] font-medium text-zinc-100">
                      {p.price}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                      USDC
                    </span>
                  </div>
                  <Button
                    disabled={!isConnected}
                    onClick={() => setOpen(p)}
                    className="px-3 py-1.5 text-xs"
                  >
                    Buy
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout modal */}
      {open && address && (
        <CheckoutModal product={open} merchant={address} onClose={() => setOpen(null)} />
      )}

      {/* Success modal */}
      {paid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0c0e11] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/5">
              <Check className="h-6 w-6 text-emerald-400" strokeWidth={2.5} />
            </div>
            <h2 className="mt-6 text-xl font-medium tracking-tight text-zinc-100">
              Order confirmed
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your {paid.product.name} is on the way.
            </p>
            <div className="mt-6 space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-left">
              <DetailLine k="Order" v={paid.product.id} />
              <DetailLine k="Paid" v={`${paid.product.price} USDC`} />
              <DetailLine
                k="Tx"
                v={`${paid.txHash.slice(0, 8)}…${paid.txHash.slice(-6)}`}
                href={`${EXPLORER}/tx/${paid.txHash}`}
              />
            </div>
            <Button onClick={() => setPaid(null)} className="mt-6 w-full">
              Keep shopping
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutModal({
  product,
  merchant,
  onClose,
}: {
  product: Product;
  merchant: `0x${string}`;
  onClose: () => void;
}) {
  const [paymentId] = useState(() => newPaymentId());
  const url = `/checkout?merchant=${merchant}&amount=${product.price}&token=USDC&orderId=${product.id}&paymentId=${paymentId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative w-full max-w-[440px]">
        <iframe
          src={url}
          title="CinchPay checkout"
          className="h-[640px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#07080a] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        />
      </div>
    </div>
  );
}

function DetailLine({ k, v, href }: { k: string; v: string; href?: string }) {
  const inner = (
    <span className="tabular font-mono text-zinc-300 inline-flex items-center gap-1">
      {v}
      {href && <ExternalLink className="h-3 w-3 text-zinc-500" />}
    </span>
  );
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{k}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:text-zinc-100 transition-colors">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
