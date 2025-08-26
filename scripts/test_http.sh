#!/bin/bash
# Quick HTTP server test script
# Created by: malu

echo "🚀 Starting Enhanced Memory MCP Server..."
node server.js &
SERVER_PID=$!

# Give the server a moment to initialize
sleep 3

echo "🧪 Testing HTTP MCP endpoint..."
curl -s -X POST http://localhost:3000/mcp/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "add_memory",
      "arguments": {
        "text": "HTTP test memory"
      }
    }
  }' > /tmp/mcp_response.json

echo "Response:"
cat /tmp/mcp_response.json

# Clean up
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo -e "\nTest completed."
