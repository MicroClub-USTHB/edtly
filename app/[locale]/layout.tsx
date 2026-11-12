import type { Metadata, Viewport } from "next";
import { locale as rootLocale } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ViewTransitions } from "next-view-transitions";
import { OfflineStatus } from "@/components/pwa/offline-status";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { routing } from "@/i18n/routing";
import { bpmfHuninn, varelaRound } from "@/lib/fonts";
import { startupImages } from "@/lib/pwa/splash";
import { ogLocales, site } from "@/lib/site";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const unstable_paramMatching = { locale: "not-found" } as const;

export const viewport: Viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: site.colors.background.light,
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: site.colors.background.dark,
    },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("Metadata");

  return {
    metadataBase: new URL(site.url),
    applicationName: site.name,
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    },
    appleWebApp: {
      title: site.name,
      statusBarStyle: "default",
      startupImage: startupImages,
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: t("title"),
      description: t("description"),
      locale: ogLocales[locale as keyof typeof ogLocales],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => ogLocales[l]),
      images: [{ ...site.ogImage, alt: t("ogImageAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [site.ogImage.url],
    },
  };
}

export default async function LocaleLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();

  return (
    <ViewTransitions>
      <html
        lang={locale}
        className={`${bpmfHuninn.variable} ${varelaRound.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <NextIntlClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <ServiceWorker />
              <OfflineStatus />
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
