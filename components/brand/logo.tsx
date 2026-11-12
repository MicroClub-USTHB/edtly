import { LETTERS, markA11y, SYMBOL_FRAME, type MarkProps } from "./logo-paths";

export function Logo({ tone = "brand", title = "Edtly", ...props }: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2493.62 949"
      fill="currentColor"
      {...markA11y(title)}
      {...props}
    >
      <g transform="scale(6.04)">
        <path d={SYMBOL_FRAME} />
        <rect
          x="45"
          y="45"
          width="50"
          height="30"
          rx="15"
          className={tone === "brand" ? "fill-primary" : undefined}
        />
      </g>

      <g transform="translate(769.62 0)">
        {LETTERS.map((d) => (
          <path key={d.slice(0, 12)} d={d} />
        ))}
      </g>
    </svg>
  );
}
