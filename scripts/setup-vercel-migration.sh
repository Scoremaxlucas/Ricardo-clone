#!/bin/bash

# Script to prepare PostgreSQL migration for Vercel deployment
# This script updates the schema.prisma to use PostgreSQL and prepares the migration

set -e

echo "🔧 Preparing PostgreSQL migration for Vercel..."

# Backup current schema
if [ ! -f "prisma/schema.prisma.backup" ]; then
  cp prisma/schema.prisma prisma/schema.prisma.backup
  echo "✅ Backup created: prisma/schema.prisma.backup"
fi

# Check if DATABASE_URL is set and points to PostgreSQL
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgres* ]]; then
  echo "✅ DATABASE_URL points to PostgreSQL"
  
  # Update schema to PostgreSQL
  sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  echo "✅ Schema updated to PostgreSQL"
  
  # Generate Prisma Client
  echo "📦 Generating Prisma Client..."
  npx prisma generate
  
  echo "✅ Setup complete! Ready for Vercel deployment."
  echo ""
  echo "Next steps:"
  echo "1. Run: npx prisma migrate deploy"
  echo "2. Or manually execute: psql \$DATABASE_URL < prisma/migrations/20250111000000_add_homepage_features_postgresql.sql"
else
  echo "⚠️  DATABASE_URL not set or not PostgreSQL"
  echo "This script is for Vercel deployment preparation."
  echo "For local development, keep using SQLite."
fi
