# ═══════════════════════════════════════════════
#  Pharmacy Cashback — Multi-stage Dockerfile
# ═══════════════════════════════════════════════
#  Build for specific app:
#    docker build --build-arg APP=api -t pharmacy-api .
#    docker build --build-arg APP=worker -t pharmacy-worker .
#    docker build --build-arg APP=bot -t pharmacy-bot .
# ═══════════════════════════════════════════════

# ── Base stage ──────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache tini
WORKDIR /app

# ── Dependencies stage ──────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/bot/package.json apps/bot/
COPY packages/database/package.json packages/database/
COPY packages/common/package.json packages/common/
COPY packages/config/package.json packages/config/
COPY packages/events/package.json packages/events/
COPY packages/queue/package.json packages/queue/
COPY packages/cache/package.json packages/cache/

# Install all workspace dependencies
RUN npm ci --only=production && \
    npm prune --production && \
    npm cache clean --force

# ── Full deps (including dev) for build ─────────
FROM base AS deps-dev
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/bot/package.json apps/bot/
COPY packages/database/package.json packages/database/
COPY packages/common/package.json packages/common/
COPY packages/config/package.json packages/config/
COPY packages/events/package.json packages/events/
COPY packages/queue/package.json packages/queue/
COPY packages/cache/package.json packages/cache/

RUN npm ci && npm cache clean --force

# ── Prisma generate stage ───────────────────────
FROM deps-dev AS prisma
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/src ./packages/database/src
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# ── Build stage ─────────────────────────────────
FROM prisma AS build
ARG APP=api
COPY tsconfig.json nest-cli.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
RUN npx nest build ${APP}

# Remove dev dependencies after build
RUN npm prune --production

# ── Production stage ────────────────────────────
FROM base AS production
ARG APP=api
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=build /app/dist/apps/${APP} ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/package.json ./

# Install tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD node -e "require('http').get('http://localhost:${API_PORT:-4000}/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

USER node
CMD ["node", "dist/main.js"]
