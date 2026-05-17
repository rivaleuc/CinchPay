"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "cp-theme";
type Theme = "light" | "dark";

function readSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  // Start with "light" on server; sync from DOM/localStorage on mount.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Inline <head> script may already have added .dark — read from DOM first.
    const fromDom: Theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    const desired = readSystemTheme();
    const initial = fromDom || desired;
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
      className={
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--paper)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-colors cursor-pointer " +
        (className || "")
      }
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        }`}
        strokeWidth={2}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
        }`}
        strokeWidth={2}
      />
    </button>
  );
}
