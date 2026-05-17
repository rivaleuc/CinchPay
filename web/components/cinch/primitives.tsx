"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm";
}) {
  const sz = size === "sm" ? "text-[15px]" : "text-[19px]";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-[5px] bg-[var(--primary)]"
        aria-hidden
      >
        <span className="h-1.5 w-1.5 rounded-[1.5px] bg-[var(--bg)]" />
      </span>
      <span
        className={cn(
          "font-bold tracking-[-0.02em] text-[var(--fg)] leading-none",
          sz,
        )}
        style={{ fontFeatureSettings: '"ss01"', fontWeight: 700 }}
      >
        cinchpay
      </span>
    </span>
  );
}

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
        "text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]",
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
        "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--paper)] px-2.5 py-0.5 text-[11px] text-[var(--fg-muted)]",
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 pulse-dot" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        </span>
      )}
      {children}
    </span>
  );
}

type ButtonProps = {
  variant?: "primary" | "outline" | "ghost" | "accent";
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium btn-anim disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary)]/90",
    outline:
      "border border-[var(--border-strong)] bg-transparent text-[var(--fg)] hover:bg-[var(--surface)]",
    ghost:
      "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface)]",
    accent:
      "bg-[var(--accent)] text-white shadow-[0_0_0_1px_oklch(0.62_0.14_240/0.3),0_8px_24px_-8px_oklch(0.62_0.14_240/0.4)] hover:bg-[var(--accent)]/95",
  };
  const cls = cn(base, styles[variant], className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

export function HairlineBox({
  children,
  className,
  paper,
}: {
  children: React.ReactNode;
  className?: string;
  paper?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)]",
        paper ? "bg-[var(--paper)]" : "bg-[var(--card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
