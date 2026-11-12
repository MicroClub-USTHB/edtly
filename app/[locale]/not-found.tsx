import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Link } from "next-view-transitions";
import { LogoSymbol } from "@/components/brand/logo-symbol";
import { buttonVariants } from "@/components/ui/button";
import { staleParcoursScript } from "@/lib/boot-script";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const [locale, t] = await Promise.all([
    rootLocale(),
    getTranslations("NotFound"),
  ]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-gutter text-center">
      <script dangerouslySetInnerHTML={{ __html: staleParcoursScript }} />
      <LogoSymbol title="" className="mb-4 size-12" />

      <h1 className="text-title">{t("title")}</h1>
      <p className="max-w-sm text-base text-foreground-secondary">
        {t("description")}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Link href={`/${locale}`} className={cn(buttonVariants())}>
          {t("backHome")}
        </Link>
        <a
          href="https://finfo.usthb.dz/etudes/emploi-du-temps"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("facultyPage")}
        </a>
      </div>
    </main>
  );
}
