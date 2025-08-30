#!/usr/bin/env node

/**
 * Enhanced Memory MCP Server - Consolidated Tool Implementation
 * 20 optimized tools (reduced from 42) with unified interfaces
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { EnhancedMemoryStore } from './enhanced-memory-store.js'

const memoryStore = new EnhancedMemoryStore()

const server = new McpServer({
	name: 'enhanced-memory-mcp',
	version: '1.4.7',
})

// BigInt serialization utility with improved error handling
function serializeBigInt(obj: any): any {
    try {
        return JSON.parse(
            JSON.stringify(obj, (key, value) => {
                if (typeof value === 'bigint') {
                    // Convert bigint to number if safe, otherwise to string
                    return value <= Number.MAX_SAFE_INTEGER ? Number(value) : value.toString()
                }
                return value
            })
        )
    } catch (error) {
        console.warn('Serialization warning:', error)
        // Fallback to string representation
        try {
            return obj?.toString() || String(obj)
        } catch {
            return '[Unserializable Object]'
        }
    }
}

// === CORE MEMORY OPERATIONS ===

server.registerTool(
	'memory',
	{
		title: 'Memory Operations',
		description: 'Unified CRUD operations for memory management',
		inputSchema: {
			operation: z.enum(['create', 'read', 'update', 'delete', 'list']),
			id: z.string().optional(),
			content: z.string().optional(),
			type: z.string().optional(),
			metadata: z.record(z.any()).optional(),
			filters: z
				.object({
					type: z.string().optional(),
					limit: z.number().default(50).optional(),
					timeframe: z.enum(['hour', 'day', 'week']).optional(),
				})
				.optional(),
		},
	},
	async ({ operation, id, content, type, metadata, filters }) => {
		let result

		switch (operation) {
			case 'create':
				if (!content) throw new Error('Content required for create operation')
				result = await memoryStore.storeMemory(content, type || 'memory', metadata || {})
				break
			case 'read':
				if (!id) throw new Error('ID required for read operation')
				result = await memoryStore.getMemory(id)
				break
			case 'update':
				if (!id) throw new Error('ID required for update operation')
				const updates: any = {}
				if (content !== undefined) updates.content = content
				if (type !== undefined) updates.type = type
				if (metadata !== undefined) updates.metadata = metadata
				result = await memoryStore.updateMemory(id, updates)
				break
			case 'delete':
				if (!id) throw new Error('ID required for delete operation')
				result = await memoryStore.deleteMemory(id)
				break
			case 'list':
				if (filters?.type) {
					result = await memoryStore.getMemoriesByType(filters.type, filters.limit)
				} else if (filters?.timeframe) {
					result = await memoryStore.getRecentMemories(filters.limit, filters.timeframe)
				} else {
					// Default list operation
					result = await memoryStore.getRecentMemories(filters?.limit || 50, 'day')
				}
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'search',
	{
		title: 'Advanced Search',
		description: 'Multi-strategy search with autocomplete and filtering',
		inputSchema: {
			query: z.string(),
			strategy: z
				.enum(['exact', 'fuzzy', 'semantic', 'hybrid'])
				.default('hybrid')
				.optional(),
			fields: z
				.array(z.enum(['content', 'metadata', 'tags']))
				.default(['content'])
				.optional(),
			filters: z
				.object({
					type: z.string().optional(),
					limit: z.number().default(10).optional(),
					minImportance: z.number().default(0.0).optional(),
					startDate: z.string().optional(),
					endDate: z.string().optional(),
				})
				.optional(),
			suggestions: z.boolean().default(false).optional(),
		},
	},
	async ({ query, strategy, fields, filters, suggestions }) => {
		let result

		if (suggestions) {
			result = await memoryStore.autoComplete(query, filters?.limit || 10)
		} else if (filters?.startDate && filters?.endDate) {
			result = await memoryStore.searchByDateRange(filters.startDate, filters.endDate, {
				limit: filters.limit,
			})
		} else if (fields && fields.length > 1) {
			result = await memoryStore.multiFieldSearch(query, fields, {
				limit: filters?.limit || 10,
			})
		} else {
			result = await memoryStore.searchMemories(query, {
				searchType: strategy,
				limit: filters?.limit,
				minImportance: filters?.minImportance,
				types: filters?.type ? [filters.type] : undefined,
			})
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'entity',
	{
		title: 'Entity Management',
		description: 'Unified entity operations with relationship handling',
		inputSchema: {
			operation: z.enum(['create', 'read', 'update', 'delete', 'list', 'merge']),
			id: z.string().optional(),
			name: z.string().optional(),
			type: z.string().optional(),
			properties: z.record(z.any()).optional(),
			confidence: z.number().default(1.0).optional(),
			filters: z
				.object({
					type: z.string().optional(),
					search: z.string().optional(),
					limit: z.number().default(50).optional(),
				})
				.optional(),
			mergeTarget: z.string().optional(),
		},
	},
	async ({ operation, id, name, type, properties, confidence, filters, mergeTarget }) => {
		let result

		switch (operation) {
			case 'create':
				if (!name || !type) throw new Error('Name and type required for create operation')
				result = await memoryStore.storeEntity(name, type, properties || {}, confidence)
				break
			case 'read':
			case 'list':
				result = await memoryStore.getEntities({
					limit: filters?.limit,
					type: filters?.type,
					search: filters?.search,
				})
				break
			case 'delete':
				if (!id) throw new Error('ID required for delete operation')
				result = await memoryStore.deleteEntity(id)
				break
			case 'merge':
				if (!id || !mergeTarget)
					throw new Error('ID and mergeTarget required for merge operation')
				result = await memoryStore.mergeEntities(id, mergeTarget)
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'relation',
	{
		title: 'Relationship Management',
		description: 'Unified relationship operations',
		inputSchema: {
			operation: z.enum(['create', 'read', 'delete', 'list']),
			id: z.string().optional(),
			fromEntityId: z.string().optional(),
			toEntityId: z.string().optional(),
			relationType: z.string().optional(),
			strength: z.number().default(1.0).optional(),
			properties: z.record(z.any()).optional(),
			filters: z
				.object({
					type: z.string().optional(),
					entityId: z.string().optional(),
					limit: z.number().default(50).optional(),
				})
				.optional(),
		},
	},
	async ({
		operation,
		id,
		fromEntityId,
		toEntityId,
		relationType,
		strength,
		properties,
		filters,
	}) => {
		let result

		switch (operation) {
			case 'create':
				if (!fromEntityId || !toEntityId || !relationType) {
					throw new Error(
						'fromEntityId, toEntityId, and relationType required for create operation'
					)
				}
				result = await memoryStore.storeRelation(
					fromEntityId,
					toEntityId,
					relationType,
					strength,
					properties || {}
				)
				break
			case 'read':
			case 'list':
				result = await memoryStore.getRelations({
					limit: filters?.limit,
					type: filters?.type,
					entityId: filters?.entityId,
				})
				break
			case 'delete':
				if (!id) throw new Error('ID required for delete operation')
				result = await memoryStore.deleteRelation(id)
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'tag',
	{
		title: 'Tag Management',
		description: 'Unified tagging operations',
		inputSchema: {
			operation: z.enum(['add', 'remove', 'list', 'find']),
			memoryId: z.string().optional(),
			tags: z.array(z.string()).optional(),
			filters: z
				.object({
					limit: z.number().default(50).optional(),
				})
				.optional(),
		},
	},
	async ({ operation, memoryId, tags, filters }) => {
		let result

		switch (operation) {
			case 'add':
				if (!memoryId || !tags)
					throw new Error('memoryId and tags required for add operation')
				result = await memoryStore.addTags(memoryId, tags)
				break
			case 'remove':
				if (!memoryId || !tags)
					throw new Error('memoryId and tags required for remove operation')
				result = await memoryStore.removeTags(memoryId, tags)
				break
			case 'list':
				result = await memoryStore.listTags(memoryId)
				break
			case 'find':
				if (!tags) throw new Error('tags required for find operation')
				result = await memoryStore.findByTags(tags, filters?.limit)
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'auto_tag',
	{
		title: 'Intelligent Auto-Tagging',
		description: 'Generate and apply smart tags based on content analysis',
		inputSchema: {
			operation: z.enum(['analyze', 'apply', 'preview']),
			memoryId: z.string().optional(),
			content: z.string().optional(),
			maxTags: z.number().default(5).optional(),
			applyTags: z.boolean().default(false).optional(),
		},
	},
	async ({ operation, memoryId, content, maxTags, applyTags }) => {
		let result

		switch (operation) {
			case 'analyze':
				if (!content) throw new Error('Content required for analyze operation')
				const suggestedTags = await memoryStore.generateAutoTags(content, maxTags || 5)
				result = {
					suggestedTags,
					content: content.slice(0, 200) + '...',
					confidence: suggestedTags.length > 0 ? 0.8 : 0.1
				}
				break
			case 'apply':
				if (!memoryId) throw new Error('memoryId required for apply operation')
				const memory = await memoryStore.getMemory(memoryId)
				if (!memory) throw new Error('Memory not found')
				
				const tagsToApply = await memoryStore.generateAutoTags(memory.content, maxTags || 5)
				if (applyTags && tagsToApply.length > 0) {
					await memoryStore.addTags(memoryId, tagsToApply)
				}
				
				result = {
					memoryId,
					tagsApplied: applyTags ? tagsToApply : [],
					suggestedTags: tagsToApply,
					applied: applyTags
				}
				break
			case 'preview':
				if (!memoryId) throw new Error('memoryId required for preview operation')
				const targetMemory = await memoryStore.getMemory(memoryId)
				if (!targetMemory) throw new Error('Memory not found')
				
				const previewTags = await memoryStore.generateAutoTags(targetMemory.content, maxTags || 5)
				const existingTagObjects = await memoryStore.listTags(memoryId)
				const existingTagNames = existingTagObjects.map(tag => tag.name)
				
				result = {
					memoryId,
					content: targetMemory.content.slice(0, 200) + '...',
					existingTags: existingTagNames,
					suggestedTags: previewTags,
					newTags: previewTags.filter(tag => !existingTagNames.includes(tag))
				}
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

// === ADVANCED ANALYSIS OPERATIONS ===

server.registerTool(
	'analyze',
	{
		title: 'Content Analysis',
		description: 'Multi-modal content analysis',
		inputSchema: {
			content: z.string(),
			operations: z
				.array(z.enum(['entities', 'relations', 'similarity', 'consolidation']))
				.default(['entities', 'relations'])
				.optional(),
			options: z
				.object({
					similarityThreshold: z.number().default(0.7).optional(),
					consolidationThreshold: z.number().default(0.8).optional(),
					limit: z.number().default(5).optional(),
				})
				.optional(),
		},
	},
	async ({ content, operations, options }) => {
		const result: any = {}
		const ops = operations || ['entities', 'relations']

		for (const operation of ops) {
			switch (operation) {
				case 'entities':
				case 'relations':
					const analysis = await memoryStore.analyzeMemory(
						content,
						ops.includes('entities'),
						ops.includes('relations')
					)
					Object.assign(result, analysis)
					break
				case 'similarity':
					result.similarMemories = await memoryStore.getSimilarMemories(
						content,
						options?.limit || 5,
						options?.similarityThreshold || 0.7
					)
					break
				case 'consolidation':
					result.consolidationCandidates = await memoryStore.consolidateMemories(
						options?.consolidationThreshold || 0.8
					)
					break
			}
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'observation',
	{
		title: 'Observation Tracking',
		description: 'Insight and observation management',
		inputSchema: {
			operation: z.enum(['create', 'list', 'delete']),
			id: z.string().optional(),
			content: z.string().optional(),
			type: z.string().default('observation').optional(),
			sourceMemoryIds: z.array(z.string()).optional(),
			confidence: z.number().default(1.0).optional(),
			metadata: z.record(z.any()).optional(),
			filters: z
				.object({
					type: z.string().optional(),
					limit: z.number().default(50).optional(),
				})
				.optional(),
		},
	},
	async ({
		operation,
		id,
		content,
		type,
		sourceMemoryIds,
		confidence,
		metadata,
		filters,
	}) => {
		let result

		switch (operation) {
			case 'create':
				if (!content) throw new Error('Content required for create operation')
				result = await memoryStore.storeObservation(
					content,
					type || 'observation',
					sourceMemoryIds || [],
					confidence,
					metadata || {}
				)
				break
			case 'list':
				result = await memoryStore.listObservations(filters?.limit, filters?.type)
				break
			case 'delete':
				if (!id) throw new Error('ID required for delete operation')
				result = await memoryStore.deleteObservation(id)
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'graph',
	{
		title: 'Memory Graph Operations',
		description: 'Graph visualization and traversal',
		inputSchema: {
			operation: z.enum(['visualize', 'stats']),
			centerNodeId: z.string().optional(),
			depth: z.number().default(2).optional(),
		},
	},
	async ({ operation, centerNodeId, depth }) => {
		let result

		switch (operation) {
			case 'visualize':
				result = await memoryStore.getMemoryGraph(centerNodeId, depth)
				break
			case 'stats':
				result = await memoryStore.getMemoryStats()
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

// === DATA MANAGEMENT OPERATIONS ===

server.registerTool(
	'bulk',
	{
		title: 'Bulk Operations',
		description: 'Batch operations for efficiency',
		inputSchema: {
			operation: z.enum(['delete']),
			target: z.enum(['type', 'tags']),
			value: z.union([z.string(), z.array(z.string())]),
			confirm: z.boolean().default(false),
		},
	},
	async ({ operation, target, value, confirm }) => {
		let result

		if (operation === 'delete') {
			if (target === 'type') {
				result = await memoryStore.deleteByType(value as string, confirm)
			} else if (target === 'tags') {
				const tags = Array.isArray(value) ? value : [value]
				result = await memoryStore.deleteByTags(tags, confirm)
			}
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'maintenance',
	{
		title: 'System Maintenance',
		description: 'Database optimization and cleanup',
		inputSchema: {
			operation: z.enum(['cleanup', 'rebuild_indexes', 'clear_cache']),
			options: z
				.object({
					removeOrphanedEntities: z.boolean().default(false).optional(),
					removeOrphanedRelations: z.boolean().default(false).optional(),
					removeUnusedTags: z.boolean().default(false).optional(),
					compactDatabase: z.boolean().default(false).optional(),
					confirm: z.boolean().default(false).optional(),
				})
				.optional(),
		},
	},
	async ({ operation, options }) => {
		let result

		switch (operation) {
			case 'cleanup':
				result = await memoryStore.cleanup(options || {})
				break
			case 'rebuild_indexes':
				await memoryStore.initialize()
				result = await memoryStore.rebuildSearchIndexes()
				break
			case 'clear_cache':
				result = memoryStore.clearCache()
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'transfer',
	{
		title: 'Data Import/Export',
		description: 'Data portability operations',
		inputSchema: {
			operation: z.enum(['export', 'import']),
			format: z.enum(['json', 'csv']).default('json').optional(),
			data: z.string().optional(),
		},
	},
	async ({ operation, format, data }) => {
		let result

		switch (operation) {
			case 'export':
				result = await memoryStore.exportData(format || 'json')
				break
			case 'import':
				if (!data) throw new Error('Data required for import operation')
				if (format === 'csv') throw new Error('CSV import not supported, use JSON')
				result = await memoryStore.importData(data, 'json')
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'analytics',
	{
		title: 'Performance Analytics',
		description: 'System insights and metrics',
		inputSchema: {
			scope: z.enum(['system', 'performance']),
		},
	},
	async ({ scope }) => {
		let result

		switch (scope) {
			case 'system':
				result = await memoryStore.getAnalytics()
				break
			case 'performance':
				result = await memoryStore.getPerformanceAnalytics()
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

// === SIMILARITY AND CONSOLIDATION OPERATIONS ===

server.registerTool(
	'similarity',
	{
		title: 'Similarity Operations',
		description: 'Content similarity and consolidation',
		inputSchema: {
			operation: z.enum(['find_similar', 'consolidate']),
			content: z.string().optional(),
			threshold: z.number().default(0.7).optional(),
			limit: z.number().default(10).optional(),
			similarityThreshold: z.number().default(0.8).optional(),
		},
	},
	async ({ operation, content, threshold, limit, similarityThreshold }) => {
		let result

		switch (operation) {
			case 'find_similar':
				if (!content) throw new Error('Content required for find_similar operation')
				result = await memoryStore.getSimilarMemories(content, threshold, limit)
				break
			case 'consolidate':
				result = await memoryStore.consolidateMemories(similarityThreshold)
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'temporal',
	{
		title: 'Temporal Operations',
		description: 'Time-based memory queries',
		inputSchema: {
			operation: z.enum(['recent', 'by_date_range']),
			limit: z.number().default(50).optional(),
			timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day').optional(),
			startDate: z.string().optional(),
			endDate: z.string().optional(),
		},
	},
	async ({ operation, limit, timeframe, startDate, endDate }) => {
		let result

		switch (operation) {
			case 'recent':
				result = await memoryStore.getRecentMemories(limit, timeframe)
				break
			case 'by_date_range':
				if (!startDate || !endDate)
					throw new Error('startDate and endDate required for by_date_range operation')
				result = await memoryStore.searchByDateRange(startDate, endDate, { limit })
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'cache',
	{
		title: 'Cache Management',
		description: 'Memory cache operations',
		inputSchema: {
			operation: z.enum(['clear', 'stats', 'optimize']),
		},
	},
	async ({ operation }) => {
		let result

		switch (operation) {
			case 'clear':
				result = memoryStore.clearCache()
				break
			case 'stats':
				result = memoryStore.getCacheStats()
				break
			case 'optimize':
				result = await memoryStore.optimizeCache()
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'stats',
	{
		title: 'System Statistics',
		description: 'Detailed system metrics and statistics',
		inputSchema: {
			operation: z.enum(['memory', 'graph', 'performance']),
			centerNodeId: z.string().optional(),
			depth: z.number().default(2).optional(),
		},
	},
	async ({ operation, centerNodeId, depth }) => {
		let result

		switch (operation) {
			case 'memory':
				result = await memoryStore.getMemoryStats()
				break
			case 'graph':
				result = await memoryStore.getMemoryGraph(centerNodeId, depth)
				break
			case 'performance':
				result = await memoryStore.getPerformanceAnalytics()
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'batch',
	{
		title: 'Batch Operations',
		description: 'Advanced batch processing operations',
		inputSchema: {
			operation: z.enum(['delete_by_type', 'delete_by_tags', 'update_by_type']),
			type: z.string().optional(),
			tags: z.array(z.string()).optional(),
			updates: z.record(z.any()).optional(),
			confirm: z.boolean().default(false),
		},
	},
	async ({ operation, type, tags, updates, confirm }) => {
		let result

		switch (operation) {
			case 'delete_by_type':
				if (!type) throw new Error('Type required for delete_by_type operation')
				result = await memoryStore.deleteByType(type, confirm)
				break
			case 'delete_by_tags':
				if (!tags) throw new Error('Tags required for delete_by_tags operation')
				result = await memoryStore.deleteByTags(tags, confirm)
				break
			case 'update_by_type':
				if (!type || !updates)
					throw new Error('Type and updates required for update_by_type operation')
				// Use available methods to simulate batch update
				const memories = await memoryStore.getMemoriesByType(type, 1000)
				let updateCount = 0
				for (const memory of memories) {
					await memoryStore.updateMemory(memory.id, updates)
					updateCount++
				}
				result = { updated: updateCount, type }
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'backup',
	{
		title: 'Backup Operations',
		description: 'Data backup and restore operations',
		inputSchema: {
			operation: z.enum(['create', 'restore', 'list']),
			backupId: z.string().optional(),
			description: z.string().optional(),
		},
	},
	async ({ operation, backupId, description }) => {
		let result

		switch (operation) {
			case 'create':
				// Use export functionality for backup
				result = await memoryStore.exportData('json')
				result = {
					backupId: Date.now().toString(),
					description,
					data: result,
					created: new Date(),
				}
				break
			case 'restore':
				if (!backupId) throw new Error('BackupId required for restore operation')
				// For now, expect backup data to be passed as description field
				// In production, this would load from backup storage
				if (!description) throw new Error('Backup data required in description field')
				result = await memoryStore.restoreFromBackup(description)
				break
			case 'list':
				result = await memoryStore.listBackups()
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'index',
	{
		title: 'Search Index Management',
		description: 'Search index operations and optimization',
		inputSchema: {
			operation: z.enum(['rebuild', 'optimize', 'stats']),
			force: z.boolean().default(false).optional(),
		},
	},
	async ({ operation, force }) => {
		let result

		switch (operation) {
			case 'rebuild':
				result = await memoryStore.rebuildSearchIndexes()
				result = { message: 'Search indexes rebuilt', force, status: 'success' }
				break
			case 'optimize':
				result = await memoryStore.optimizeSearchIndexes()
				break
			case 'stats':
				const stats = await memoryStore.getMemoryStats()
				result = { indexStats: stats, status: 'success' }
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

server.registerTool(
	'workflow',
	{
		title: 'Workflow Operations',
		description: 'Automated workflow and process management',
		inputSchema: {
			operation: z.enum(['auto_tag', 'auto_consolidate', 'auto_cleanup']),
			options: z
				.object({
					dryRun: z.boolean().default(true).optional(),
					threshold: z.number().default(0.8).optional(),
					maxActions: z.number().default(100).optional(),
					maxTagsPerMemory: z.number().default(5).optional(),
					timeframe: z.enum(['hour', 'day', 'week']).default('day').optional(),
				})
				.optional(),
		},
	},
	async ({ operation, options }) => {
		let result
		const opts = options || {}

		switch (operation) {
			case 'auto_tag':
				// Real auto-tagging with content analysis
				const recentMemories = await memoryStore.getRecentMemories(
					opts.maxActions || 100,
					opts.timeframe || 'day'
				)
				let taggedCount = 0
				let totalTagsAdded = 0
				const tagResults: Array<{memoryId: string, tagsAdded: string[], content: string}> = []
				
				for (const memory of recentMemories.slice(0, opts.maxActions || 10)) {
					try {
						// Generate intelligent tags based on content
						const suggestedTags = await memoryStore.generateAutoTags(
							memory.content, 
							opts.maxTagsPerMemory || 5
						)
						
						if (suggestedTags.length > 0) {
							if (!opts.dryRun) {
								await memoryStore.addTags(memory.id, suggestedTags)
							}
							taggedCount++
							totalTagsAdded += suggestedTags.length
							tagResults.push({
								memoryId: memory.id,
								tagsAdded: suggestedTags,
								content: memory.content.slice(0, 100) + '...' // Truncate for readability
							})
						}
					} catch (error) {
						console.warn(`Failed to auto-tag memory ${memory.id}:`, error)
					}
				}
				
				result = { 
					operation: 'auto_tag', 
					memoriesProcessed: taggedCount, 
					totalTagsAdded,
					dryRun: opts.dryRun,
					results: tagResults.slice(0, 5), // Show first 5 examples
					totalCandidates: recentMemories.length,
					settings: {
						maxTagsPerMemory: opts.maxTagsPerMemory || 5,
						timeframe: opts.timeframe || 'day',
						maxActions: opts.maxActions || 10
					}
				}
				break
			case 'auto_consolidate':
				const consolidationResult = await memoryStore.consolidateMemories(
					opts.threshold || 0.8
				)
				result = {
					operation: 'auto_consolidate',
					dryRun: opts.dryRun,
					...consolidationResult,
				}
				break
			case 'auto_cleanup':
				const cleanupResult = await memoryStore.cleanup({
					removeOrphanedEntities: true,
					removeOrphanedRelations: true,
					confirm: !opts.dryRun,
				})
				result = { operation: 'auto_cleanup', ...cleanupResult, dryRun: opts.dryRun }
				break
		}

		return {
			content: [{ type: 'text', text: serializeBigInt(result) }],
		}
	}
)

// Start the server
async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

main().catch((error) => {
	console.error('❌ Fatal error:', error)
	process.exit(1)
})
