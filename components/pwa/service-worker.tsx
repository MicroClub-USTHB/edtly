"use client";

import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;

export function ServiceWorker() {
  const t = useTranslations("Pwa");

  const notifyUpdate = useEffectEvent((apply: () => void) => {
    toast(t("updateReady"), {
      id: "pwa-update",
      duration: Number.POSITIVE_INFINITY,
      action: { label: t("update"), onClick: apply },
    });
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()));
      return;
    }

    const container = navigator.serviceWorker;
    const hadController = Boolean(container.controller);
    let registration: ServiceWorkerRegistration | undefined;
    let reloading = false;

    const apply = () =>
      registration?.waiting?.postMessage({ type: "SKIP_WAITING" });

    const onWaiting = () => {
      if (container.controller) notifyUpdate(apply);
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) onWaiting();
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") onWaiting();
        });
      });
    };

    const check = () => {
      registration?.update().catch(() => {});
    };

    const onControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") apply();
      else check();
    };

    container.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", check);
    const interval = window.setInterval(check, UPDATE_CHECK_INTERVAL);

    container
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        watch(reg);
      })
      .catch(() => {});

    return () => {
      container.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", check);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
