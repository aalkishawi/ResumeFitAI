"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// Reads the current theme from the <html> class (set before hydration by the
// inline script in the root layout) and re-renders on toggle — via an external
// store so we never call setState inside an effect.

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);

  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={dark ? "Switch to light" : "Switch to dark"}
      className="rounded-lg border border-white/15 p-1.5 text-slate-200 hover:bg-white/10"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
