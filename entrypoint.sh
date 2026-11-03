#!/bin/sh
set -e

echo "[Entrypoint] Running Prisma database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

if [ "${RUN_ESSENTIAL_SEED:-true}" = "true" ]; then
  echo "[Entrypoint] Running essential master data seed..."
  node ./prisma/dist/prisma/seed-essential.js || echo "[Entrypoint] Essential seed skipped or already applied."
fi

if [ "${RUN_DUMMY_SEED:-false}" = "true" ]; then
  echo "[Entrypoint] Running dummy recruitment data seed..."
  node ./prisma/dist/prisma/seed-dummy.js || echo "[Entrypoint] Dummy seed skipped."
fi

echo "[Entrypoint] Starting Next.js standalone server on port ${PORT:-3020}..."
exec node server.js
