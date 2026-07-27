#!/bin/bash

# Setup script for AI Service Python environment

set -e

AI_SERVICE_DIR="$(cd "$(dirname "$0")/apps/ai-service" && pwd)"
VENV_DIR="$AI_SERVICE_DIR/.venv"

echo "🐍 Setting up Python virtual environment..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate and install dependencies
echo "📥 Installing Python dependencies..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$AI_SERVICE_DIR/requirements.txt"

echo "✅ Python environment ready!"
echo ""
echo "To activate: source apps/ai-service/.venv/bin/activate"
echo "To run: cd apps/ai-service && .venv/bin/uvicorn app.main:app --reload --port 8000"
