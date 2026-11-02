import { createContext, useContext, type ReactNode } from "react";
import { useTheme } from "./theme";

type ThemeState = ReturnType<typeof useTheme>;

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeState(): ThemeState {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider 未挂载");
  return context;
}
