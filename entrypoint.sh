#!/bin/sh
set -e

echo "[Entrypoint] Running Prisma database migrations..."
npx prisma migrate deploy

if [ "$RUN_ESSENTIAL_SEED" = "true" ]; then
  echo "[Entrypoint] Running essential master data seed..."
  node prisma/seed-essential.cjs 2>/dev/null || echo "[Entrypoint] Seed skipped or already applied."
fi

echo "[Entrypoint] Starting Next.js standalone server on port ${PORT:-3020}..."
exec node server.js

