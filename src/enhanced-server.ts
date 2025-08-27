#!/usr/bin/env node

/**
 * Enhanced Memory MCP Server - Dual Mode Support
 * Professional TypeScript implementation with DuckDB backend
 * Created by: malu
 */

import { HTTPServer } from './http-server.js'
import { EnhancedMemoryStore } from './enhanced-memory-store.js'
import { readFile } from 'fs/promises'

import { readFileSync } from 'fs'
import { join } from 'path'

async function getVersion(): Promise<string> {
	try {
		const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
		return packageJson.version || 'unknown'
	} catch {
		// Fallback for when package.json is not found
		try {
			const { readFile } = await import('fs/promises')
			const packageJsonPath = new URL('../package.json', import.meta.url)
			const data = await readFile(packageJsonPath, 'utf8')
			const { version } = JSON.parse(data)
			return version
		} catch {
			return '1.0.0'
		}
	}
}

const ARGS = process.argv.slice(2)

// Handle help flag
if (ARGS.includes('--help') || ARGS.includes('-h')) {
	console.log(`
🧠 Enhanced Memory MCP Server v${await getVersion()}
👤 Created by: malu

USAGE:
    npx enhanced-memory-mcp [OPTIONS]

OPTIONS:
    --http              Start HTTP server mode
    --port <PORT>       Set server port (default: 3000)
    --stdio             Start stdio mode (default)
    --help, -h          Show this help message
    --version, -v       Show version

EXAMPLES:
    npx enhanced-memory-mcp                    # Start stdio mode
    npx enhanced-memory-mcp --http             # Start HTTP server
    npx enhanced-memory-mcp --http --port 8080 # Start HTTP server on port 8080

ENDPOINTS (HTTP mode):
    GET  /health         - Health check
    POST /mcp           - MCP protocol endpoint
    GET  /api/memories  - List memories
    POST /api/memories  - Create memory
    GET  /api/stats     - Server statistics

Repository: https://github.com/CoderDayton/enhanced-memory-mcp
NPM: https://www.npmjs.com/package/enhanced-memory-mcp
	`)
	process.exit(0)
}

// Handle version flag
if (ARGS.includes('--version') || ARGS.includes('-v')) {
	console.log(`v${await getVersion()}`)
	process.exit(0)
}

const MODE = ARGS.includes('--http') ? 'http' : 'stdio'
const PORT = ARGS.includes('--port')
	? Number(ARGS[ARGS.indexOf('--port') + 1]) || 3000
	: 3000

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
							{
								name: 'search_memories',
								description: 'Search memories',
								inputSchema: {
									type: 'object',
									properties: { query: { type: 'string' }, limit: { type: 'number' } },
									required: ['query'],
								},
							},
							{
								name: 'get_memory',
								description: 'Get memory by ID',
								inputSchema: {
									type: 'object',
									properties: { id: { type: 'string' } },
									required: ['id'],
								},
							},
							{
								name: 'delete_memory',
								description: 'Delete memory by ID',
								inputSchema: {
									type: 'object',
									properties: { id: { type: 'string' } },
									required: ['id'],
								},
							},
							{
								name: 'update_memory',
								description: 'Update memory',
								inputSchema: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										content: { type: 'string' },
										type: { type: 'string' },
										metadata: { type: 'object' },
									},
									required: ['id'],
								},
							},
							{
								name: 'get_memories_by_type',
								description: 'Get memories by type',
								inputSchema: {
									type: 'object',
									properties: { type: { type: 'string' }, limit: { type: 'number' } },
									required: ['type'],
								},
							},
							{
								name: 'add_entity',
								description: 'Add entity',
								inputSchema: {
									type: 'object',
									properties: {
										name: { type: 'string' },
										type: { type: 'string' },
										properties: { type: 'object' },
									},
									required: ['name', 'type'],
								},
							},
							{
								name: 'add_relation',
								description: 'Add relation',
								inputSchema: {
									type: 'object',
									properties: {
										from_entity_id: { type: 'string' },
										to_entity_id: { type: 'string' },
										relation_type: { type: 'string' },
									},
									required: ['from_entity_id', 'to_entity_id', 'relation_type'],
								},
							},
							{
								name: 'get_entities',
								description: 'Get entities',
								inputSchema: {
									type: 'object',
									properties: {
										limit: { type: 'number' },
										type: { type: 'string' },
										search: { type: 'string' },
									},
								},
							},
							{
								name: 'get_relations',
								description: 'Get relations',
								inputSchema: {
									type: 'object',
									properties: {
										limit: { type: 'number' },
										type: { type: 'string' },
										entityId: { type: 'string' },
									},
								},
							},
							{
								name: 'delete_entity',
								description: 'Delete entity',
								inputSchema: {
									type: 'object',
									properties: { id: { type: 'string' } },
									required: ['id'],
								},
							},
							{
								name: 'delete_relation',
								description: 'Delete relation',
								inputSchema: {
									type: 'object',
									properties: { id: { type: 'string' } },
									required: ['id'],
								},
							},
							{
								name: 'export_data',
								description: 'Export data',
								inputSchema: {
									type: 'object',
									properties: { format: { type: 'string' } },
								},
							},
							{
								name: 'import_data',
								description: 'Import data',
								inputSchema: {
									type: 'object',
									properties: { data: { type: 'string' }, format: { type: 'string' } },
									required: ['data'],
								},
							},
							{
								name: 'get_memory_graph',
								description: 'Get memory graph',
								inputSchema: {
									type: 'object',
									properties: {
										centerNodeId: { type: 'string' },
										depth: { type: 'number' },
									},
								},
							},
							{
								name: 'consolidate_memories',
								description: 'Consolidate memories',
								inputSchema: {
									type: 'object',
									properties: { similarityThreshold: { type: 'number' } },
								},
							},
							{
								name: 'get_memory_stats',
								description: 'Get memory statistics',
								inputSchema: { type: 'object', properties: {} },
							},
							{
								name: 'get_recent_memories',
								description: 'Get recent memories',
								inputSchema: {
									type: 'object',
									properties: {
										limit: { type: 'number' },
										timeframe: { type: 'string' },
									},
								},
							},
							{
								name: 'analyze_memories',
								description: 'Analyze memory content',
								inputSchema: {
									type: 'object',
									properties: { content: { type: 'string' } },
									required: ['content'],
								},
							},
							{
								name: 'get_similar_memories',
								description: 'Get similar memories',
								inputSchema: {
									type: 'object',
									properties: {
										content: { type: 'string' },
										limit: { type: 'number' },
										threshold: { type: 'number' },
									},
									required: ['content'],
								},
							},
							{
								name: 'clear_cache',
								description: 'Clear memory cache',
								inputSchema: { type: 'object', properties: {} },
							},
						]

						response = {
							jsonrpc: '2.0',
							id: request.id,
							result: { tools },
						}
					} else if (request.method === 'tools/call') {
						// Map tool calls to handler methods
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
								case 'get_memory':
									result = await memoryStore.getMemory(args.id)
									break
								case 'delete_memory':
									result = await memoryStore.deleteMemory(args.id)
									break
								case 'update_memory':
									const updates: any = {}
									if (args.content !== undefined) updates.content = args.content
									if (args.type !== undefined) updates.type = args.type
									if (args.metadata !== undefined) updates.metadata = args.metadata
									result = await memoryStore.updateMemory(args.id, updates)
									break
								case 'get_memories_by_type':
									result = await memoryStore.getMemoriesByType(args.type, args.limit)
									break
								case 'add_entity':
									result = await memoryStore.addEntity({
										name: args.name,
										type: args.type,
										properties: args.properties || {},
									})
									break
								case 'add_relation':
									result = await memoryStore.addRelation({
										from_entity_id: args.from_entity_id,
										to_entity_id: args.to_entity_id,
										relation_type: args.relation_type,
									})
									break
								case 'get_entities':
									result = await memoryStore.getEntities(args)
									break
								case 'get_relations':
									result = await memoryStore.getRelations(args)
									break
								case 'delete_entity':
									result = await memoryStore.deleteEntity(args.id)
									break
								case 'delete_relation':
									result = await memoryStore.deleteRelation(args.id)
									break
								case 'export_data':
									result = await memoryStore.exportData(args.format)
									break
								case 'import_data':
									result = await memoryStore.importData(args.data, args.format)
									break
								case 'get_memory_graph':
									result = await memoryStore.getMemoryGraph(args.centerNodeId, args.depth)
									break
								case 'consolidate_memories':
									result = await memoryStore.consolidateMemories(args.similarityThreshold)
									break
								case 'get_memory_stats':
									result = await memoryStore.getMemoryStats()
									break
								case 'get_recent_memories':
									result = await memoryStore.getRecentMemories(args.limit, args.timeframe)
									break
								case 'analyze_memories':
									result = await memoryStore.analyzeMemory(args.content)
									break
								case 'get_similar_memories':
									result = await memoryStore.getSimilarMemories(
										args.content,
										args.limit,
										args.threshold
									)
									break
								case 'clear_cache':
									result = await memoryStore.clearCache()
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
