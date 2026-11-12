"use client";

import { useEffect } from "react";
import {
  applyWaitingUpdate,
  checkForUpdate,
  markChecked,
  markUpdateReady,
  setRegistration,
  updateRequested,
} from "@/lib/pwa/update-store";

const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;

export function ServiceWorker() {
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
    let reloading = false;

    const onWaiting = () => {
      if (container.controller) markUpdateReady();
    };

    const watch = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) onWaiting();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") onWaiting();
        });
      });
    };

    const check = () => {
      if (navigator.onLine) void checkForUpdate();
    };

    let pendingReload = false;

    const reload = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const onControllerChange = () => {
      if (!hadController) return;
      if (document.visibilityState === "hidden") pendingReload = true;
      else if (updateRequested()) reload();
      else markUpdateReady();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") applyWaitingUpdate();
      else if (pendingReload) reload();
      else check();
    };

    container.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", check);
    const interval = window.setInterval(check, UPDATE_CHECK_INTERVAL);

    container
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        setRegistration(registration);
        watch(registration);
        if (navigator.onLine) markChecked();
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
