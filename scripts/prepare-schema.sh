#!/bin/bash

# Script to automatically set the correct Prisma provider based on DATABASE_URL
# This ensures compatibility with both SQLite (local) and PostgreSQL (Vercel)

set -e

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "❌ Schema file not found: $SCHEMA_FILE"
  exit 1
fi

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, defaulting to SQLite for local development"
  PROVIDER="sqlite"
elif [[ "$DATABASE_URL" == postgres* ]] || [[ "$DATABASE_URL" == postgresql* ]]; then
  echo "✅ DATABASE_URL points to PostgreSQL"
  PROVIDER="postgresql"
elif [[ "$DATABASE_URL" == file:* ]] || [[ "$DATABASE_URL" == sqlite* ]]; then
  echo "✅ DATABASE_URL points to SQLite"
  PROVIDER="sqlite"
else
  echo "⚠️  Unknown DATABASE_URL format, defaulting to SQLite"
  PROVIDER="sqlite"
fi

# Update schema file
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/provider = \"sqlite\"/provider = \"$PROVIDER\"/" "$SCHEMA_FILE"
  sed -i '' "s/provider = \"postgresql\"/provider = \"$PROVIDER\"/" "$SCHEMA_FILE"
else
  # Linux
  sed -i "s/provider = \"sqlite\"/provider = \"$PROVIDER\"/" "$SCHEMA_FILE"
  sed -i "s/provider = \"postgresql\"/provider = \"$PROVIDER\"/" "$SCHEMA_FILE"
fi

echo "✅ Schema updated to use provider: $PROVIDER"
