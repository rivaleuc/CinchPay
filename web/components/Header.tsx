"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Logo } from "@/components/cinch/primitives";

export function Header() {
  const pathname = usePathname();
  if (pathname?.startsWith("/checkout")) return null;

  return (
    <header className="border-b border-white/[0.06] bg-[#07080a]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/demo" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100 transition-colors">
            Demo
          </Link>
          <Link href="/integrate" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100 transition-colors">
            Docs
          </Link>
          <Link href="/m" className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100 transition-colors">
            Dashboard
          </Link>
          <div className="ml-2">
            <ConnectButton
              chainStatus="none"
              accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
              showBalance={false}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
