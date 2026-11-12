"use client";

import { useTranslations } from "next-intl";
import { useOffline } from "next/offline";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function OfflineStatus() {
  const t = useTranslations("Pwa");
  const unreachable = useOffline();
  const disconnected = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  const offline = unreachable || disconnected;

  useEffect(() => {
    if (!offline) return;
    toast(t("offline"), {
      id: "pwa-offline",
      duration: Number.POSITIVE_INFINITY,
    });
    return () => {
      toast.dismiss("pwa-offline");
    };
  }, [offline, t]);

  return null;
}
