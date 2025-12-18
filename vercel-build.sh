#!/bin/bash
set -e

# Fix nodemailer version in package.json before installing
echo "🔧 Updating nodemailer version in package.json..."
sed -i.bak 's/"nodemailer": "\^6\.10\.1"/"nodemailer": "^7.0.11"/g' package.json || true
sed -i.bak 's/"nodemailer": "\^7\.0\.7"/"nodemailer": "^7.0.11"/g' package.json || true

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Build Next.js app
echo "🏗️ Building Next.js app..."
next build














