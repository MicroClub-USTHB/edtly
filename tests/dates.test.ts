import { describe, expect, test } from "bun:test";
import { daysBetween, todayIndex, weekStart } from "@/lib/dates";

describe("university week", () => {
  test("starts on Saturday and ends on Thursday", () => {
    expect(todayIndex(new Date(2026, 10, 14))).toBe(0);
    expect(todayIndex(new Date(2026, 10, 15))).toBe(1);
    expect(todayIndex(new Date(2026, 10, 19))).toBe(5);
    expect(todayIndex(new Date(2026, 10, 13))).toBeNull();
  });

  test("anchors any day to its Saturday", () => {
    expect(weekStart(new Date(2026, 10, 12)).getDate()).toBe(7);
    expect(weekStart(new Date(2026, 10, 14)).getDate()).toBe(14);
    expect(weekStart(new Date(2026, 10, 12), 1).getDate()).toBe(14);
  });

  test("shows the coming week on Friday", () => {
    expect(weekStart(new Date(2026, 10, 13)).getDate()).toBe(14);
  });

  test("counts whole days", () => {
    const from = new Date(2026, 10, 1).getTime();
    expect(daysBetween(from, new Date(2026, 10, 13, 8).getTime())).toBe(12);
  });
});
