import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LangToggle } from "@/components/shared/lang-toggle";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("Metadata");

  return {
    title: { absolute: `${t("title")} · ${t("tagline")}` },
    alternates: alternatesFor(locale, "/"),
  };
}

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <>
      <header className="flex flex-wrap items-center justify-end gap-3 px-5 pt-4">
        <LangToggle />
        <ModeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-10 px-5 py-24 text-center">
        <Logo className="h-14 w-auto sm:h-18" />
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-balance text-[32px] leading-10 tracking-[-0.01em] sm:text-[40px] sm:leading-12">
            {t("title")}
          </h1>
          <p className="max-w-md text-base leading-6 text-foreground-secondary">
            {t("description")}
          </p>
        </div>
      </main>
    </>
  );
}
