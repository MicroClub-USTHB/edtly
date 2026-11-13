import { Logo } from "@/components/brand/logo";

const BLOCK = "bg-muted motion-safe:animate-skeleton";

export function TimetableSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-dvh w-full flex-col"
    >
      <div className="flex items-center justify-between px-gutter pt-4">
        <Logo className="mt-1.5 h-7.5 w-auto [view-transition-name:edtly-logo]" />
        <span className={`${BLOCK} h-11 w-32 rounded-full`} />
      </div>

      <div className="flex flex-col gap-2 px-gutter pt-5.5">
        <span className={`${BLOCK} h-3 w-21 rounded-full`} />
        <span className={`${BLOCK} h-6.5 w-59 rounded-full`} />
      </div>

      <span className={`${BLOCK} mx-gutter mt-3.5 h-13 rounded-full`} />

      <div className="flex gap-1 px-gutter pt-3 pb-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className={`${BLOCK} h-14 flex-1 rounded-chip`} />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 px-gutter">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex gap-3">
            <span className="flex w-10.5 shrink-0 flex-col gap-2 pt-3.5">
              <span className={`${BLOCK} h-3 w-9.5 rounded-full`} />
              <span className={`${BLOCK} h-2.5 w-7.5 rounded-full`} />
            </span>
            <span className={`${BLOCK} h-17 flex-1 rounded-session`} />
          </div>
        ))}
      </div>
    </div>
  );
}
