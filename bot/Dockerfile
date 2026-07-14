# ── Pharmacy Cashback Bot ──────────────────────
FROM node:22-alpine AS base

RUN apk add --no-cache tini
WORKDIR /app

# ── Dependencies ───────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/
RUN npm ci && npx prisma generate

# ── Build ──────────────────────────────────────
FROM deps AS build
COPY . .
RUN npm run build || true  # optional: tsc output

# ── Production ─────────────────────────────────
FROM base AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json .
COPY tsconfig.json .
COPY src/ ./src/

EXPOSE 3001
ENTRYPOINT ["tini", "--"]
CMD ["npx", "tsx", "src/index.ts"]
