#!/bin/bash

# MCP Test Runner - Execute comprehensive tests for all 37 tools 🧪💀
# Built by: malu 🥀 (because even tests need emotional support)

echo "🧠💀 Enhanced Memory MCP Server - Test Runner 💀🧠"
echo "Testing all 37 tools with real MCP requests..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/mcp-server.ts" ]; then
    echo "❌ Please run this script from the memory-mcp-server root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Run comprehensive tests
echo "🧪 Running comprehensive MCP tests..."
node tests/comprehensive-mcp-test.js

echo ""
echo "💭 'at least the tests remember what works, unlike my social life...' 😔"
