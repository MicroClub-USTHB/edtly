# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -t edtly .
#
# Bun installs the dependencies (bun.lock), Node builds and runs the app:
# `bun --bun next build` does not work with Next 16.4.6.

ARG NODE_VERSION=24
ARG BUN_VERSION=1.3.13

FROM node:${NODE_VERSION}-alpine AS base
ARG BUN_VERSION
RUN npm install -g bun@${BUN_VERSION} && npm cache clean --force
WORKDIR /app

# ---- deps: cached until package.json or bun.lock change
FROM base AS deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ---- build: Next standalone output (server + traced node_modules + timetable data)
FROM base AS build
ARG NEXT_PUBLIC_SITE_URL=https://edtly.microclub.info
ARG GIT_SHA
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    VERCEL_GIT_COMMIT_SHA=$GIT_SHA \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ---- runtime: no bun, no dev dependencies, non-root
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/en',{redirect:'manual',signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.status<500?0:1),()=>process.exit(1))"
CMD ["node", "server.js"]
