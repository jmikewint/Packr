# --- deps: install once, cached independently of source changes ---
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder ---
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js inlines NEXT_PUBLIC_* values into the client bundle at build time,
# not at container start - so they must be build args here, not just
# environment vars on the compose service. They are fetched from the
# *browser*, not from other containers, so these should be host-reachable
# URLs (e.g. the ports Compose publishes to localhost), never the internal
# Docker service names - a browser outside the Compose network can't resolve
# those.
ARG NEXT_PUBLIC_CATALOG_URL=http://localhost:4001
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:4002
ARG NEXT_PUBLIC_PRICING_URL=http://localhost:4003
ENV NEXT_PUBLIC_CATALOG_URL=$NEXT_PUBLIC_CATALOG_URL \
    NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL \
    NEXT_PUBLIC_PRICING_URL=$NEXT_PUBLIC_PRICING_URL

RUN npm run build

# --- runtime: minimal image, non-root user ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 appuser \
    && useradd --system --uid 1001 --gid appuser appuser

COPY --from=builder /app/public ./public
# .next/standalone already contains a pruned, self-contained node_modules -
# no `npm ci` needed in this stage at all.
COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static

USER appuser
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
