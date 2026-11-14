export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

export const DURATION = {
  press: 0.12,
  base: 0.2,
  sheet: 0.28,
  lift: 0.32,
  land: 0.36,
  reduced: 0.08,
} as const;

export const ms = (seconds: number) => seconds * 1000;

function springCurve(damping: number, samples = 32) {
  const omega = Math.log(1000) / damping;
  const damped = omega * Math.sqrt(1 - damping * damping);
  const values = Array.from({ length: samples + 1 }, (_, index) => {
    const time = index / samples;
    const decay = Math.exp(-damping * omega * time);
    return (
      1 -
      decay *
        (Math.cos(damped * time) +
          ((damping * omega) / damped) * Math.sin(damped * time))
    );
  });
  values[samples] = 1;
  return `linear(${values.map((value) => Number(value.toFixed(4))).join(", ")})`;
}

const SPRING_CURVE = springCurve(0.72);
const EASE_OUT_CSS = `cubic-bezier(${EASE_OUT.join(", ")})`;

export const springEasing = () =>
  typeof CSS !== "undefined" &&
  CSS.supports("transition-timing-function", "linear(0, 1)")
    ? SPRING_CURVE
    : EASE_OUT_CSS;

export const easeOutCss = () => EASE_OUT_CSS;

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
