#!/bin/sh
set -e

# Run Prisma migrations (use local binary, not npx)
./node_modules/.bin/prisma migrate deploy

# Seed admin user if DB is fresh (ignore if already seeded)
node prisma/seed.mjs 2>/dev/null || true

# Start Next.js
exec node server.js
