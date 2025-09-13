#!/bin/bash

echo "=========================================="
echo "     Vercel Database Migration Tool       "
echo "=========================================="
echo ""

if [ -z "$1" ]; then
  echo "This script will migrate your database schema to Vercel Postgres."
  echo ""
  echo "Usage: ./scripts/migrate-vercel-db.sh \"your-database-url\""
  echo ""
  echo "To get your DATABASE_URL from Vercel:"
  echo "1. Go to your Vercel project dashboard"
  echo "2. Click on 'Storage' tab"
  echo "3. Click on your Postgres database"
  echo "4. Click on '.env.local' tab"
  echo "5. Copy the DATABASE_URL value"
  echo ""
  echo "Then run:"
  echo "./scripts/migrate-vercel-db.sh \"postgres://...\""
  exit 1
fi

DATABASE_URL=$1

echo "🔄 Running migrations on Vercel database..."
echo ""

# Export the DATABASE_URL for Prisma
export DATABASE_URL="$DATABASE_URL"

# Run migrations
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migrations completed successfully!"
  echo ""
  echo "Checking tables..."
  psql "$DATABASE_URL" -c "\dt" 2>/dev/null || echo "Note: psql not installed, skipping table check"
  echo ""
  echo "Your database is now ready!"
  echo "Users should be able to sign up and log in now."
else
  echo ""
  echo "❌ Migration failed. Please check the error above."
  exit 1
fi