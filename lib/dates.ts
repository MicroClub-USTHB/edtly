const DAY_MS = 24 * 60 * 60 * 1000;

export function todayIndex(date: Date): number | null {
  const index = (date.getDay() + 1) % 7;
  return index < 6 ? index : null;
}

export function weekStart(date: Date, weekOffset = 0): Date {
  const index = (date.getDay() + 1) % 7;
  const shift = index === 6 ? 1 : -index;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + shift + weekOffset * 7,
  );
}

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const timeOf = (minutes: number) => {
  const clamped = Math.min(Math.max(Math.round(minutes), 0), 23 * 60 + 59);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
};

export const isoDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const minutesNow = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();

export const daysBetween = (from: number, to: number) =>
  Math.floor((to - from) / DAY_MS);

export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);
