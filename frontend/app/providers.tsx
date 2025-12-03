// app/providers.tsx (ou onde você criou)
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // O "...props" é essencial para o attribute="class" funcionar
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
