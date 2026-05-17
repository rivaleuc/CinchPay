"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/cinch/primitives";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" onClick={() => setOpen(false)} aria-label="CinchPay home">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "link-grow transition-colors",
                  active
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA + wallet + theme */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <ConnectButton
            chainStatus="none"
            accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
            showBalance={false}
          />
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-strong)] text-[var(--fg)] hover:bg-[var(--surface)] btn-anim"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] px-6 py-4 fade-in">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-md transition-colors",
                    active
                      ? "bg-[var(--surface)] text-[var(--fg)]"
                      : "text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
            <ConnectButton chainStatus="none" accountStatus="address" showBalance={false} />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
