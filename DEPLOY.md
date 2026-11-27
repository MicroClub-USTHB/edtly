# Deploying Edtly to dokploy

Edtly is one Next.js container with no database and no secrets. CI builds the image and pushes it to
GitHub Container Registry (GHCR); dokploy **pulls** it as a Compose app described in
[`docker-compose.prod.yml`](docker-compose.prod.yml). The server never builds the image. The public site is
`https://edtly.microclub.info`.

The timetable JSON (`data/`) and `NEXT_PUBLIC_SITE_URL` are baked into the image at build time, so a timetable
update is a new image: merge to `main`, CI builds, dokploy redeploys.

## Pipeline

1. Pull request to `main`: `ci` runs lint, type check, tests and a build, then the `docker` job builds the image without pushing it.
2. Push to `main`: the same, and the `docker` job also pushes (`linux/amd64`)
   `ghcr.io/microclub-usthb/edtly` with the tags `latest` and `sha-<short commit>`.
3. dokploy (auto deploy on push to `main`) recreates the stack. `pull_policy: always` makes it pull the image.

The image is built from the repository root: `docker build -t edtly .` (see [`Dockerfile`](Dockerfile): Bun installs,
Node builds the Next.js standalone output, a non-root Node alpine image runs `server.js`).

## One-time setup

1. **GHCR package visibility.** The first push creates the package as private. Make it **Public** once
   (GitHub → org Packages → `edtly` → Package settings → Change visibility), or let dokploy pull with the `ghcr`
   registry entry.
2. **dokploy Compose app.** Create → Compose, source = GitHub repository `MicroClub-USTHB/edtly`, branch `main`,
   compose path `./docker-compose.prod.yml`, auto deploy on.
3. **Domain.** Add `edtly.microclub.info` to the `web` service, container port `3000`, HTTPS with Let's Encrypt.
4. **DNS.** A record `edtly` → the dokploy server, proxied through Cloudflare.

No environment variables are required. `IMAGE_TAG` is optional (see below).

## Pinning and rolling back

CI pushes every `main` build as `latest` and as an immutable `sha-<short commit>` tag (visible under the package's
Tags). To roll back, set `IMAGE_TAG=sha-1a2b3c4` in the dokploy env panel and redeploy; remove it to follow `latest` again.

## Checking a deploy

```bash
curl -I https://edtly.microclub.info/en        # 200, X-Content-Type-Options: nosniff
curl -I https://edtly.microclub.info/sw.js     # the service worker route, version = commit
```

The container has a health check on `/en`; dokploy shows it as healthy once the app answers.
