#!/usr/bin/env node

/**
 * Enhanced Memory MCP Server - Dual Mode (stdio + HTTP)
 * Professional TypeScript implementation with DuckDB backend
 * Created by: malu
 */

import { HTTPServer } from './http-server.js'
import { EnhancedMemoryStore } from './enhanced-memory-store.js'
import { readFile } from 'fs/promises'

const ARGS = process.argv.slice(2)
const MODE = ARGS.includes('--http') ? 'http' : 'stdio'
const PORT = ARGS.includes('--port')
	? Number(ARGS[ARGS.indexOf('--port') + 1]) || 3000
	: 3000

async function getVersion() {
	try {
		const packageJsonPath = new URL('../package.json', import.meta.url) // Go up one directory from dist/
		const data = await readFile(packageJsonPath, 'utf8')
		const { version } = JSON.parse(data)
		return version
	} catch (err) {
		console.error('Failed to read package.json:', err)
		return 'unknown'
	}
}

console.log(`🧠 Enhanced Memory MCP Server - v${await getVersion()}`)
console.log(`👤 Created by: malu`)
console.log(`🗄️  Backend: DuckDB (Analytics-optimized)`)
console.log(`📊 Features: 21 MCP tools, Caching, Performance metrics`)
console.log(`🚀 Mode: ${MODE.toUpperCase()}`)

if (MODE === 'http') {
	// HTTP Mode - Express server with RESTful API
	console.log(`🌐 Starting HTTP server on port ${PORT}...`)

	const httpServer = new HTTPServer(PORT)

	httpServer.start().catch((error: any) => {
		console.error('❌ Failed to start HTTP server:', error)
		process.exit(1)
	})

	// Graceful shutdown
	process.on('SIGINT', async () => {
		console.log('\n🛑 Shutting down HTTP server...')
		await httpServer.stop()
		process.exit(0)
	})
} else {
	// stdio Mode - Standard MCP protocol over stdin/stdout
	console.log(`📡 Starting stdio MCP server...`)

	const memoryStore = new EnhancedMemoryStore()

	// Buffer for incoming JSON-RPC messages
	let inputBuffer = ''

	// Handle stdin data
	process.stdin.on('data', async (chunk) => {
		inputBuffer += chunk.toString()

		// Process complete JSON objects
		let newlineIndex
		while ((newlineIndex = inputBuffer.indexOf('\n')) !== -1) {
			const line = inputBuffer.slice(0, newlineIndex).trim()
			inputBuffer = inputBuffer.slice(newlineIndex + 1)

			if (line) {
				try {
					const request = JSON.parse(line)

					// Convert old-style tool calls to new format if needed
					let response
					if (request.method === 'initialize') {
						response = {
							jsonrpc: '2.0',
							id: request.id,
							result: {
								protocolVersion: '2024-11-05',
								capabilities: {
									tools: {},
								},
								serverInfo: {
									name: 'enhanced-memory-mcp-server',
									version: '1.1.1',
								},
							},
						}
					} else if (request.method === 'tools/list') {
						// Map to MCP tool format
						const tools = [
							{
								name: 'add_memory',
								description: 'Add a new memory',
								inputSchema: {
									type: 'object',
									properties: {
										content: { type: 'string' },
										type: { type: 'string' },
										metadata: { type: 'object' },
									},
									required: ['content'],
								},
							},
							// Additional tools would be listed here...
						]

						response = {
							jsonrpc: '2.0',
							id: request.id,
							result: { tools },
						}
					} else if (request.method === 'tools/call') {
						// Handle tool execution
						const toolName = request.params?.name
						const args = request.params?.arguments || {}

						let result
						try {
							switch (toolName) {
								case 'add_memory':
									result = await memoryStore.addMemory(
										args.content,
										args.type,
										args.metadata
									)
									break
								case 'search_memories':
									result = await memoryStore.searchMemories(args.query, args.limit)
									break
								default:
									throw new Error(`Unknown tool: ${toolName}`)
							}

							response = {
								jsonrpc: '2.0',
								id: request.id,
								result: {
									content: [
										{
											type: 'text',
											text:
												typeof result === 'string'
													? result
													: JSON.stringify(result, null, 2),
										},
									],
								},
							}
						} catch (error) {
							response = {
								jsonrpc: '2.0',
								id: request.id,
								error: {
									code: -32603,
									message: error instanceof Error ? error.message : 'Unknown error',
								},
							}
						}
					} else {
						response = {
							jsonrpc: '2.0',
							id: request.id,
							error: {
								code: -32601,
								message: `Method not found: ${request.method}`,
							},
						}
					}

					// Send response
					process.stdout.write(JSON.stringify(response) + '\n')
				} catch (error) {
					console.error('❌ Error processing request:', error)
					const errorResponse = {
						jsonrpc: '2.0',
						id: null,
						error: {
							code: -32700,
							message: 'Parse error',
						},
					}
					process.stdout.write(JSON.stringify(errorResponse) + '\n')
				}
			}
		}
	})

	// Handle process termination
	process.on('SIGINT', () => {
		console.log('\n🛑 Shutting down stdio server...')
		process.exit(0)
	})

	process.on('SIGTERM', () => {
		console.log('\n🛑 Shutting down stdio server...')
		process.exit(0)
	})

	console.log(`✅ stdio MCP server ready! Listening for JSON-RPC requests...`)
}