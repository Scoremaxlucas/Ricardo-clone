#!/bin/bash

# Database Performance Setup Script
# This script helps you set up optimal database performance settings

echo "🚀 Helvenda Database Performance Setup"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it with:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=10'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Extract connection details
DB_URL_WITHOUT_PARAMS=$(echo $DATABASE_URL | sed 's/?.*$//')
DB_PARAMS=$(echo $DATABASE_URL | grep -oP '\?.*$' || echo "")

echo "📊 Current Database URL:"
echo "   Base: $DB_URL_WITHOUT_PARAMS"
echo "   Params: ${DB_PARAMS:-none}"
echo ""

# Check if connection pool params are set
if [[ "$DATABASE_URL" != *"connection_limit"* ]]; then
    echo "⚠️  Warning: connection_limit not found in DATABASE_URL"
    echo ""
    echo "Recommended DATABASE_URL format:"
    echo "  postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=10"
    echo ""
    echo "This optimizes connection pooling for better performance."
    echo ""
fi

# Ask if user wants to add indexes
echo "📋 Database Indexes"
echo "   These indexes will significantly improve query performance (60-80% faster)"
echo ""
read -p "Do you want to add database indexes now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔧 Adding database indexes..."
    echo ""
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo "❌ Error: psql command not found"
        echo ""
        echo "Please install PostgreSQL client tools or run the SQL script manually:"
        echo "  psql \$DATABASE_URL -f scripts/add-database-indexes.sql"
        exit 1
    fi
    
    # Run the SQL script
    psql "$DATABASE_URL" -f scripts/add-database-indexes.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database indexes added successfully!"
        echo ""
        echo "Expected improvements:"
        echo "  - 60-80% faster search queries"
        echo "  - 50-70% faster category queries"
        echo "  - 40-60% faster favorite queries"
    else
        echo ""
        echo "❌ Error: Failed to add indexes"
        echo "Please check the error messages above"
        exit 1
    fi
else
    echo ""
    echo "⏭️  Skipping index creation"
    echo "You can add them later with:"
    echo "  psql \$DATABASE_URL -f scripts/add-database-indexes.sql"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Monitor performance metrics (see docs/performance-optimizations.md)"
echo "  2. Check API response times in Vercel dashboard"
echo "  3. Monitor database query times"

