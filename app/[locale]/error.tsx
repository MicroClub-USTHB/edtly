"use client";

import { useTranslations } from "next-intl";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-[28px] leading-8.5">{t("title")}</h1>
      <p
        role="status"
        className="max-w-sm text-base leading-6 text-foreground-secondary"
      >
        {t("description")}
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-4 h-12 rounded-full bg-primary px-5 text-[15px] leading-5 text-primary-foreground transition-colors duration-120 ease-out hover:bg-primary-hover active:bg-primary-active"
      >
        {t("retry")}
      </button>
    </main>
  );
}
