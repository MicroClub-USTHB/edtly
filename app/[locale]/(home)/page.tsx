import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Onboarding } from "@/components/academic/onboarding";
import { Logo } from "@/components/brand/logo";
import { Disclaimer } from "@/components/shared/disclaimer";
import { JsonLd } from "@/components/shared/json-ld";
import { resumeScript } from "@/lib/boot-script";
import { alternatesFor } from "@/lib/seo";
import { site } from "@/lib/site";
import { getCatalogue } from "@/lib/timetable/data";
import { localized } from "@/lib/timetable/paths";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("Metadata");

  return {
    title: { absolute: `${t("title")} · ${t("tagline")}` },
    alternates: alternatesFor(locale, "/"),
  };
}

export default async function HomePage() {
  const [locale, catalogue, t, metadata] = await Promise.all([
    rootLocale(),
    getCatalogue(),
    getTranslations("Onboarding"),
    getTranslations("Metadata"),
  ]);
  const url = site.url + localized(locale, "/");

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: resumeScript(locale) }} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: site.name,
              alternateName: metadata("tagline"),
              url,
              inLanguage: locale,
            },
            {
              "@type": "WebApplication",
              name: site.name,
              url,
              description: metadata("description"),
              applicationCategory: "EducationalApplication",
              operatingSystem: "Any",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "DZD" },
            },
          ],
        }}
      />

      <div className="mx-auto flex min-h-dvh w-full max-w-140 flex-col px-gutter pt-4 pb-5 lg:max-w-none lg:px-8 lg:pt-5 lg:pb-8">
        <Logo className="mt-1.5 h-7.5 w-auto shrink-0 self-start [view-transition-name:edtly-logo] lg:h-8" />

        <main className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-110 lg:flex-none lg:pt-18 lg:pb-10">
          <h1 className="sr-only">{`${metadata("title")} · ${metadata("tagline")}`}</h1>

          <div className="flex flex-col gap-2 pt-8 pb-7 lg:pt-0">
            <h2 className="text-screen lg:text-title">{t("title")}</h2>
            <p className="text-label leading-5.5 text-foreground-secondary lg:text-base">
              {t("description")}
            </p>
          </div>

          <Onboarding catalogue={catalogue} />

          <p className="mt-auto pt-8 text-center text-meta text-foreground-muted lg:mt-0 lg:pt-7 lg:text-left">
            {t("footnote")}
          </p>

          <Disclaimer className="hidden pt-2 lg:block" />
        </main>
      </div>
    </>
  );
}
