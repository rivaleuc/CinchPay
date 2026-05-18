"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, Check, LogOut, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

export function WalletButton({ className }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            aria-hidden={!ready}
            style={{
              opacity: ready ? 1 : 0,
              pointerEvents: ready ? "auto" : "none",
              userSelect: ready ? "auto" : "none",
            }}
            className={className}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                type="button"
                className="group inline-flex h-9 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-[13px] font-semibold text-[var(--primary-fg)] btn-anim"
              >
                <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} />
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-red-500/30 bg-red-500/[0.08] px-3 text-[13px] font-semibold text-red-700 hover:bg-red-500/[0.14] transition-colors"
              >
                Wrong network
              </button>
            ) : (
              <ConnectedPill
                address={account.address}
                displayName={account.displayName}
                onOpenAccount={openAccountModal}
              />
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function ConnectedPill({
  address,
  displayName,
  onOpenAccount,
}: {
  address: string;
  displayName: string;
  onOpenAccount: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        type="button"
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--paper)] pl-1.5 pr-2.5 text-[13px] font-semibold text-[var(--fg)] btn-anim",
          open && "bg-[var(--surface)]",
        )}
      >
        <Avatar seed={address} />
        <span className="font-mono tracking-tight">{displayName}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[var(--fg-muted)] transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-[var(--border-strong)] bg-[var(--paper)] shadow-[0_12px_40px_-12px_oklch(0.55_0.08_240/0.25)] overflow-hidden fade-in z-50">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-3">
            <Avatar seed={address} size={36} />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] font-bold">
                Connected
              </div>
              <div className="font-mono text-[12px] text-[var(--fg)] truncate">
                {displayName}
              </div>
            </div>
          </div>
          <div className="py-1">
            <MenuItem
              icon={copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Copy className="h-3.5 w-3.5" />}
              label={copied ? "Copied!" : "Copy address"}
              onClick={copy}
            />
            <MenuItem
              icon={<LogOut className="h-3.5 w-3.5" />}
              label="Account & disconnect"
              onClick={() => {
                setOpen(false);
                onOpenAccount();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-[var(--fg)] hover:bg-[var(--surface)] transition-colors"
    >
      <span className="text-[var(--fg-muted)]">{icon}</span>
      {label}
    </button>
  );
}

function Avatar({ seed, size = 22 }: { seed: string; size?: number }) {
  // Deterministic gradient avatar based on address hash
  const hash = simpleHash(seed.toLowerCase());
  const hues = [
    [220, 250],
    [190, 230],
    [250, 280],
    [160, 200],
    [200, 240],
    [280, 320],
  ] as const;
  const pair = hues[hash % hues.length]!;
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full ring-1 ring-[var(--border-strong)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${pair[0]} 65% 60%), hsl(${pair[1]} 70% 55%))`,
      }}
    />
  );
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
