"use client";

import { useTheme } from "next-themes";
import { useLayoutEffect } from "react";
import { site } from "@/lib/site";

export function ThemeClassSync() {
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) =>
        meta.setAttribute("content", site.colors.background[resolvedTheme]),
      );
  }, [resolvedTheme]);

  return null;
}
