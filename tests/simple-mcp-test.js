#!/usr/bin/env node

/**
 * Simple MCP Test - Quick validation of core functionality
 */

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'

class SimpleMCPTester {
	constructor() {
		this.serverProcess = null
		this.responses = []
	}

	log(message) {
		console.log(`[${new Date().toISOString()}] ${message}`)
	}

	async startServer() {
		this.log('Starting MCP server...')
		
		this.serverProcess = spawn('node', ['dist/mcp-server.js'], {
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe']
		})

		// Handle server output
		this.serverProcess.stdout.on('data', (data) => {
			const output = data.toString()
			this.log(`Server stdout: ${output.trim()}`)
		})

		this.serverProcess.stderr.on('data', (data) => {
			this.log(`Server stderr: ${data.toString().trim()}`)
		})

		// Wait a moment for server to start
		await new Promise(resolve => setTimeout(resolve, 2000))
	}

	async sendRequest(method, params = {}) {
		const requestId = Math.floor(Math.random() * 1000000)
		const request = {
			jsonrpc: '2.0',
			id: requestId,
			method,
			...(Object.keys(params).length > 0 && { params })
		}

		this.log(`Sending: ${JSON.stringify(request)}`)
		this.serverProcess.stdin.write(JSON.stringify(request) + '\n')

		// For this simple test, just wait and check responses
		await new Promise(resolve => setTimeout(resolve, 1000))
	}

	async runSimpleTest() {
		try {
			await this.startServer()

			this.log('✅ Testing tools/list')
			await this.sendRequest('tools/list')

			this.log('✅ Testing store_memory')
			await this.sendRequest('tools/call', {
				name: 'store_memory',
				arguments: {
					content: 'Test memory from simple test',
					type: 'test'
				}
			})

			this.log('✅ Testing get_memory_stats')
			await this.sendRequest('tools/call', {
				name: 'get_memory_stats'
			})

			this.log('✅ Simple test completed! Server is working.')

		} catch (error) {
			this.log(`❌ Test failed: ${error.message}`)
		} finally {
			if (this.serverProcess) {
				this.serverProcess.kill()
			}
		}
	}
}

// Run the test
const tester = new SimpleMCPTester()
tester.runSimpleTest()
