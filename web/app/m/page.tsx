"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { Label } from "@/components/cinch/primitives";

export default function MerchantIndex() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) router.replace(`/m/${address}`);
  }, [isConnected, address, router]);

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0c0e11] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <Wallet className="h-5 w-5 text-zinc-300" />
        </div>
        <Label className="mt-5 inline-block">Dashboard</Label>
        <h1 className="mt-2 text-xl font-medium tracking-tight text-zinc-100">
          Connect a wallet
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Your address is your merchant ID. No signup.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}
