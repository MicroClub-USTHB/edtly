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

export const minutesNow = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();

export const daysBetween = (from: number, to: number) =>
  Math.floor((to - from) / DAY_MS);

export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);
