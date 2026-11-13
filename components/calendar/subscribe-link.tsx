"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

export function SubscribeLink({ url }: { url: string }) {
  const t = useTranslations("Calendar");
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      input.current?.focus();
      input.current?.select();
      notify("error", t("copyFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="calendar-link"
        className="text-overline text-foreground-muted uppercase"
      >
        {t("link")}
      </label>

      <div className="flex items-center gap-2">
        <input
          ref={input}
          id="calendar-link"
          readOnly
          value={url}
          spellCheck={false}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 min-w-0 flex-1 truncate rounded-full border border-border bg-muted px-4 text-note text-foreground-secondary"
        />

        <Button variant="soft" size="sm" onClick={copy} className="min-w-28">
          {copied ? (
            <Check size={15} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Copy size={15} strokeWidth={1.75} aria-hidden="true" />
          )}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>

      <span aria-live="polite" className="sr-only">
        {copied ? t("copiedAnnounce") : ""}
      </span>
    </div>
  );
}
