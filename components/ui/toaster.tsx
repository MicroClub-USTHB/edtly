"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="bottom-center"
      mobileOffset={{ bottom: 92 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-2 rounded-banner bg-foreground px-3.5 py-3 text-note text-background shadow-[0_8px_24px_rgb(30_22_21/0.18)]",
          actionButton: "ml-auto underline underline-offset-3",
        },
      }}
    />
  );
}
