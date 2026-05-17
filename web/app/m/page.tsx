"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function MerchantIndex() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) router.replace(`/m/${address}`);
  }, [isConnected, address, router]);

  return (
    <>
      <div className="mx-auto max-w-md px-6 py-32">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]">
            <Wallet className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">
            Dashboard
          </div>
          <h1 className="mt-2 font-serif text-3xl">Connect a wallet</h1>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Your address is your merchant ID. No signup required.
          </p>
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
