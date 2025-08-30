#!/usr/bin/env node

/**
 * Enhanced Memory MCP Server Basic Functionality Test
 * Tests that the server starts and handles basic operations without errors
 */

import { spawn } from 'child_process';

async function runBasicTest() {
  console.log('🚀 Starting Enhanced Memory MCP Server Basic Test...\n');
  
  // Spawn the MCP server process
  const serverProcess = spawn('node', ['dist/mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverStarted = false;
  let errorOccurred = false;
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[SERVER OUTPUT] ${output.trim()}`);
    
    // Check if server started successfully
    if (output.includes('initialized successfully')) {
      serverStarted = true;
      console.log('✅ Server initialized successfully');
    }
  });
  
  // Handle server errors
  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`[SERVER ERROR] ${error.trim()}`);
    errorOccurred = true;
  });
  
  // Handle server exit
  serverProcess.on('close', (code) => {
    console.log(`[SERVER EXIT] Process exited with code ${code}`);
    if (code !== 0) {
      errorOccurred = true;
    }
  });
  
  // Wait a moment for server to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if server started without errors
  if (serverStarted && !errorOccurred) {
    console.log('\n✅ Server started successfully and is running without errors');
  } else if (errorOccurred) {
    console.log('\n❌ Server encountered errors during startup or operation');
  } else {
    console.log('\n⚠️ Server startup status uncertain');
  }
  
  // Send a simple command to test basic functionality
  console.log('\n📝 Testing basic command...');
  serverProcess.stdin.write('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n');
  
  // Wait a moment for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Cleanly exit the server
  console.log('\n⏹️  Exiting server...');
  serverProcess.stdin.end();
  
  // Give it a moment to shut down
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Force kill if still running
  if (!serverProcess.killed) {
    serverProcess.kill();
  }
  
  console.log('\n✅ Basic test completed!');
  
  // Exit with appropriate code
  process.exit(errorOccurred ? 1 : 0);
}

// Run the basic test
runBasicTest().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});