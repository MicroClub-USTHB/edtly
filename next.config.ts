import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import packageJson from "./package.json";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const appVersion =
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  Date.now().toString(36);

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: appVersion,
    APP_RELEASE: packageJson.version,
  },
  experimental: {
    agentFeedback: true,
    globalNotFound: true,
    useOffline: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingIncludes: {
    "/sw.js": ["./lib/pwa/sw.js"],
    "/api/calendar/[feed]": ["./data/**/*.json"],
    "/[locale]/[system]/[level]/[speciality]/[section]": ["./data/**/*.json"],
    "/[locale]/[system]/[level]/[speciality]/[section]/[group]": [
      "./data/**/*.json",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
