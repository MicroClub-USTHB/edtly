import { useSyncExternalStore } from "react";
import { CHECKED_AT_KEY } from "@/lib/stores/storage-keys";

export type UpdateState = {
  ready: boolean;
  failed: boolean;
  checkedAt: number | null;
};

export type CheckResult = "updated" | "current" | "failed";

const SERVER_STATE: UpdateState = { ready: false, failed: false, checkedAt: null };
const listeners = new Set<() => void>();
let state: UpdateState | null = null;
let registration: ServiceWorkerRegistration | undefined;
let requested = false;

function readCheckedAt() {
  try {
    const value = Number(window.localStorage.getItem(CHECKED_AT_KEY));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

const current = () =>
  (state ??= { ready: false, failed: false, checkedAt: readCheckedAt() });

function update(patch: Partial<UpdateState>) {
  state = { ...current(), ...patch };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function markChecked() {
  const checkedAt = Date.now();
  try {
    window.localStorage.setItem(CHECKED_AT_KEY, String(checkedAt));
  } catch {}
  update({ checkedAt, failed: false });
}

export function setRegistration(next: ServiceWorkerRegistration) {
  registration = next;
}

export const markUpdateReady = () => update({ ready: true });

export async function checkForUpdate(): Promise<CheckResult> {
  if (!registration) return navigator.onLine ? "current" : "failed";
  try {
    await registration.update();
    markChecked();
    return registration.installing || registration.waiting
      ? "updated"
      : "current";
  } catch {
    update({ failed: true });
    return "failed";
  }
}

export const applyWaitingUpdate = () =>
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });

export const updateRequested = () => requested;

export function applyUpdate() {
  requested = true;
  if (registration?.waiting) applyWaitingUpdate();
  else window.location.reload();
}

export const useUpdateState = () =>
  useSyncExternalStore(subscribe, current, () => SERVER_STATE);
