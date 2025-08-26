#!/bin/bash
# Quick test of the MCP stdio server
echo "Testing MCP stdio server..."

# Start the server in background and capture its PID
timeout 10s node mcp-stdio.js &
SERVER_PID=$!

# Give it a moment to start
sleep 2

# Check if it's still running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ MCP stdio server started successfully"
    # Kill the server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
else
    echo "❌ MCP stdio server failed to start"
fi

echo "Test completed."
