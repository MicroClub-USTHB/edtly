import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const appVersion =
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  Date.now().toString(36);

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: appVersion,
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
