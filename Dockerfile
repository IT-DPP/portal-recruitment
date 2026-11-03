FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx --no-install prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Compile Prisma seed scripts to plain CommonJS so they can run in the minimal runtime image
RUN npx tsc prisma/seed-essential.ts prisma/seed-dummy.ts \
  --outDir prisma/dist \
  --module commonjs \
  --target es2020 \
  --moduleResolution node \
  --esModuleInterop \
  --skipLibCheck

# Production runtime image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3020
ENV HOSTNAME="0.0.0.0"

RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache and local upload fallback directory
RUN mkdir -p .next public/uploads && chown -R nextjs:nodejs .next public/uploads

# Standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh

RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3020

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD curl -fsS http://localhost:3020/api/health || exit 1

CMD ["./entrypoint.sh"]
