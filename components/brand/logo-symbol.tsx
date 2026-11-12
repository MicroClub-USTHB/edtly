import { markA11y, SYMBOL_FRAME, type MarkProps } from "./logo-paths";

export function LogoSymbol({
  tone = "brand",
  title = "Edtly",
  ...props
}: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      fill="currentColor"
      {...markA11y(title)}
      {...props}
    >
      <path d={SYMBOL_FRAME} />
      <rect
        x="45"
        y="45"
        width="50"
        height="30"
        rx="15"
        className={tone === "brand" ? "fill-primary" : undefined}
      />
    </svg>
  );
}
