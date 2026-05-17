"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-widest text-[#52525b] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Pill({
  children,
  dot,
  className,
}: {
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-300",
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#5b8cff] opacity-60 pulse-dot" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#5b8cff]" />
        </span>
      )}
      {children}
    </span>
  );
}

type ButtonProps = {
  variant?: "primary" | "outline" | "ghost";
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[#5b8cff] text-white hover:bg-[#6f9bff] shadow-[0_0_0_1px_rgba(91,140,255,0.4),0_8px_24px_-8px_rgba(91,140,255,0.4)]",
    outline:
      "border border-white/10 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.04] hover:border-white/15",
    ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]",
  };
  return (
    <button className={cn(base, styles[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-5 w-5">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#5b8cff] to-[#3b5fcc]" />
        <div className="absolute inset-[3px] rounded-[3px] border border-white/30" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
        CinchPay
      </span>
    </div>
  );
}
