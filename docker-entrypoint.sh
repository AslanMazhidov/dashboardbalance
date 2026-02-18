#!/bin/sh
set -e

# Run Prisma migrations
npx prisma migrate deploy

# Seed admin user if DB is fresh
node prisma/seed.mjs 2>/dev/null || true

# Start Next.js
exec npx next start
