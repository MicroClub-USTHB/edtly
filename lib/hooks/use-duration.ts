import { useTranslations } from "next-intl";

export function useDuration() {
  const t = useTranslations("Duration");

  return (total: number) => {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    if (hours === 0) return t("minutes", { minutes });
    if (minutes === 0) return t("hours", { hours });
    return t("hoursMinutes", {
      hours,
      minutes,
      padded: String(minutes).padStart(2, "0"),
    });
  };
}
