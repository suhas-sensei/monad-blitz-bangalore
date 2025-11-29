#!/bin/bash

# Quick setup script for Prediction Market Keeper

set -e

echo "🚀 Setting up Prediction Market Keeper..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration!"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   - RPC_URL"
echo "   - OPERATOR_PRIVATE_KEY"
echo "   - PREDICTION_CONTRACT_ADDRESS"
echo ""
echo "2. Run the keeper:"
echo "   npm start          # Production mode"
echo "   npm run dev        # Development mode"
echo ""
echo "3. (Optional) Use PM2 for production:"
echo "   npm install -g pm2"
echo "   pm2 start dist/index.js --name prediction-keeper"
echo ""
