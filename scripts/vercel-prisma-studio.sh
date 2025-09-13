#!/bin/bash

# Script to open Prisma Studio with Vercel database
# Usage: DATABASE_URL="your-vercel-db-url" ./scripts/vercel-prisma-studio.sh

if [ -z "$DATABASE_URL" ]; then
  echo "Usage: DATABASE_URL=\"postgres://...\" ./scripts/vercel-prisma-studio.sh"
  echo ""
  echo "Get your DATABASE_URL from Vercel:"
  echo "1. Go to your Vercel project dashboard"
  echo "2. Click on 'Storage' tab"
  echo "3. Click on your Postgres database"
  echo "4. Copy the DATABASE_URL from '.env.local' tab"
  echo ""
  echo "Then run:"
  echo "DATABASE_URL=\"your-url-here\" ./scripts/vercel-prisma-studio.sh"
  exit 1
fi

echo "Opening Prisma Studio with Vercel database..."
echo "This will open in your browser at http://localhost:5555"
echo ""

# Generate Prisma client first
npx prisma generate

# Open Prisma Studio
npx prisma studio