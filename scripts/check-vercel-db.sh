#!/bin/bash

# Script to connect to Vercel Postgres and check users
# Usage: ./scripts/check-vercel-db.sh "your-database-url"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/check-vercel-db.sh \"postgres://...\""
  echo ""
  echo "Get your DATABASE_URL from Vercel:"
  echo "1. Go to your Vercel project dashboard"
  echo "2. Click on 'Storage' tab"
  echo "3. Click on your Postgres database"
  echo "4. Copy the DATABASE_URL from '.env.local' tab"
  exit 1
fi

DATABASE_URL=$1

echo "Connecting to Vercel Postgres..."
echo ""

# Check if users exist
psql "$DATABASE_URL" -c "SELECT id, email, name, role, createdAt FROM \"User\";"

echo ""
echo "Checking sessions..."
psql "$DATABASE_URL" -c "SELECT id, userId, expiresAt FROM \"Session\" ORDER BY expiresAt DESC LIMIT 5;"

echo ""
echo "Checking workspaces..."
psql "$DATABASE_URL" -c "SELECT id, name, createdAt FROM \"Workspace\";"

echo ""
echo "Checking workspace members..."
psql "$DATABASE_URL" -c "SELECT w.name as workspace, u.email as user, wm.role FROM \"WorkspaceMember\" wm JOIN \"Workspace\" w ON wm.workspaceId = w.id JOIN \"User\" u ON wm.userId = u.id;"