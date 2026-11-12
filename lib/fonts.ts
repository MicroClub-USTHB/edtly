import { Varela_Round } from "next/font/google";
import localFont from "next/font/local";

export const bpmfHuninn = localFont({
  src: "../public/fonts/bpmf-huninn-latin.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-bpmf-huninn",
  display: "swap",
});

export const varelaRound = Varela_Round({
  variable: "--font-varela-round",
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});
