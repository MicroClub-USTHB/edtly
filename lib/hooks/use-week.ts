import { addDays, todayIndex, weekStart } from "@/lib/dates";
import { useNow } from "@/lib/stores/clock";

export type Week = {
  now: Date | null;
  dates: Date[] | null;
  today: number | null;
};

export function useWeek(weekOffset = 0): Week {
  const now = useNow();
  if (!now) return { now, dates: null, today: null };

  const start = weekStart(now, weekOffset);
  return {
    now,
    dates: Array.from({ length: 6 }, (_, index) => addDays(start, index)),
    today: weekOffset === 0 ? todayIndex(now) : null,
  };
}
