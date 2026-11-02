import { useEffect, useState } from "react";
import type { KeyValueStorage } from "../scheme/readings";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "xiaohe.theme.v1";

const PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return PREFERENCES.includes(value as ThemePreference) ? (value as ThemePreference) : "system";
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

export function readThemePreference(storage: KeyValueStorage): ThemePreference {
  return parseThemePreference(storage.getItem(THEME_STORAGE_KEY));
}

export function writeThemePreference(storage: KeyValueStorage, preference: ThemePreference): void {
  storage.setItem(THEME_STORAGE_KEY, preference);
}

export function applyTheme(preference: ThemePreference, root: HTMLElement, systemPrefersDark: boolean): ResolvedTheme {
  const resolved = resolveTheme(preference, systemPrefersDark);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => readThemePreference(window.localStorage));
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    applyTheme(preference, document.documentElement, systemDark);
    writeThemePreference(window.localStorage, preference);
  }, [preference, systemDark]);

  return {
    preference,
    resolved: resolveTheme(preference, systemDark),
    setPreference,
  };
}

export const THEME_LABEL: Record<ThemePreference, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
};
