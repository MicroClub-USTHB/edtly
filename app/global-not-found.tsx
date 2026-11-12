import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";
import { LogoSymbol } from "@/components/brand/logo";
import { bpmfHuninn, varelaRound } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "404 · Edtly",
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${bpmfHuninn.variable} ${varelaRound.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col items-center justify-center gap-4 px-5 text-center">
        <LogoSymbol title="" className="mb-4 size-12" />
        <h1 className="text-[28px] leading-8.5">Page not found</h1>
        <p className="text-base leading-6 text-foreground-secondary">
          This page does not exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex h-12 items-center rounded-full bg-primary px-5 text-[15px] leading-5 text-primary-foreground transition-colors duration-120 ease-out hover:bg-primary-hover active:bg-primary-active"
        >
          Go home
        </Link>
      </body>
    </html>
  );
}
