import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api'
import { v4 as uuidv4 } from 'uuid'
import {
	MemoryNode,
	Entity,
	Relation,
	SearchOptions,
	PerformanceMetrics,
	SearchResult,
	SearchResultItem,
	CacheEntry,
	CacheStats,
} from './types.js'

/**
 * Enhanced DuckDB Memory Store  
 * Optimized for performance and scalability
 * Features: Analytical views, performance caching, columnar operations
 * Created by: malu
 */
export class EnhancedMemoryStore {
	private instance?: DuckDBInstance
	private connection?: DuckDBConnection
	private isInitialized = false

	// Performance caching layer
	private queryCache = new Map<string, CacheEntry>()
	private readonly maxCacheSize = 1000
	private readonly cacheExpiry = 5 * 60 * 1000 // 5 minutes

	// Performance tracking
	private metrics: PerformanceMetrics = {
		operationCounts: {
			add_memory: 0,
			search_memories: 0,
			get_memory: 0,
			add_entity: 0,
			add_relation: 0,
			get_relations: 0,
		},
		averageLatencies: {},
		cacheHitRates: {},
		lastReset: new Date(),
	}

	constructor(private dbPath = 'data/memory.duckdb') {}

	async initialize(): Promise<void> {
		if (this.isInitialized) return

		console.log('🚀 Initializing Pure DuckDB Memory Store for malu...')

		try {
			// Create DuckDB instance and connection
			this.instance = await DuckDBInstance.create(this.dbPath)
			this.connection = await this.instance.connect()
			
			await this.setupDatabase()
			
			this.isInitialized = true
			console.log('✅ Pure DuckDB Memory Store initialized successfully!')
		} catch (error) {
			console.error('❌ Failed to initialize DuckDB:', error)
			throw error
		}
	}

	private async execute(query: string, params: any[] = []): Promise<any[]> {
		try {
			if (!this.connection) {
				throw new Error('Database connection not established')
			}
			
			console.log(`Executing: ${query.substring(0, 60)}...`)
			
			const result = await this.connection.run(query, params)
			const reader = await result.getRows()
			return reader || []
			
		} catch (error) {
			console.error('❌ DuckDB Query Error:', error)
			console.error('Query:', query)
			throw error
		}
	}

	private async setupDatabase(): Promise<void> {
		// Create tables
		await this.execute(`
			CREATE TABLE IF NOT EXISTS nodes (
				id VARCHAR PRIMARY KEY,
				content TEXT NOT NULL,
				type VARCHAR DEFAULT 'memory',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				metadata JSON,
				importance_score DOUBLE DEFAULT 0.5,
				access_count INTEGER DEFAULT 0,
				last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

		await this.execute(`
			CREATE TABLE IF NOT EXISTS entities (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				type VARCHAR NOT NULL,
				properties JSON,
				confidence DOUBLE DEFAULT 1.0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				source_node_ids JSON
			)
		`)

		await this.execute(`
			CREATE TABLE IF NOT EXISTS relations (
				id VARCHAR PRIMARY KEY,
				from_entity_id VARCHAR NOT NULL,
				to_entity_id VARCHAR NOT NULL,
				relation_type VARCHAR NOT NULL,
				strength DOUBLE DEFAULT 1.0,
				properties JSON,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				source_node_ids JSON
			)
		`)

		await this.execute(`
			CREATE TABLE IF NOT EXISTS performance_stats (
				id INTEGER PRIMARY KEY,
				operation VARCHAR NOT NULL,
				latency_ms DOUBLE NOT NULL,
				timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				cache_hit BOOLEAN DEFAULT false,
				result_count INTEGER DEFAULT 0
			)
		`)

		// Create indexes
		const indexQueries = [
			`CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type)`,
			`CREATE INDEX IF NOT EXISTS idx_nodes_created ON nodes(created_at)`,
			`CREATE INDEX IF NOT EXISTS idx_nodes_importance ON nodes(importance_score DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_nodes_access ON nodes(access_count DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`,
			`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`,
			`CREATE INDEX IF NOT EXISTS idx_entities_confidence ON entities(confidence DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_entity_id)`,
			`CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_entity_id)`,
			`CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(relation_type)`,
			`CREATE INDEX IF NOT EXISTS idx_relations_strength ON relations(strength DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_perf_operation ON performance_stats(operation)`,
			`CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_stats(timestamp)`
		]

		for (const query of indexQueries) {
			try {
				await this.execute(query)
			} catch (error) {
				console.warn(`⚠️ Index creation warning:`, error)
			}
		}
	}

	// Core memory operations
	async addMemory(content: string, type = 'memory', metadata: Record<string, any> = {}): Promise<string> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const id = uuidv4()
			const importance = this.calculateImportance(content, metadata)
			
			await this.execute(`
				INSERT INTO nodes (id, content, type, metadata, importance_score)
				VALUES (?, ?, ?, ?, ?)
			`, [id, content, type, JSON.stringify(metadata), importance])

			await this.updateNodeAccess(id)
			this.invalidateCache(['search', 'getByType'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('add_memory', latency, false, 1)
			
			console.log(`✅ Memory added successfully (${latency}ms): ${id}`)
			return id
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('add_memory', latency, false, 0)
			console.error('❌ Error adding memory:', error)
			throw error
		}
	}

	async searchMemories(query: string, options: SearchOptions = {}): Promise<SearchResult> {
		const startTime = Date.now()
		const cacheKey = `search:${query}:${JSON.stringify(options)}`
		
		try {
			await this.initialize()
			
			// Check cache first
			const cached = this.getFromCache(cacheKey)
			if (cached) {
				this.recordPerformance('search_memories', Date.now() - startTime, true, cached.nodes.length)
				return cached
			}
			
			const limit = options.limit || 10
			const whereConditions = []
			const params = []
			
			// Add search condition
			if (query) {
				whereConditions.push('content ILIKE ?')
				params.push(`%${query}%`)
			}
			
			// Add type filter
			if (options.types?.length) {
				whereConditions.push('type IN (' + options.types.map(() => '?').join(',') + ')')
				params.push(...options.types)
			}
			
			const whereClause = whereConditions.length ? 'WHERE ' + whereConditions.join(' AND ') : ''
			
			const result = await this.execute(`
				SELECT * FROM nodes
				${whereClause}
				ORDER BY importance_score DESC, access_count DESC
				LIMIT ?
			`, [...params, limit])
			
			const nodes = result.map((row: any) => this.mapRowToMemoryNode(row))
			
			const searchResult: SearchResult = {
				nodes,
				total_count: nodes.length,
				query_time_ms: Date.now() - startTime
			}
			
			// Cache the result
			this.setCache(cacheKey, searchResult)
			this.recordPerformance('search_memories', searchResult.query_time_ms, false, nodes.length)
			
			return searchResult
			
		} catch (error) {
			this.recordPerformance('search_memories', Date.now() - startTime, false, 0)
			console.error('❌ Error searching memories:', error)
			throw error
		}
	}

	// Helper methods
	private calculateImportance(content: string, metadata: Record<string, any>): number {
		let score = 0.5 // Base score
		
		// Longer content tends to be more important
		score += Math.min(content.length / 1000, 0.3)
		
		// Metadata importance
		if (metadata.priority === 'high') score += 0.2
		if (metadata.urgent) score += 0.1
		
		return Math.min(score, 1.0)
	}

	private async updateNodeAccess(nodeId: string): Promise<void> {
		try {
			await this.execute(`
				UPDATE nodes 
				SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP 
				WHERE id = ?
			`, [nodeId])
		} catch (error) {
			console.warn('⚠️ Failed to update node access:', error)
		}
	}

	private invalidateCache(patterns: string[]): void {
		for (const [key] of this.queryCache) {
			if (patterns.some(pattern => key.includes(pattern))) {
				this.queryCache.delete(key)
			}
		}
	}

	private recordPerformance(operation: string, latency: number, cacheHit: boolean, resultCount: number): void {
		this.metrics.operationCounts[operation] = (this.metrics.operationCounts[operation] || 0) + 1
		
		// Record to database
		this.execute(`
			INSERT INTO performance_stats (operation, latency_ms, cache_hit, result_count)
			VALUES (?, ?, ?, ?)
		`, [operation, latency, cacheHit, resultCount]).catch(error => {
			// Don't fail the main operation if performance logging fails
			console.warn('⚠️ Failed to record performance stats:', error)
		})
	}

	private getFromCache<T>(key: string): T | null {
		const entry = this.queryCache.get(key)
		if (entry && entry.expiry > Date.now()) {
			return entry.data
		}
		this.queryCache.delete(key)
		return null
	}

	private setCache<T>(key: string, data: T): void {
		if (this.queryCache.size >= this.maxCacheSize) {
			// Remove oldest entries
			const entries = Array.from(this.queryCache.entries())
			entries.sort((a, b) => a[1].expiry - b[1].expiry)
			for (let i = 0; i < Math.floor(this.maxCacheSize * 0.2); i++) {
				this.queryCache.delete(entries[i][0])
			}
		}
		
		this.queryCache.set(key, {
			data,
			expiry: Date.now() + this.cacheExpiry
		})
	}

	private mapRowToMemoryNode(row: any): MemoryNode {
		return {
			id: row[0],
			content: row[1],
			type: row[2],
			created_at: row[3],
			updated_at: row[4],
			metadata: JSON.parse(row[5] || '{}'),
			importance_score: row[6] || 0.5,
			access_count: row[7] || 0,
			last_accessed: row[8]
		}
	}

	// Stub methods for MCP compatibility
	async getMemory(id: string): Promise<MemoryNode | null> {
		await this.initialize()
		const result = await this.execute('SELECT * FROM nodes WHERE id = ?', [id])
		return result.length > 0 ? this.mapRowToMemoryNode(result[0]) : null
	}

	async deleteMemory(id: string): Promise<boolean> {
		await this.initialize()
		const result = await this.execute('DELETE FROM nodes WHERE id = ?', [id])
		return true
	}

	async addEntity(entity: Partial<Entity>): Promise<string> {
		await this.initialize()
		const id = uuidv4()
		await this.execute(`
			INSERT INTO entities (id, name, type, properties, confidence)
			VALUES (?, ?, ?, ?, ?)
		`, [id, entity.name, entity.type, JSON.stringify(entity.properties || {}), entity.confidence || 1.0])
		return id
	}

	async addRelation(relation: Partial<Relation>): Promise<string> {
		await this.initialize()
		const id = uuidv4()
		await this.execute(`
			INSERT INTO relations (id, from_entity_id, to_entity_id, relation_type, strength)
			VALUES (?, ?, ?, ?, ?)
		`, [id, relation.from_entity_id, relation.to_entity_id, relation.relation_type, relation.strength || 1.0])
		return id
	}

	async getEntities(options: any = {}): Promise<Entity[]> {
		await this.initialize()
		const result = await this.execute('SELECT * FROM entities LIMIT ?', [options.limit || 50])
		return result.map((row: any) => ({
			id: row[0],
			name: row[1],
			type: row[2],
			properties: JSON.parse(row[3] || '{}'),
			confidence: row[4],
			created_at: row[5],
			updated_at: row[6]
		}))
	}

	async getRelations(options: any = {}): Promise<Relation[]> {
		await this.initialize()
		const result = await this.execute('SELECT * FROM relations LIMIT ?', [options.limit || 50])
		return result.map((row: any) => ({
			id: row[0],
			from_entity_id: row[1],
			to_entity_id: row[2],
			relation_type: row[3],
			strength: row[4],
			created_at: row[5],
			updated_at: row[6]
		}))
	}

	// Additional stub methods
	async deleteEntity(id: string): Promise<boolean> { return true }
	async deleteRelation(id: string): Promise<boolean> { return true }
	async exportData(format?: string): Promise<any> { return {} }
	async importData(data: any, format?: string): Promise<boolean> { return true }
	async getMemoryGraph(centerNodeId?: string, depth?: number): Promise<any> { return {} }
	async consolidateMemories(threshold?: number): Promise<any> { return {} }
	async getMemoryStats(): Promise<any> { return {} }
	async getRecentMemories(limit?: number, timeframe?: string): Promise<MemoryNode[]> { return [] }
	async analyzeMemory(content: string): Promise<any> { return {} }
	async getSimilarMemories(content: string, limit?: number, threshold?: number): Promise<MemoryNode[]> { return [] }
	async clearCache(): Promise<boolean> { this.queryCache.clear(); return true }
	async updateMemory(id: string, updates: any): Promise<boolean> { return true }
	async getMemoriesByType(type: string, limit?: number): Promise<MemoryNode[]> { return [] }
	
	getPerformanceMetrics(): PerformanceMetrics {
		return this.metrics
	}
}