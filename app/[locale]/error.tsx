"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-gutter text-center">
      <h1 className="text-title">{t("title")}</h1>
      <p role="status" className="max-w-sm text-base text-foreground-secondary">
        {t("description")}
      </p>

      <Button className="mt-4" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
}
