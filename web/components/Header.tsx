"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/cinch/primitives";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/demo", label: "Demo" },
  { href: "/integrate", label: "Docs" },
  { href: "/m", label: "Dashboard" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname?.startsWith("/checkout")) return null;

  return (
    <header className="border-b border-white/[0.06] bg-[#07080a]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  active ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="ml-2">
            <ConnectButton
              chainStatus="none"
              accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
              showBalance={false}
            />
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] px-6 py-3">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg transition-colors",
                    active
                      ? "bg-white/[0.04] text-zinc-100"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <ConnectButton
              chainStatus="none"
              accountStatus="address"
              showBalance={false}
            />
          </div>
        </div>
      )}
    </header>
  );
}
