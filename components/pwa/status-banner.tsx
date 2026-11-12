"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useOffline } from "next/offline";
import { useSyncExternalStore } from "react";
import { Banner } from "@/components/ui/banner";
import { BannerAction } from "@/components/ui/banner-action";
import { daysBetween } from "@/lib/dates";
import { formatShortDate } from "@/lib/format";
import { notify } from "@/lib/notify";
import {
  applyUpdate,
  checkForUpdate,
  useUpdateState,
} from "@/lib/pwa/update-store";
import { useNow } from "@/lib/stores/clock";
import { cn } from "@/lib/utils";

const STALE_AFTER_DAYS = 7;

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function StatusBanner({ className }: { className?: string }) {
  const t = useTranslations("Pwa");
  const locale = useLocale();
  const now = useNow();
  const { ready, failed, checkedAt } = useUpdateState();
  const unreachable = useOffline();
  const disconnected = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );

  const check = async () => {
    const result = await checkForUpdate();
    if (result === "current") void notify("success", t("upToDate"));
  };

  const age = now && checkedAt ? daysBetween(checkedAt, now.getTime()) : 0;
  const spacing = cn("mx-gutter mt-3 lg:mx-0 lg:mt-0", className);

  if (unreachable || disconnected) {
    return (
      <Banner
        className={spacing}
        icon={<WifiOff size={16} strokeWidth={1.6} aria-hidden="true" />}
      >
        {checkedAt
          ? t("offlineCopy", {
              date: formatShortDate(new Date(checkedAt), locale),
            })
          : t("offline")}
      </Banner>
    );
  }

  if (ready) {
    return (
      <Banner
        tone="success"
        className={spacing}
        action={<BannerAction onClick={applyUpdate}>{t("see")}</BannerAction>}
      >
        {t("updated")}
      </Banner>
    );
  }

  if (failed) {
    return (
      <Banner
        tone="error"
        className={spacing}
        icon={<CircleAlert size={16} strokeWidth={1.6} aria-hidden="true" />}
      >
        {t("checkFailed")}
      </Banner>
    );
  }

  if (age >= STALE_AFTER_DAYS) {
    return (
      <Banner
        tone="warning"
        className={spacing}
        action={<BannerAction onClick={check}>{t("check")}</BannerAction>}
      >
        {t("stale", { days: age })}
      </Banner>
    );
  }

  return null;
}
