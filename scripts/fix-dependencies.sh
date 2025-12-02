#!/bin/bash
# Fix nodemailer dependency conflict for Vercel deployment

# Update package.json to use nodemailer 7.x
sed -i.bak 's/"nodemailer": "\^6\.10\.1"/"nodemailer": "^7.0.7"/g' package.json

# Install dependencies
npm install --legacy-peer-deps

# Build
npm run build


