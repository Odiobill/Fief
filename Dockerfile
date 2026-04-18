# Base image
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install

# Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 16.2 Rspack build
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema & migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy full node_modules for Prisma migrate at startup
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy the CJS prisma config (works without TypeScript)
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./prisma.config.js

COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
