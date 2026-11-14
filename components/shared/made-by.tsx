import { useTranslations } from "next-intl";
import { site } from "@/lib/site";

export function MadeBy() {
  const t = useTranslations("Legal");

  return t.rich("madeBy", {
    name: site.author.name,
    link: (chunks) => (
      <a
        href={site.author.url}
        target="_blank"
        rel="noreferrer"
        className="font-bold [font-synthesis:weight] underline underline-offset-2 transition-colors duration-120 ease-out hover:text-foreground motion-reduce:transition-none"
      >
        {chunks}
      </a>
    ),
  });
}
