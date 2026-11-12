export const site = {
  name: "Edtly",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://edtly.vercel.app").replace(
    /\/$/,
    "",
  ),
  ogImage: { url: "/og.png", width: 1200, height: 630 },
  colors: {
    primary: "#D03232",
    background: { light: "#FFFFFF", dark: "#110D0D" },
  },
} as const;

export const ogLocales = { en: "en_US", fr: "fr_FR" } as const;
