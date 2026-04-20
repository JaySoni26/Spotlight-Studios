"use client";

import * as React from "react";

export type ThemeName = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName | string) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function systemPref(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(theme: ThemeName): "light" | "dark" {
  return theme === "system" ? systemPref() : theme;
}

function applyDom(theme: ThemeName) {
  const r = resolve(theme);
  document.documentElement.classList.toggle("dark", r === "dark");
  document.documentElement.style.colorScheme = r;
}

function parseTheme(raw: unknown): ThemeName {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeName>("system");

  const resolvedTheme = resolve(theme);

  React.useLayoutEffect(() => {
    applyDom(theme);
  }, [theme]);

  React.useLayoutEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const t = parseTheme(data.ui_theme);
        setThemeState(t);
        applyDom(t);
      } catch {
        if (!cancelled) applyDom("system");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") applyDom("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = React.useCallback((t: ThemeName | string) => {
    const v = parseTheme(t);
    setThemeState(v);
    applyDom(v);
    void fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ui_theme: v }),
    }).catch(() => {});
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
