import { useTranslations } from "next-intl";
import { LogoSymbol } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <LogoSymbol title="" className="mb-4 size-12" />

      <h1 className="text-[28px] leading-8.5">{t("title")}</h1>
      <p className="max-w-sm text-base leading-6 text-foreground-secondary">
        {t("description")}
      </p>

      <Link
        href="/"
        className="mt-4 inline-flex h-12 items-center rounded-full bg-primary px-5 text-[15px] leading-5 text-primary-foreground transition-colors duration-120 ease-out hover:bg-primary-hover active:bg-primary-active"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
