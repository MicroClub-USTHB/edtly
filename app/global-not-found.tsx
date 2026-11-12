import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";
import { LogoSymbol } from "@/components/brand/logo-symbol";
import { buttonVariants } from "@/components/ui/button";
import { staleParcoursScript } from "@/lib/boot-script";
import { bpmfHuninn, varelaRound } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "404 · Edtly",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html
      lang="fr"
      className={`${bpmfHuninn.variable} ${varelaRound.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        <script dangerouslySetInnerHTML={{ __html: staleParcoursScript }} />
        <LogoSymbol title="" className="mb-4 size-12" />
        <h1 className="text-title">Page introuvable</h1>
        <p className="text-base text-foreground-secondary">
          Cette page ou ce parcours n&apos;existe pas, ou n&apos;est plus
          publié.
        </p>

        <Link href="/" className={`${buttonVariants()} mt-4`}>
          Retour à l&apos;accueil
        </Link>
      </body>
    </html>
  );
}
