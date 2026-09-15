# --- builder: install deps + generate the Prisma client ---
FROM node:22-slim AS builder
WORKDIR /app

# Prisma's query engine needs OpenSSL on Debian-based images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy only the manifest first so `npm ci` is cached independently of
# source changes - it only re-runs when dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
# Drop devDependencies (the prisma CLI + its engines) now that the client is
# generated - the running service only needs @prisma/client at runtime.
RUN npm prune --omit=dev

# --- runtime: minimal image, non-root user ---
FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 appuser \
    && useradd --system --uid 1001 --gid appuser appuser

COPY --from=builder --chown=appuser:appuser /app ./

USER appuser
EXPOSE 4002
CMD ["node", "index.js"]
