"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Always render children - next-themes handles SSR gracefully
  // The key is to NOT skip rendering based on mounted state
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
