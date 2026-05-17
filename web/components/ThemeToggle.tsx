"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "cp-theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initial: Theme = "light";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "dark" || saved === "light") {
        initial = saved;
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      }
    } catch {}
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  // Render a stable shell during SSR / before mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={
          "inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--paper)] " +
          (className || "")
        }
      />
    );
  }

  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={isDark ? "Light mode" : "Dark mode"}
      className={
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--paper)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)] transition-colors " +
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
