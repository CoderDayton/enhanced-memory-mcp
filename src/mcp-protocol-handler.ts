/**
 * MCP Protocol Handler - The Bridge Between Protocols and Pain 🌉💔
 * 
 * Created by: malu 🥀 (translating human hopes into machine code)
 * "handling protocols better than I handle my own emotional protocols..."
 */

import { EnhancedMemoryStore } from './enhanced-memory-store.js'
import type { MCPRequest, MCPResponse, MCPError } from './types.js'

export class MCPProtocolHandler {
	private memoryStore: EnhancedMemoryStore

	// Map long inbound IDs to shortened forms to satisfy <40 char constraints
	private idMap = new Map<string | number, string | number>()

	private sanitizeJsonRpcId(original: any): string | number {
		if (original === null || original === undefined) return 0
		const asStr = String(original)
		if (asStr.length <= 40) return original
		// Deterministic short hash (base36 of simple hash code)
		let hash = 0
		for (let i = 0; i < asStr.length; i++) {
			hash = (hash * 31 + asStr.charCodeAt(i)) >>> 0
		}
		const shortId = 'h' + hash.toString(36)
		this.idMap.set(original, shortId)
		return shortId
	}

	constructor() {
		this.memoryStore = new EnhancedMemoryStore()
	}

	// Define all 21 MCP tools (each one crafted with digital tears 💧)
	private readonly tools = [
		// Core CRUD operations (10 existing)
		{
			name: 'store_memory',
			description: 'Store new memory with content and type',
			inputSchema: {
				type: 'object',
				properties: {
					content: { type: 'string', description: 'The memory content to store' },
					type: {
						type: 'string',
						description: 'Type of memory (e.g., fact, observation, note)',
					},
					metadata: { type: 'object', description: 'Additional metadata for the memory' },
				},
				required: ['content'],
			},
		},
		{
			name: 'get_memory',
			description: 'Retrieve a specific memory by ID',
			inputSchema: {
				type: 'object',
				properties: {
					id: { type: 'string', description: 'The unique identifier of the memory' },
				},
				required: ['id'],
			},
		},
		{
			name: 'search_memories',
			description: 'Search memories by content or type',
			inputSchema: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description: 'Search query to match against memory content',
					},
					type: { type: 'string', description: 'Filter by memory type' },
					limit: {
						type: 'number',
						description: 'Maximum number of results to return',
						default: 10,
					},
					minImportance: {
						type: 'number',
						description: 'Minimum importance score filter',
						default: 0.0,
					},
				},
				required: ['query'],
			},
		},
		{
			name: 'store_entity',
			description: 'Store entity with type and properties',
			inputSchema: {
				type: 'object',
				properties: {
					name: { type: 'string', description: 'The entity name' },
					type: {
						type: 'string',
						description: 'Type of entity (person, place, concept, etc.)',
					},
					properties: { type: 'object', description: 'Entity properties and attributes' },
					confidence: {
						type: 'number',
						description: 'Confidence score for entity extraction',
					},
				},
				required: ['name', 'type'],
			},
		},
		{
			name: 'store_relation',
			description: 'Store relationship between entities',
			inputSchema: {
				type: 'object',
				properties: {
					fromEntityId: { type: 'string', description: 'Source entity ID' },
					toEntityId: { type: 'string', description: 'Target entity ID' },
					relationType: { type: 'string', description: 'Type of relationship' },
					strength: { type: 'number', description: 'Relationship strength (0.0 to 1.0)' },
					properties: { type: 'object', description: 'Relationship properties' },
				},
				required: ['fromEntityId', 'toEntityId', 'relationType'],
			},
		},
		{
			name: 'analyze_memory',
			description: 'Analyze memory for entities and relations',
			inputSchema: {
				type: 'object',
				properties: {
					content: { type: 'string', description: 'Text content to analyze' },
					extractEntities: {
						type: 'boolean',
						description: 'Whether to extract entities',
						default: true,
					},
					extractRelations: {
						type: 'boolean',
						description: 'Whether to extract relationships',
						default: true,
					},
				},
				required: ['content'],
			},
		},
		{
			name: 'get_similar_memories',
			description: 'Find memories similar to given content',
			inputSchema: {
				type: 'object',
				properties: {
					content: {
						type: 'string',
						description: 'Content to find similar memories for',
					},
					limit: { type: 'number', description: 'Maximum number of results', default: 5 },
					threshold: {
						type: 'number',
						description: 'Similarity threshold',
						default: 0.7,
					},
				},
				required: ['content'],
			},
		},
		{
			name: 'get_memory_stats',
			description: 'Get stats about stored data',
			inputSchema: {
				type: 'object',
				properties: {},
			},
		},
		{
			name: 'get_recent_memories',
			description: 'Get recent memories',
			inputSchema: {
				type: 'object',
				properties: {
					limit: {
						type: 'number',
						description: 'Maximum number of memories to return',
						default: 10,
					},
					timeframe: {
						type: 'string',
						description: 'Time period (hour, day, week)',
						default: 'day',
					},
				},
			},
		},
		{
			name: 'clear_memory_cache',
			description: 'Clear the memory cache to free up memory',
			inputSchema: {
				type: 'object',
				properties: {},
			},
		},

		// Additional CRUD operations (11 new tools)
		{
			name: 'delete_memory',
			description: 'Delete a specific memory by ID',
			inputSchema: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						description: 'The unique identifier of the memory to delete',
					},
				},
				required: ['id'],
			},
		},
		{
			name: 'update_memory',
			description: 'Update memory content, type, or metadata',
			inputSchema: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						description: 'The unique identifier of the memory to update',
					},
					content: { type: 'string', description: 'New memory content' },
					type: { type: 'string', description: 'New memory type' },
					metadata: { type: 'object', description: 'New metadata to merge/replace' },
				},
				required: ['id'],
			},
		},
		{
			name: 'get_memories_by_type',
			description: 'Retrieve all memories of a specific type',
			inputSchema: {
				type: 'object',
				properties: {
					type: { type: 'string', description: 'Memory type to filter by' },
					limit: {
						type: 'number',
						description: 'Maximum number of results',
						default: 50,
					},
				},
				required: ['type'],
			},
		},
		{
			name: 'get_entities',
			description: 'Retrieve entities with filters',
			inputSchema: {
				type: 'object',
				properties: {
					limit: {
						type: 'number',
						description: 'Maximum number of results',
						default: 50,
					},
					type: { type: 'string', description: 'Filter by entity type' },
					search: { type: 'string', description: 'Search entities by name' },
				},
			},
		},
		{
			name: 'get_relations',
			description: 'Retrieve relationships with filters',
			inputSchema: {
				type: 'object',
				properties: {
					limit: {
						type: 'number',
						description: 'Maximum number of results',
						default: 50,
					},
					type: { type: 'string', description: 'Filter by relation type' },
					entityId: {
						type: 'string',
						description: 'Filter relations involving specific entity',
					},
				},
			},
		},
		{
			name: 'delete_entity',
			description: 'Delete entity and its relationships',
			inputSchema: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						description: 'The unique identifier of the entity to delete',
					},
				},
				required: ['id'],
			},
		},
		{
			name: 'delete_relation',
			description: 'Delete a specific relationship',
			inputSchema: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						description: 'The unique identifier of the relation to delete',
					},
				},
				required: ['id'],
			},
		},
		{
			name: 'export_data',
			description: 'Export memory data in JSON or CSV',
			inputSchema: {
				type: 'object',
				properties: {
					format: {
						type: 'string',
						enum: ['json', 'csv'],
						description: 'Export format',
						default: 'json',
					},
				},
			},
		},
		{
			name: 'import_data',
			description: 'Import memory data from JSON format',
			inputSchema: {
				type: 'object',
				properties: {
					data: { type: 'string', description: 'JSON data to import' },
					format: {
						type: 'string',
						enum: ['json'],
						description: 'Import format',
						default: 'json',
					},
				},
				required: ['data'],
			},
		},
		{
			name: 'get_memory_graph',
			description: 'Get memory graph visualization data',
			inputSchema: {
				type: 'object',
				properties: {
					centerNodeId: {
						type: 'string',
						description: 'Center the graph around this memory node',
					},
					depth: { type: 'number', description: 'Graph traversal depth', default: 2 },
				},
			},
		},
		{
			name: 'consolidate_memories',
			description: 'Find and merge duplicate memories',
			inputSchema: {
				type: 'object',
				properties: {
					similarityThreshold: {
						type: 'number',
						description: 'Similarity threshold for consolidation',
						default: 0.8,
					},
				},
			},
		},
	]

	async listTools(): Promise<{ tools: any[] }> {
		return { tools: this.tools }
	}

	async handleRequest(request: MCPRequest): Promise<MCPResponse | MCPError> {
		try {
			const { method, params } = request
			// Sanitize request id if too long
			const safeId = this.sanitizeJsonRpcId(request.id)

			switch (method) {
				case 'tools/call':
					return await this.handleToolCall(params as any)

				case 'tools/list':
					return {
						jsonrpc: '2.0',
						id: safeId,
						result: await this.listTools(),
					}

				default:
					return {
						jsonrpc: '2.0',
						id: safeId,
						error: {
							code: -32601,
							message: `Method not found: ${method}`,
						},
					}
			}
		} catch (error) {
			console.error('❌ Error handling MCP request:', error)
			return {
				jsonrpc: '2.0',
				id: this.sanitizeJsonRpcId(request.id),
				error: {
					code: -32603,
					message: 'Internal error',
					data: error instanceof Error ? error.message : String(error),
				},
			}
		}
	}

	private async handleToolCall(params: {
		name: string
		arguments: any
	}): Promise<MCPResponse> {
		const { name, arguments: args } = params

		try {
			let result: any

			switch (name) {
				// Core CRUD operations (10 existing)
				case 'store_memory':
					result = await this.memoryStore.storeMemory(
						args.content,
						args.type || 'memory',
						args.metadata || {}
					)
					break

				case 'get_memory':
					result = await this.memoryStore.getMemory(args.id)
					break

				case 'search_memories':
					result = await this.memoryStore.searchMemories(args.query, {
						limit: args.limit || 10,
						types: args.types,
						minConfidence: args.minConfidence,
					})
					break

				case 'store_entity':
					result = await this.memoryStore.storeEntity(
						args.name,
						args.type,
						args.properties || {},
						args.confidence || 1.0
					)
					break

				case 'store_relation':
					result = await this.memoryStore.storeRelation(
						args.fromEntityId,
						args.toEntityId,
						args.relationType,
						args.strength || 1.0,
						args.properties || {}
					)
					break

				case 'analyze_memory':
					result = await this.memoryStore.analyzeMemory(
						args.content,
						args.extractEntities !== false,
						args.extractRelations !== false
					)
					break

				case 'get_similar_memories':
					result = await this.memoryStore.getSimilarMemories(
						args.content,
						args.limit || 5,
						args.threshold || 0.7
					)
					break

				case 'get_memory_stats':
					result = await this.memoryStore.getMemoryStats()
					break

				case 'get_recent_memories':
					result = await this.memoryStore.getRecentMemories(
						args.limit || 10,
						args.timeframe || 'day'
					)
					break

				case 'clear_memory_cache':
					result = await this.memoryStore.clearCache()
					break

				// Additional CRUD operations (11 new tools)
				case 'delete_memory':
					result = await this.memoryStore.deleteMemory(args.id)
					break

				case 'update_memory':
					const updates: any = {}
					if (args.content !== undefined) updates.content = args.content
					if (args.type !== undefined) updates.type = args.type
					if (args.metadata !== undefined) updates.metadata = args.metadata
					result = await this.memoryStore.updateMemory(args.id, updates)
					break

				case 'get_memories_by_type':
					result = await this.memoryStore.getMemoriesByType(args.type, args.limit || 50)
					break

				case 'get_entities':
					result = await this.memoryStore.getEntities({
						limit: args.limit || 50,
						type: args.type,
						search: args.search,
					})
					break

				case 'get_relations':
					result = await this.memoryStore.getRelations({
						limit: args.limit || 50,
						type: args.type,
						entityId: args.entityId,
					})
					break

				case 'delete_entity':
					result = await this.memoryStore.deleteEntity(args.id)
					break

				case 'delete_relation':
					result = await this.memoryStore.deleteRelation(args.id)
					break

				case 'export_data':
					result = await this.memoryStore.exportData(args.format || 'json')
					break

				case 'import_data':
					result = await this.memoryStore.importData(args.data, args.format || 'json')
					break

				case 'get_memory_graph':
					result = await this.memoryStore.getMemoryGraph(
						args.centerNodeId,
						args.depth || 2
					)
					break

				case 'consolidate_memories':
					result = await this.memoryStore.consolidateMemories(
						args.similarityThreshold || 0.8
					)
					break

				default:
					throw new Error(`Unknown tool: ${name}`)
			}

			return {
				jsonrpc: '2.0',
				id: this.sanitizeJsonRpcId(1),
				result: {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				},
			}
		} catch (error) {
			console.error(`❌ Error executing tool ${name}:`, error)
			throw error
		}
	}
}
