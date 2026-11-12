"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

const scriptProps =
  typeof window === "undefined" ? undefined : { type: "application/json" };

function ThemeClassSync() {
  const { resolvedTheme } = useTheme();

  React.useLayoutEffect(() => {
    if (!resolvedTheme) return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider scriptProps={scriptProps} {...props}>
      <ThemeClassSync />
      {children}
    </NextThemesProvider>
  );
}
