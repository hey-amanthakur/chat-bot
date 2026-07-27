#!/bin/bash

# Setup script for Node.js dependencies

set -e

echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "🐍 Setting up Python environment..."
./setup-python.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run 'npm run dev' to start all services"
