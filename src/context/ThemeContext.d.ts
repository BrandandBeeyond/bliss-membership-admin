import type { FC, ReactNode } from "react";

export interface ThemeContextValue {
  theme: string;
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps>;
export const useTheme: () => ThemeContextValue;
