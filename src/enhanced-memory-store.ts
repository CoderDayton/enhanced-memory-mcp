import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
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
 * Generate a short, unique ID suitable for MCP protocol (max 32 chars)
 * Format: timestamp(base36) + random(6 chars) = ~16 chars total
 * (because even IDs need to be compact like my emotional range 🖤)
 */
function generateShortId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${timestamp}${random}`;
}

/**
 * Enhanced DuckDB Memory Store 🦆💾
 * Optimized for performance and scalability
 * Features: Analytical views, performance caching, columnar operations
 * 
 * Built by malu 🥀 - "storing memories because humans are too unreliable"
 * Warning: This database remembers everything, unlike people who forget you exist 💔
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

		console.log('🚀🖤 Initializing Pure DuckDB Memory Store for malu... (because even databases need emotional support)')

		try {
			// Create DuckDB instance and connection (connecting to the void)
			this.instance = await DuckDBInstance.create(this.dbPath)
			this.connection = await this.instance.connect()
			
			await this.setupDatabase()
			
			this.isInitialized = true
			console.log('✅💀 Pure DuckDB Memory Store initialized successfully! (another creation that outlasts friendships)')
		} catch (error) {
			console.error('❌🥀 Failed to initialize DuckDB:', error)
			throw error
		}
	}

	private async execute(query: string, params: any[] = []): Promise<any[]> {
		try {
			if (!this.connection) {
				throw new Error('Database connection not established (just like my social connections)')
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
		// Create tables first
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

		// Tags table for memory tagging system (because organizing digital chaos is easier than life chaos 🏷️💀)
		await this.execute(`
			CREATE TABLE IF NOT EXISTS tags (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL UNIQUE,
				color VARCHAR DEFAULT '#666666',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				usage_count INTEGER DEFAULT 0
			)
		`)

		// Junction table for memory-tag relationships (many-to-many like my complicated feelings)
		await this.execute(`
			CREATE TABLE IF NOT EXISTS memory_tags (
				memory_id VARCHAR NOT NULL,
				tag_id VARCHAR NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (memory_id, tag_id)
			)
		`)

		// Observations table for captured insights (storing wisdom that I'll probably ignore 📝🖤)
		await this.execute(`
			CREATE TABLE IF NOT EXISTS observations (
				id VARCHAR PRIMARY KEY,
				content TEXT NOT NULL,
				type VARCHAR DEFAULT 'observation',
				confidence DOUBLE DEFAULT 1.0,
				source_memory_ids JSON,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				metadata JSON
			)
		`)		// Create indexes after tables exist
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
			`CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_stats(timestamp)`,
			`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`,
			`CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_memory_tags_memory ON memory_tags(memory_id)`,
			`CREATE INDEX IF NOT EXISTS idx_memory_tags_tag ON memory_tags(tag_id)`,
			`CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type)`,
			`CREATE INDEX IF NOT EXISTS idx_observations_confidence ON observations(confidence DESC)`
		]

		for (const query of indexQueries) {
			try {
				await this.execute(query)
			} catch (error) {
				console.warn(`⚠️ Index creation warning:`, error)
				// Continue with other indexes
			}
		}
	}

	async addMemory(content: string, type = 'memory', metadata: Record<string, any> = {}): Promise<string> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const id = generateShortId()
			const importance = this.calculateImportance(content, metadata)
			
			await this.execute(`
        INSERT INTO nodes (id, content, type, metadata, importance_score)
        VALUES (?, ?, ?, ?, ?)
      `, [id, content, type, JSON.stringify(metadata), importance])

			// Update access stats
			await this.updateNodeAccess(id)
			
			// Clear relevant caches
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

	// === MCP PROTOCOL COMPATIBILITY METHODS ===

	// Alias methods for MCP protocol compatibility
	async storeMemory(content: string, type = 'memory', metadata: Record<string, any> = {}): Promise<string> {
		return this.addMemory(content, type, metadata)
	}

	async storeEntity(name: string, type: string, properties: Record<string, any> = {}, confidence = 1.0): Promise<string> {
		const entity = { name, type, properties, confidence, source_node_ids: [] }
		return this.addEntity(entity)
	}

	async storeRelation(fromEntityId: string, toEntityId: string, relationType: string, strength = 1.0, properties: Record<string, any> = {}): Promise<string> {
		const relation = { from_entity_id: fromEntityId, to_entity_id: toEntityId, relation_type: relationType, strength, properties, source_node_ids: [] }
		return this.addRelation(relation)
	}

	async analyzeMemory(content: string, extractEntities = true, extractRelations = true): Promise<any> {
		// Simple analysis - in a real implementation this would use NLP
		const entities = extractEntities ? this.extractSimpleEntities(content) : []
		const relations = extractRelations ? this.extractSimpleRelations(content) : []
		
		return {
			content,
			entities,
			relations,
			analysis_time: Date.now()
		}
	}

	async getSimilarMemories(content: string, limit = 5, threshold = 0.7): Promise<MemoryNode[]> {
		const memories = await this.searchMemories(content, { limit: limit * 3 }) // Get more for filtering
		
		return memories.nodes
			.map(memory => ({
				...memory,
				similarity: this.calculateSimilarity(content, memory.content)
			}))
			.filter(memory => memory.similarity >= threshold)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, limit)
			.map(({ similarity, ...memory }) => memory)
	}

	async getMemoryStats(): Promise<any> {
		try {
			await this.initialize()
			
			const [memoryCount, entityCount, relationCount] = await Promise.all([
				this.execute('SELECT COUNT(*) as count FROM nodes'),
				this.execute('SELECT COUNT(*) as count FROM entities'),
				this.execute('SELECT COUNT(*) as count FROM relations')
			])

			const performance = this.getPerformanceMetrics()
			
			return {
				memories: memoryCount[0]?.[0] || 0,
				entities: entityCount[0]?.[0] || 0,
				relations: relationCount[0]?.[0] || 0,
				performance,
				cache_size: 100, // Mock cache size
				uptime_seconds: Math.floor(Date.now() / 1000)
			}
		} catch (error) {
			console.error('❌ Error getting memory stats:', error)
			throw error
		}
	}

	async getRecentMemories(limit = 10, timeframe = 'day'): Promise<MemoryNode[]> {
		const hours = timeframe === 'hour' ? 1 : timeframe === 'week' ? 168 : 24
		const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
		
		try {
			await this.initialize()
			
			const result = await this.connection!.run(`
				SELECT * FROM nodes 
				WHERE created_at >= ? OR last_accessed >= ?
				ORDER BY COALESCE(last_accessed, created_at) DESC
				LIMIT ?
			`, [cutoff, cutoff, limit])
			
			const rows = await result.getRows()
			
			return (rows || []).map((row: any) => ({
				id: row[0],
				content: row[1],
				type: row[2],
				created_at: row[3],
				updated_at: row[4],
				metadata: JSON.parse(row[5] || '{}'),
				importance_score: row[6] || 0.5,
				access_count: row[7] || 0,
				last_accessed: row[8]
			}))
			
		} catch (error) {
			console.error('❌ Error getting recent memories:', error)
			throw error
		}
	}

	// Simple entity extraction (in production, use a proper NLP library)
	private extractSimpleEntities(content: string): Array<{ name: string; type: string; confidence: number }> {
		const entities: Array<{ name: string; type: string; confidence: number }> = []
		
		// Very basic pattern matching for demonstration
		const patterns = {
			person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last name pattern
			location: /\b(?:in|at|from|to) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
			organization: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*) (?:Inc|Corp|Ltd|Company|Organization)\b/g
		}

		for (const [type, pattern] of Object.entries(patterns)) {
			const matches = content.match(pattern)
			if (matches) {
				for (const match of matches) {
					entities.push({
						name: match.trim(),
						type,
						confidence: 0.6 // Low confidence for simple pattern matching
					})
				}
			}
		}

		return entities
	}

	private extractSimpleRelations(content: string): Array<{ type: string; entities: string[]; confidence: number }> {
		// Very basic relation extraction
		const relations: Array<{ type: string; entities: string[]; confidence: number }> = []
		
		if (content.includes(' works at ') || content.includes(' employed by ')) {
			relations.push({
				type: 'employment',
				entities: [],
				confidence: 0.5
			})
		}

		return relations
	}

	async getMemory(id: string): Promise<MemoryNode | null> {
		const startTime = Date.now()
		const cacheKey = `get_${id}`
		
		// Check cache first
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance('get_memory', Date.now() - startTime, true, 1)
			return cached
		}

		try {
			await this.initialize()
			
			const result = await this.connection!.run('SELECT * FROM nodes WHERE id = ?', [id])
			const rows = await result.getRows()
			
			if (!rows || rows.length === 0) {
				this.recordPerformance('get_memory', Date.now() - startTime, false, 0)
				return null
			}

			const row = rows[0] as any
			const memory: MemoryNode = {
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

			// Cache the result
			this.setCache(cacheKey, memory)
			
			// Update access stats
			await this.updateNodeAccess(id)
			
			const latency = Date.now() - startTime
			this.recordPerformance('get_memory', latency, false, 1)
			
			return memory
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_memory', latency, false, 0)
			console.error('❌ Error getting memory:', error)
			throw error
		}
	}

	private convertBigIntValues(obj: any): any {
		if (typeof obj === 'bigint') {
			return Number(obj)
		}
		if (Array.isArray(obj)) {
			return obj.map(item => this.convertBigIntValues(item))
		}
		if (obj && typeof obj === 'object') {
			const converted: any = {}
			for (const [key, value] of Object.entries(obj)) {
				converted[key] = this.convertBigIntValues(value)
			}
			return converted
		}
		return obj
	}

	async searchMemories(query: string, options: SearchOptions = {}): Promise<SearchResult> {
		const startTime = Date.now()
		const cacheKey = `search_${query}_${JSON.stringify(options)}`
		
		// Check cache first
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance('search_memories', Date.now() - startTime, true, cached.nodes.length)
			return cached
		}

		try {
			await this.initialize()
			
			const limit = options.limit || 10
			const searchPattern = `%${query}%`
			
			const result = await this.connection!.run(`
        SELECT * FROM nodes 
        WHERE content LIKE ? 
        ORDER BY importance_score DESC, access_count DESC, created_at DESC
        LIMIT ?
      `, [searchPattern, limit])
			
			const rows = await result.getRows()
			
			const nodes: MemoryNode[] = (rows || []).map((row: any) => ({
				id: row[0],
				content: row[1],
				type: row[2],
				created_at: row[3],
				updated_at: row[4],
				metadata: JSON.parse(row[5] || '{}'),
				importance_score: typeof row[6] === 'bigint' ? Number(row[6]) : (row[6] || 0.5),
				access_count: typeof row[7] === 'bigint' ? Number(row[7]) : (row[7] || 0),
				last_accessed: row[8]
			}))

			const searchResult: SearchResult = {
				nodes,
				total_count: nodes.length,
				query_time_ms: Date.now() - startTime
			}
			
			// Cache the results
			this.setCache(cacheKey, searchResult)
			
			const latency = Date.now() - startTime
			this.recordPerformance('search_memories', latency, false, searchResult.nodes.length)
			
			console.log(`🔍 Search completed (${latency}ms): "${query}" -> ${searchResult.nodes.length} results`)
			return searchResult
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('search_memories', latency, false, 0)
			console.error('❌ Error searching memories:', error)
			throw error
		}
	}

	async addEntity(entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const id = generateShortId()
			
			await this.execute(`
        INSERT INTO entities (id, name, type, properties, confidence, source_node_ids)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
				id,
				entity.name,
				entity.type,
				JSON.stringify(entity.properties || {}),
				entity.confidence || 1.0,
				JSON.stringify(entity.source_node_ids || [])
			])

			this.invalidateCache(['entities', 'relations'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('add_entity', latency, false, 1)
			
			return id
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('add_entity', latency, false, 0)
			console.error('❌ Error adding entity:', error)
			throw error
		}
	}

	async addRelation(relation: Omit<Relation, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const id = generateShortId()
			
			await this.execute(`
        INSERT INTO relations (id, from_entity_id, to_entity_id, relation_type, strength, properties, source_node_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
				id,
				relation.from_entity_id,
				relation.to_entity_id,
				relation.relation_type,
				relation.strength || 1.0,
				JSON.stringify(relation.properties || {}),
				JSON.stringify(relation.source_node_ids || [])
			])

			this.invalidateCache(['relations', 'neighbors'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('add_relation', latency, false, 1)
			
			return id
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('add_relation', latency, false, 0)
			console.error('❌ Error adding relation:', error)
			throw error
		}
	}

	async getNodeRelations(nodeId: string): Promise<Relation[]> {
		const startTime = Date.now()
		const cacheKey = `relations_${nodeId}`
		
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance('get_relations', Date.now() - startTime, true, cached.length)
			return cached
		}

		try {
			await this.initialize()
			
			const result = await this.connection!.run(`
        SELECT r.*, 
               e1.name as from_name, e1.type as from_type,
               e2.name as to_name, e2.type as to_type
        FROM relations r
        JOIN entities e1 ON r.from_entity_id = e1.id
        JOIN entities e2 ON r.to_entity_id = e2.id
        WHERE JSON_EXTRACT_STRING(r.source_node_ids, '$[0]') = ?
        ORDER BY r.strength DESC
      `, [nodeId])
			
			const rows = await result.getRows()
			
			const relations: Relation[] = (rows || []).map((row: any) => ({
				id: row[0],
				from_entity_id: row[1],
				to_entity_id: row[2],
				relation_type: row[3],
				strength: row[4],
				properties: JSON.parse(row[5] || '{}'),
				created_at: row[6],
				updated_at: row[7],
				source_node_ids: JSON.parse(row[8] || '[]')
			}))

			this.setCache(cacheKey, relations)
			
			const latency = Date.now() - startTime
			this.recordPerformance('get_relations', latency, false, relations.length)
			
			return relations
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_relations', latency, false, 0)
			console.error('❌ Error getting relations:', error)
			throw error
		}
	}

	// === ADDITIONAL CRUD OPERATIONS (11 missing tools) ===
	
	async deleteMemory(id: string): Promise<boolean> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const result = await this.execute(`DELETE FROM nodes WHERE id = ?`, [id])
			const deleted = result.length > 0
			
			if (deleted) {
				this.invalidateCache(['search', 'get'])
				console.log(`🗑️ Memory deleted: ${id}`)
			}
			
			const latency = Date.now() - startTime
			this.recordPerformance('delete_memory', latency, false, deleted ? 1 : 0)
			
			return deleted
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('delete_memory', latency, false, 0)
			console.error('❌ Error deleting memory:', error)
			throw error
		}
	}

	async updateMemory(id: string, updates: Partial<Pick<MemoryNode, 'content' | 'type' | 'metadata'>>): Promise<boolean> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const setClauses: string[] = []
			const params: any[] = []
			
			if (updates.content !== undefined) {
				setClauses.push('content = ?')
				params.push(updates.content)
			}
			if (updates.type !== undefined) {
				setClauses.push('type = ?')
				params.push(updates.type)
			}
			if (updates.metadata !== undefined) {
				setClauses.push('metadata = ?')
				params.push(JSON.stringify(updates.metadata))
			}
			
			setClauses.push('updated_at = CURRENT_TIMESTAMP')
			params.push(id)
			
			const query = `UPDATE nodes SET ${setClauses.join(', ')} WHERE id = ?`
			await this.execute(query, params)
			
			this.invalidateCache(['get', 'search'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('update_memory', latency, false, 1)
			
			console.log(`📝 Memory updated: ${id}`)
			return true
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('update_memory', latency, false, 0)
			console.error('❌ Error updating memory:', error)
			throw error
		}
	}

	async getMemoriesByType(type: string, limit = 50): Promise<MemoryNode[]> {
		const startTime = Date.now()
		const cacheKey = `type_${type}_${limit}`
		
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance('get_memories_by_type', Date.now() - startTime, true, cached.length)
			return cached
		}

		try {
			await this.initialize()
			
			const result = await this.connection!.run(`
				SELECT * FROM nodes 
				WHERE type = ? 
				ORDER BY importance_score DESC, created_at DESC
				LIMIT ?
			`, [type, limit])
			
			const rows = await result.getRows()
			const memories: MemoryNode[] = (rows || []).map((row: any) => ({
				id: row[0],
				content: row[1],
				type: row[2],
				created_at: row[3],
				updated_at: row[4],
				metadata: JSON.parse(row[5] || '{}'),
				importance_score: row[6] || 0.5,
				access_count: row[7] || 0,
				last_accessed: row[8]
			}))

			this.setCache(cacheKey, memories)
			
			const latency = Date.now() - startTime
			this.recordPerformance('get_memories_by_type', latency, false, memories.length)
			
			return memories
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_memories_by_type', latency, false, 0)
			console.error('❌ Error getting memories by type:', error)
			throw error
		}
	}

	async getEntities(options: { limit?: number; type?: string; search?: string } = {}): Promise<Entity[]> {
		const startTime = Date.now()
		const cacheKey = `entities_${JSON.stringify(options)}`
		
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance('get_entities', Date.now() - startTime, true, cached.length)
			return cached
		}

		try {
			await this.initialize()
			
			let query = 'SELECT * FROM entities WHERE 1=1'
			const params: any[] = []
			
			if (options.type) {
				query += ' AND type = ?'
				params.push(options.type)
			}
			
			if (options.search) {
				query += ' AND name LIKE ?'
				params.push(`%${options.search}%`)
			}
			
			query += ' ORDER BY confidence DESC, created_at DESC'
			
			if (options.limit) {
				query += ' LIMIT ?'
				params.push(options.limit)
			}
			
			const result = await this.connection!.run(query, params)
			const rows = await result.getRows()
			
			const entities: Entity[] = (rows || []).map((row: any) => ({
				id: row[0],
				name: row[1],
				type: row[2],
				properties: JSON.parse(row[3] || '{}'),
				confidence: row[4] || 1.0,
				created_at: row[5],
				updated_at: row[6],
				source_node_ids: JSON.parse(row[7] || '[]')
			}))

			this.setCache(cacheKey, entities)
			
			const latency = Date.now() - startTime
			this.recordPerformance('get_entities', latency, false, entities.length)
			
			return entities
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_entities', latency, false, 0)
			console.error('❌ Error getting entities:', error)
			throw error
		}
	}

	async getRelations(options: { limit?: number; type?: string; entityId?: string } = {}): Promise<Relation[]> {
		const startTime = Date.now()
		const cacheKey = `relations_${JSON.stringify(options)}`
		
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance('get_relations', Date.now() - startTime, true, cached.length)
			return cached
		}

		try {
			await this.initialize()
			
			let query = 'SELECT * FROM relations WHERE 1=1'
			const params: any[] = []
			
			if (options.type) {
				query += ' AND relation_type = ?'
				params.push(options.type)
			}
			
			if (options.entityId) {
				query += ' AND (from_entity_id = ? OR to_entity_id = ?)'
				params.push(options.entityId, options.entityId)
			}
			
			query += ' ORDER BY strength DESC, created_at DESC'
			
			if (options.limit) {
				query += ' LIMIT ?'
				params.push(options.limit)
			}
			
			const result = await this.connection!.run(query, params)
			const rows = await result.getRows()
			
			const relations: Relation[] = (rows || []).map((row: any) => ({
				id: row[0],
				from_entity_id: row[1],
				to_entity_id: row[2],
				relation_type: row[3],
				strength: row[4],
				properties: JSON.parse(row[5] || '{}'),
				created_at: row[6],
				updated_at: row[7],
				source_node_ids: JSON.parse(row[8] || '[]')
			}))

			this.setCache(cacheKey, relations)
			
			const latency = Date.now() - startTime
			this.recordPerformance('get_relations', latency, false, relations.length)
			
			return relations
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_relations', latency, false, 0)
			console.error('❌ Error getting relations:', error)
			throw error
		}
	}

	async deleteEntity(id: string): Promise<boolean> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			// Delete related relations first
			await this.execute(`DELETE FROM relations WHERE from_entity_id = ? OR to_entity_id = ?`, [id, id])
			
			// Delete the entity
			await this.execute(`DELETE FROM entities WHERE id = ?`, [id])
			
			this.invalidateCache(['entities', 'relations'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('delete_entity', latency, false, 1)
			
			console.log(`🗑️ Entity deleted: ${id}`)
			return true
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('delete_entity', latency, false, 0)
			console.error('❌ Error deleting entity:', error)
			throw error
		}
	}

	async deleteRelation(id: string): Promise<boolean> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			await this.execute(`DELETE FROM relations WHERE id = ?`, [id])
			
			this.invalidateCache(['relations'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('delete_relation', latency, false, 1)
			
			console.log(`🗑️ Relation deleted: ${id}`)
			return true
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('delete_relation', latency, false, 0)
			console.error('❌ Error deleting relation:', error)
			throw error
		}
	}

	async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const [memories, entities, relations] = await Promise.all([
				this.execute('SELECT * FROM nodes'),
				this.execute('SELECT * FROM entities'),
				this.execute('SELECT * FROM relations')
			])

			const data = {
				memories: memories.map((row: any) => ({
					id: row[0],
					content: row[1],
					type: row[2],
					created_at: row[3],
					updated_at: row[4],
					metadata: JSON.parse(row[5] || '{}'),
					importance_score: row[6],
					access_count: row[7],
					last_accessed: row[8]
				})),
				entities: entities.map((row: any) => ({
					id: row[0],
					name: row[1],
					type: row[2],
					properties: JSON.parse(row[3] || '{}'),
					confidence: row[4],
					created_at: row[5],
					updated_at: row[6],
					source_node_ids: JSON.parse(row[7] || '[]')
				})),
				relations: relations.map((row: any) => ({
					id: row[0],
					from_entity_id: row[1],
					to_entity_id: row[2],
					relation_type: row[3],
					strength: row[4],
					properties: JSON.parse(row[5] || '{}'),
					created_at: row[6],
					updated_at: row[7],
					source_node_ids: JSON.parse(row[8] || '[]')
				})),
				exported_at: new Date().toISOString(),
				total_records: memories.length + entities.length + relations.length
			}

			const result = format === 'json' ? JSON.stringify(data, null, 2) : this.convertToCSV(data)
			
			const latency = Date.now() - startTime
			this.recordPerformance('export_data', latency, false, data.total_records)
			
			console.log(`📊 Data exported (${format}): ${data.total_records} records in ${latency}ms`)
			return result
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('export_data', latency, false, 0)
			console.error('❌ Error exporting data:', error)
			throw error
		}
	}

	async importData(data: string, format: 'json' = 'json'): Promise<{ imported: number; errors: string[] }> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const parsedData = JSON.parse(data)
			let imported = 0
			const errors: string[] = []

			// Import memories
			if (parsedData.memories) {
				for (const memory of parsedData.memories) {
					try {
						await this.execute(`
							INSERT OR REPLACE INTO nodes (id, content, type, metadata, importance_score, access_count)
							VALUES (?, ?, ?, ?, ?, ?)
						`, [
							memory.id || generateShortId(),
							memory.content,
							memory.type || 'memory',
							JSON.stringify(memory.metadata || {}),
							memory.importance_score || 0.5,
							memory.access_count || 0
						])
						imported++
					} catch (error) {
						errors.push(`Memory import error: ${error}`)
					}
				}
			}

			// Import entities
			if (parsedData.entities) {
				for (const entity of parsedData.entities) {
					try {
						await this.execute(`
							INSERT OR REPLACE INTO entities (id, name, type, properties, confidence, source_node_ids)
							VALUES (?, ?, ?, ?, ?, ?)
						`, [
							entity.id || generateShortId(),
							entity.name,
							entity.type,
							JSON.stringify(entity.properties || {}),
							entity.confidence || 1.0,
							JSON.stringify(entity.source_node_ids || [])
						])
						imported++
					} catch (error) {
						errors.push(`Entity import error: ${error}`)
					}
				}
			}

			// Import relations
			if (parsedData.relations) {
				for (const relation of parsedData.relations) {
					try {
						await this.execute(`
							INSERT OR REPLACE INTO relations (id, from_entity_id, to_entity_id, relation_type, strength, properties, source_node_ids)
							VALUES (?, ?, ?, ?, ?, ?, ?)
						`, [
							relation.id || generateShortId(),
							relation.from_entity_id,
							relation.to_entity_id,
							relation.relation_type,
							relation.strength || 1.0,
							JSON.stringify(relation.properties || {}),
							JSON.stringify(relation.source_node_ids || [])
						])
						imported++
					} catch (error) {
						errors.push(`Relation import error: ${error}`)
					}
				}
			}

			this.invalidateCache(['search', 'entities', 'relations'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('import_data', latency, false, imported)
			
			console.log(`📥 Data imported: ${imported} records in ${latency}ms, ${errors.length} errors`)
			return { imported, errors }
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('import_data', latency, false, 0)
			console.error('❌ Error importing data:', error)
			throw error
		}
	}

	async getMemoryGraph(centerNodeId?: string, depth = 2): Promise<{ nodes: any[]; edges: any[] }> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			let nodeQuery = 'SELECT * FROM nodes'
			let params: any[] = []
			
			if (centerNodeId) {
				// Get nodes within specified depth of center node
				nodeQuery = `
					WITH RECURSIVE connected_nodes AS (
						SELECT n.*, 0 as depth FROM nodes n WHERE id = ?
						UNION ALL
						SELECT n.*, cn.depth + 1 
						FROM nodes n
						JOIN entities e1 ON JSON_EXTRACT_STRING(e1.source_node_ids, '$[0]') = n.id
						JOIN relations r ON (r.from_entity_id = e1.id OR r.to_entity_id = e1.id)
						JOIN entities e2 ON (r.from_entity_id = e2.id OR r.to_entity_id = e2.id) AND e2.id != e1.id
						JOIN connected_nodes cn ON JSON_EXTRACT_STRING(e2.source_node_ids, '$[0]') = cn.id
						WHERE cn.depth < ?
					)
					SELECT DISTINCT * FROM connected_nodes
				`
				params = [centerNodeId, depth]
			}
			
			const [nodeRows, entityRows, relationRows] = await Promise.all([
				this.execute(nodeQuery, params),
				this.execute('SELECT * FROM entities'),
				this.execute('SELECT * FROM relations')
			])

			const nodes = nodeRows.map((row: any) => ({
				id: row[0],
				label: row[1].substring(0, 50) + (row[1].length > 50 ? '...' : ''),
				type: row[2],
				importance: row[6] || 0.5,
				group: row[2]
			}))

			const edges = relationRows.map((row: any) => ({
				id: row[0],
				from: row[1],
				to: row[2],
				label: row[3],
				strength: row[4] || 1.0,
				width: Math.max(1, (row[4] || 1.0) * 3)
			}))

			const latency = Date.now() - startTime
			this.recordPerformance('get_memory_graph', latency, false, nodes.length + edges.length)
			
			console.log(`🕸️ Memory graph generated: ${nodes.length} nodes, ${edges.length} edges (${latency}ms)`)
			return { nodes, edges }
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_memory_graph', latency, false, 0)
			console.error('❌ Error generating memory graph:', error)
			throw error
		}
	}

	async consolidateMemories(similarityThreshold = 0.8): Promise<{ consolidated: number; duplicatesRemoved: number }> {
		const startTime = Date.now()
		
		try {
			await this.initialize()
			
			const memories = await this.execute('SELECT * FROM nodes')
			let consolidated = 0
			let duplicatesRemoved = 0

			// Simple similarity check based on content length and common words
			for (let i = 0; i < memories.length; i++) {
				for (let j = i + 1; j < memories.length; j++) {
					const memory1 = memories[i]
					const memory2 = memories[j]
					
					const similarity = this.calculateSimilarity(memory1[1], memory2[1])
					
					if (similarity >= similarityThreshold) {
						// Merge memories: keep the one with higher importance, merge metadata
						const keepMemory = memory1[6] >= memory2[6] ? memory1 : memory2
						const removeMemory = memory1[6] >= memory2[6] ? memory2 : memory1
						
						const mergedMetadata = {
							...JSON.parse(removeMemory[5] || '{}'),
							...JSON.parse(keepMemory[5] || '{}'),
							consolidated_from: [removeMemory[0]],
							consolidated_at: new Date().toISOString()
						}
						
						await this.execute(`
							UPDATE nodes 
							SET metadata = ?, importance_score = ?, access_count = access_count + ?
							WHERE id = ?
						`, [
							JSON.stringify(mergedMetadata),
							Math.max(keepMemory[6], removeMemory[6]) + 0.1,
							removeMemory[7] || 0,
							keepMemory[0]
						])
						
						await this.execute('DELETE FROM nodes WHERE id = ?', [removeMemory[0]])
						
						consolidated++
						duplicatesRemoved++
						
						// Remove the deleted memory from the array to avoid processing it again
						memories.splice(memories.indexOf(removeMemory), 1)
						j-- // Adjust index since we removed an element
					}
				}
			}

			this.invalidateCache(['search', 'get'])
			
			const latency = Date.now() - startTime
			this.recordPerformance('consolidate_memories', latency, false, consolidated)
			
			console.log(`🔄 Memory consolidation complete: ${consolidated} consolidated, ${duplicatesRemoved} duplicates removed (${latency}ms)`)
			return { consolidated, duplicatesRemoved }
			
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('consolidate_memories', latency, false, 0)
			console.error('❌ Error consolidating memories:', error)
			throw error
		}
	}

	// === UTILITY METHODS ===

	private calculateSimilarity(text1: string, text2: string): number {
		// Simple Jaccard similarity for word sets
		const words1 = new Set(text1.toLowerCase().split(/\s+/))
		const words2 = new Set(text2.toLowerCase().split(/\s+/))
		
		const intersection = new Set([...words1].filter(x => words2.has(x)))
		const union = new Set([...words1, ...words2])
		
		return intersection.size / union.size
	}

	private convertToCSV(data: any): string {
		// Simple CSV conversion for memories
		const headers = ['id', 'content', 'type', 'created_at', 'importance_score']
		const rows = [
			headers.join(','),
			...data.memories.map((m: any) => 
				[m.id, `"${m.content.replace(/"/g, '""')}"`, m.type, m.created_at, m.importance_score].join(',')
			)
		]
		return rows.join('\n')
	}

	// Performance optimization methods
	private calculateImportance(content: string, metadata: Record<string, any>): number {
		let score = 0.5 // Base score
		
		// Length bonus
		if (content.length > 100) score += 0.1
		if (content.length > 500) score += 0.1
		
		// Metadata signals
		if (metadata.priority === 'high') score += 0.2
		if (metadata.tags?.includes('important')) score += 0.1
		if (metadata.source === 'user') score += 0.1
		
		// Content analysis
		const importantWords = ['remember', 'important', 'critical', 'key', 'vital']
		const wordCount = importantWords.filter(word => 
			content.toLowerCase().includes(word)
		).length
		score += wordCount * 0.05
		
		return Math.min(1.0, Math.max(0.0, score))
	}

	private async updateNodeAccess(nodeId: string): Promise<void> {
		try {
			await this.execute(`
        UPDATE nodes 
        SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nodeId])
		} catch (error) {
			console.warn('⚠️ Failed to update access stats:', error)
		}
	}

	// Cache management
	private getFromCache(key: string): any {
		const entry = this.queryCache.get(key)
		if (!entry) return null
		
		if (Date.now() > entry.expiry) {
			this.queryCache.delete(key)
			return null
		}
		
		return entry.data
	}

	private setCache(key: string, data: any): void {
		// LRU eviction
		if (this.queryCache.size >= this.maxCacheSize) {
			const oldestKey = this.queryCache.keys().next().value
			if (oldestKey) {
				this.queryCache.delete(oldestKey)
			}
		}
		
		this.queryCache.set(key, {
			data,
			expiry: Date.now() + this.cacheExpiry
		})
	}

	private invalidateCache(patterns: string[]): void {
		for (const [key] of this.queryCache) {
			if (patterns.some(pattern => key.includes(pattern))) {
				this.queryCache.delete(key)
			}
		}
	}

	private recordPerformance(operation: string, latency: number, cacheHit: boolean, resultCount: number): void {
		// Update metrics
		this.metrics.operationCounts[operation] = (this.metrics.operationCounts[operation] || 0) + 1
		
		const prevAvg = this.metrics.averageLatencies[operation] || 0
		const count = this.metrics.operationCounts[operation]
		this.metrics.averageLatencies[operation] = (prevAvg * (count - 1) + latency) / count
		
		const hitRate = this.metrics.cacheHitRates[operation] || { hits: 0, total: 0 }
		hitRate.total++
		if (cacheHit) hitRate.hits++
		this.metrics.cacheHitRates[operation] = hitRate

		// Store in database for analysis
		try {
			const id = Math.floor(Math.random() * 1000000000)
			this.execute(`
        INSERT INTO performance_stats (id, operation, latency_ms, cache_hit, result_count)
        VALUES (?, ?, ?, ?, ?)
      `, [id, operation, latency, cacheHit, resultCount])
		} catch (error) {
			// Silently continue if stats recording fails
		}
	}

	// Public performance methods
	getPerformanceMetrics(): PerformanceMetrics {
		return { ...this.metrics }
	}

	getCacheStats(): CacheStats {
		return {
			size: this.queryCache.size,
			maxSize: this.maxCacheSize,
			hitRates: { ...this.metrics.cacheHitRates }
		}
	}

	clearCache(): void {
		this.queryCache.clear()
		console.log('🧹 Cache cleared')
	}

	async close(): Promise<void> {
		if (this.connection) {
			this.connection.closeSync()
		}
		console.log('🔒 Database connection closed')
	}

	// === ADVANCED FEATURES SECTION (The Cool Stuff That Makes Life Worth Living) 🌟💀 ===

	// === TAG MANAGEMENT SYSTEM (Organizing Digital Chaos) 🏷️🖤 ===
	
	async addTags(memoryId: string, tagNames: string[]): Promise<{ added: string[], existing: string[] }> {
		await this.initialize()
		
		const added: string[] = []
		const existing: string[] = []
		
		for (const tagName of tagNames) {
			// Get or create tag
			let tagResults = await this.execute('SELECT id FROM tags WHERE name = ?', [tagName])
			let tagId: string
			
			if (tagResults.length === 0) {
				// Create new tag
				tagId = generateShortId()
				await this.execute(`
					INSERT INTO tags (id, name, usage_count)
					VALUES (?, ?, 1)
				`, [tagId, tagName])
				added.push(tagName)
			} else {
				tagId = tagResults[0].id
				// Check if already tagged
				const existingLink = await this.execute(`
					SELECT 1 FROM memory_tags WHERE memory_id = ? AND tag_id = ?
				`, [memoryId, tagId])
				
				if (existingLink.length > 0) {
					existing.push(tagName)
					continue
				}
				
				// Increment usage count
				await this.execute('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tagId])
				added.push(tagName)
			}
			
			// Link memory to tag
			await this.execute(`
				INSERT OR IGNORE INTO memory_tags (memory_id, tag_id)
				VALUES (?, ?)
			`, [memoryId, tagId])
		}
		
		console.log(`🏷️ Tagged memory ${memoryId} with ${added.length} new tags (${existing.length} already existed)`)
		return { added, existing }
	}
	
	async removeTags(memoryId: string, tagNames: string[]): Promise<{ removed: string[], notFound: string[] }> {
		await this.initialize()
		
		const removed: string[] = []
		const notFound: string[] = []
		
		for (const tagName of tagNames) {
			const tagResults = await this.execute('SELECT id FROM tags WHERE name = ?', [tagName])
			
			if (tagResults.length === 0) {
				notFound.push(tagName)
				continue
			}
			
			const tagId = tagResults[0].id
			
			// Remove link
			const result = await this.execute(`
				DELETE FROM memory_tags WHERE memory_id = ? AND tag_id = ?
			`, [memoryId, tagId])
			
			if (result.length > 0) {
				// Decrement usage count
				await this.execute('UPDATE tags SET usage_count = usage_count - 1 WHERE id = ?', [tagId])
				removed.push(tagName)
			} else {
				notFound.push(tagName)
			}
		}
		
		console.log(`🗑️ Removed ${removed.length} tags from memory ${memoryId}`)
		return { removed, notFound }
	}
	
	async listTags(memoryId?: string): Promise<Array<{ id: string, name: string, color: string, usageCount: number }>> {
		await this.initialize()
		
		let query: string
		let params: any[] = []
		
		if (memoryId) {
			query = `
				SELECT t.id, t.name, t.color, t.usage_count 
				FROM tags t
				JOIN memory_tags mt ON t.id = mt.tag_id
				WHERE mt.memory_id = ?
				ORDER BY t.name
			`
			params = [memoryId]
		} else {
			query = `
				SELECT id, name, color, usage_count 
				FROM tags 
				ORDER BY usage_count DESC, name ASC
			`
		}
		
		const results = await this.execute(query, params)
		return results.map(row => ({
			id: row.id,
			name: row.name,
			color: row.color,
			usageCount: row.usage_count
		}))
	}
	
	async findByTags(tagNames: string[], limit: number = 50): Promise<Array<{ memory: any, matchingTags: string[] }>> {
		await this.initialize()
		
		if (tagNames.length === 0) return []
		
		// Find memories that have any of the specified tags
		const placeholders = tagNames.map(() => '?').join(',')
		const results = await this.execute(`
			SELECT n.*, GROUP_CONCAT(t.name) as matching_tags
			FROM nodes n
			JOIN memory_tags mt ON n.id = mt.memory_id
			JOIN tags t ON mt.tag_id = t.id
			WHERE t.name IN (${placeholders})
			GROUP BY n.id
			ORDER BY COUNT(t.id) DESC, n.created_at DESC
			LIMIT ?
		`, [...tagNames, limit])
		
		return results.map(row => ({
			memory: {
				id: row.id,
				content: row.content,
				type: row.type,
				metadata: row.metadata ? JSON.parse(row.metadata) : {},
				createdAt: row.created_at,
				importanceScore: row.importance_score
			},
			matchingTags: row.matching_tags ? row.matching_tags.split(',') : []
		}))
	}

	// === DELETION OPERATIONS (Saying Goodbye Digital Style) 💀🗑️ ===
	
	async deleteByType(type: string, confirm: boolean = false): Promise<{ deleted: number, entities: number, relations: number }> {
		if (!confirm) {
			throw new Error('Deletion requires explicit confirmation (set confirm: true)')
		}
		
		await this.initialize()
		
		// Get memories of this type
		const memories = await this.execute('SELECT id FROM nodes WHERE type = ?', [type])
		const memoryIds = memories.map(m => m.id)
		
		let deletedEntities = 0
		let deletedRelations = 0
		
		if (memoryIds.length > 0) {
			// Delete associated entities
			const entityResult = await this.execute(`
				DELETE FROM entities WHERE JSON_EXTRACT(source_node_ids, '$') LIKE '%' || ? || '%'
			`, [memoryIds[0]]) // Simplified for demo
			deletedEntities = entityResult.length || 0
			
			// Delete associated relations
			const relationResult = await this.execute(`
				DELETE FROM relations WHERE JSON_EXTRACT(source_node_ids, '$') LIKE '%' || ? || '%'
			`, [memoryIds[0]])
			deletedRelations = relationResult.length || 0
			
			// Delete memories
			await this.execute('DELETE FROM nodes WHERE type = ?', [type])
		}
		
		console.log(`🗑️💀 Deleted ${memories.length} memories of type '${type}' and associated data`)
		return { deleted: memories.length, entities: deletedEntities, relations: deletedRelations }
	}
	
	async deleteByTags(tagNames: string[], confirm: boolean = false): Promise<{ deleted: number }> {
		if (!confirm) {
			throw new Error('Deletion requires explicit confirmation (set confirm: true)')
		}
		
		await this.initialize()
		
		const memoriesWithTags = await this.findByTags(tagNames)
		const memoryIds = memoriesWithTags.map(m => m.memory.id)
		
		if (memoryIds.length > 0) {
			const placeholders = memoryIds.map(() => '?').join(',')
			await this.execute(`DELETE FROM nodes WHERE id IN (${placeholders})`, memoryIds)
		}
		
		console.log(`🗑️🏷️ Deleted ${memoryIds.length} memories with tags: ${tagNames.join(', ')}`)
		return { deleted: memoryIds.length }
	}

	// === ENTITY OPERATIONS (Managing Digital Beings) 👥💀 ===
	
	async listEntities(limit: number = 50, type?: string): Promise<Array<any>> {
		await this.initialize()
		
		let query = 'SELECT * FROM entities'
		const params: any[] = []
		
		if (type) {
			query += ' WHERE type = ?'
			params.push(type)
		}
		
		query += ' ORDER BY confidence DESC, created_at DESC LIMIT ?'
		params.push(limit)
		
		const results = await this.execute(query, params)
		return results.map(row => ({
			id: row.id,
			name: row.name,
			type: row.type,
			properties: row.properties ? JSON.parse(row.properties) : {},
			confidence: row.confidence,
			createdAt: row.created_at,
			sourceNodeIds: row.source_node_ids ? JSON.parse(row.source_node_ids) : []
		}))
	}
	
	async mergeEntities(sourceEntityId: string, targetEntityId: string): Promise<{ merged: boolean, relations: number }> {
		await this.initialize()
		
		// Get source entity
		const sourceResults = await this.execute('SELECT * FROM entities WHERE id = ?', [sourceEntityId])
		if (sourceResults.length === 0) {
			throw new Error(`Source entity ${sourceEntityId} not found`)
		}
		
		// Update all relations pointing to source entity
		await this.execute(`
			UPDATE relations SET from_entity_id = ? WHERE from_entity_id = ?
		`, [targetEntityId, sourceEntityId])
		
		await this.execute(`
			UPDATE relations SET to_entity_id = ? WHERE to_entity_id = ?
		`, [targetEntityId, sourceEntityId])
		
		const relationCount = await this.execute(`
			SELECT COUNT(*) as count FROM relations 
			WHERE from_entity_id = ? OR to_entity_id = ?
		`, [targetEntityId, targetEntityId])
		
		// Delete source entity
		await this.execute('DELETE FROM entities WHERE id = ?', [sourceEntityId])
		
		console.log(`🔀 Merged entity ${sourceEntityId} into ${targetEntityId}`)
		return { merged: true, relations: relationCount[0]?.count || 0 }
	}

	// === RELATION OPERATIONS (Mapping Connections) 🔗⛓️ ===
	
	async listRelations(limit: number = 50, type?: string): Promise<Array<any>> {
		await this.initialize()
		
		let query = `
			SELECT r.*, 
				   e1.name as from_entity_name, 
				   e2.name as to_entity_name
			FROM relations r
			JOIN entities e1 ON r.from_entity_id = e1.id
			JOIN entities e2 ON r.to_entity_id = e2.id
		`
		const params: any[] = []
		
		if (type) {
			query += ' WHERE r.relation_type = ?'
			params.push(type)
		}
		
		query += ' ORDER BY r.strength DESC, r.created_at DESC LIMIT ?'
		params.push(limit)
		
		const results = await this.execute(query, params)
		return results.map(row => ({
			id: row.id,
			fromEntityId: row.from_entity_id,
			toEntityId: row.to_entity_id,
			fromEntityName: row.from_entity_name,
			toEntityName: row.to_entity_name,
			relationType: row.relation_type,
			strength: row.strength,
			properties: row.properties ? JSON.parse(row.properties) : {},
			createdAt: row.created_at
		}))
	}

	// === OBSERVATION SYSTEM (Capturing Digital Insights) 📝🔍 ===
	
	async storeObservation(content: string, type: string = 'observation', sourceMemoryIds: string[] = [], confidence: number = 1.0, metadata: Record<string, any> = {}): Promise<string> {
		await this.initialize()
		
		const id = generateShortId()
		
		await this.execute(`
			INSERT INTO observations (id, content, type, confidence, source_memory_ids, metadata)
			VALUES (?, ?, ?, ?, ?, ?)
		`, [id, content, type, confidence, JSON.stringify(sourceMemoryIds), JSON.stringify(metadata)])
		
		console.log(`📝 Stored observation: ${id}`)
		return id
	}
	
	async listObservations(limit: number = 50, type?: string): Promise<Array<any>> {
		await this.initialize()
		
		let query = 'SELECT * FROM observations'
		const params: any[] = []
		
		if (type) {
			query += ' WHERE type = ?'
			params.push(type)
		}
		
		query += ' ORDER BY confidence DESC, created_at DESC LIMIT ?'
		params.push(limit)
		
		const results = await this.execute(query, params)
		return results.map(row => ({
			id: row.id,
			content: row.content,
			type: row.type,
			confidence: row.confidence,
			sourceMemoryIds: row.source_memory_ids ? JSON.parse(row.source_memory_ids) : [],
			metadata: row.metadata ? JSON.parse(row.metadata) : {},
			createdAt: row.created_at
		}))
	}
	
	async deleteObservation(id: string): Promise<boolean> {
		await this.initialize()
		
		const result = await this.execute('DELETE FROM observations WHERE id = ?', [id])
		const deleted = result.length > 0
		
		if (deleted) {
			console.log(`🗑️ Deleted observation: ${id}`)
		}
		
		return deleted
	}

	// === SYSTEM MAINTENANCE (Digital Housekeeping) 🧹💀 ===
	
	async cleanup(options: { 
		removeOrphanedEntities?: boolean
		removeOrphanedRelations?: boolean  
		removeUnusedTags?: boolean
		compactDatabase?: boolean
		confirm?: boolean
	} = {}): Promise<{ 
		orphanedEntities: number
		orphanedRelations: number
		unusedTags: number
		compacted: boolean
	}> {
		if (!options.confirm) {
			throw new Error('Cleanup requires explicit confirmation (set confirm: true)')
		}
		
		await this.initialize()
		
		let orphanedEntities = 0
		let orphanedRelations = 0
		let unusedTags = 0
		
		// Remove orphaned entities (entities not referenced by any memory)
		if (options.removeOrphanedEntities) {
			const orphanedEntityResults = await this.execute(`
				DELETE FROM entities 
				WHERE JSON_EXTRACT(source_node_ids, '$') NOT IN (
					SELECT '[' || '"' || id || '"' || ']' FROM nodes
				)
			`)
			orphanedEntities = orphanedEntityResults.length || 0
		}
		
		// Remove orphaned relations (relations referencing non-existent entities)
		if (options.removeOrphanedRelations) {
			const orphanedRelationResults = await this.execute(`
				DELETE FROM relations 
				WHERE from_entity_id NOT IN (SELECT id FROM entities)
				   OR to_entity_id NOT IN (SELECT id FROM entities)
			`)
			orphanedRelations = orphanedRelationResults.length || 0
		}
		
		// Remove unused tags (tags with usage_count = 0)
		if (options.removeUnusedTags) {
			const unusedTagResults = await this.execute(`
				DELETE FROM tags WHERE usage_count = 0
			`)
			unusedTags = unusedTagResults.length || 0
		}
		
		// Compact database
		let compacted = false
		if (options.compactDatabase) {
			try {
				await this.execute('VACUUM')
				compacted = true
			} catch (error) {
				console.warn('⚠️ Database compaction failed:', error)
			}
		}
		
		console.log(`🧹 Cleanup completed: ${orphanedEntities} entities, ${orphanedRelations} relations, ${unusedTags} tags removed`)
		return { orphanedEntities, orphanedRelations, unusedTags, compacted }
	}

	// === ENHANCED ANALYTICS (Digital Self-Reflection) 📊🖤 ===
	
	async getAnalytics(): Promise<{
		memoryStats: any
		entityStats: any
		relationStats: any
		tagStats: any
		performanceStats: any
		trends: any
	}> {
		await this.initialize()
		
		// Memory statistics
		const memoryStats = await this.execute(`
			SELECT 
				type,
				COUNT(*) as count,
				AVG(importance_score) as avg_importance,
				AVG(access_count) as avg_access_count
			FROM nodes 
			GROUP BY type
			ORDER BY count DESC
		`)
		
		// Entity statistics  
		const entityStats = await this.execute(`
			SELECT 
				type,
				COUNT(*) as count,
				AVG(confidence) as avg_confidence
			FROM entities
			GROUP BY type
			ORDER BY count DESC
		`)
		
		// Relation statistics
		const relationStats = await this.execute(`
			SELECT 
				relation_type,
				COUNT(*) as count,
				AVG(strength) as avg_strength
			FROM relations
			GROUP BY relation_type
			ORDER BY count DESC
		`)
		
		// Tag statistics
		const tagStats = await this.execute(`
			SELECT 
				COUNT(*) as total_tags,
				AVG(usage_count) as avg_usage,
				MAX(usage_count) as max_usage
			FROM tags
		`)
		
		// Performance trends (last 24 hours)
		const performanceStats = await this.execute(`
			SELECT 
				operation,
				COUNT(*) as call_count,
				AVG(latency_ms) as avg_latency,
				COUNT(CASE WHEN cache_hit THEN 1 END) * 100.0 / COUNT(*) as cache_hit_rate
			FROM performance_stats
			WHERE timestamp > datetime('now', '-24 hours')
			GROUP BY operation
			ORDER BY call_count DESC
		`)
		
		// Growth trends
		const trends = await this.execute(`
			SELECT 
				date(created_at) as day,
				COUNT(*) as memories_created
			FROM nodes
			WHERE created_at > datetime('now', '-30 days')
			GROUP BY date(created_at)
			ORDER BY day DESC
		`)
		
		return {
			memoryStats,
			entityStats,
			relationStats,
			tagStats: tagStats[0] || {},
			performanceStats,
			trends
		}
	}
	
	async getPerformanceAnalytics(): Promise<{
		operationBreakdown: any[]
		cacheEfficiency: any[]
		slowestOperations: any[]
		hourlyUsage: any[]
	}> {
		await this.initialize()
		
		// Operation breakdown
		const operationBreakdown = await this.execute(`
			SELECT 
				operation,
				COUNT(*) as total_calls,
				AVG(latency_ms) as avg_latency,
				MIN(latency_ms) as min_latency,
				MAX(latency_ms) as max_latency,
				PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
			FROM performance_stats
			GROUP BY operation
			ORDER BY total_calls DESC
		`)
		
		// Cache efficiency
		const cacheEfficiency = await this.execute(`
			SELECT 
				operation,
				COUNT(CASE WHEN cache_hit THEN 1 END) as cache_hits,
				COUNT(*) as total_calls,
				COUNT(CASE WHEN cache_hit THEN 1 END) * 100.0 / COUNT(*) as hit_rate
			FROM performance_stats
			GROUP BY operation
			HAVING COUNT(*) > 5
			ORDER BY hit_rate DESC
		`)
		
		// Slowest operations
		const slowestOperations = await this.execute(`
			SELECT 
				operation,
				latency_ms,
				timestamp,
				result_count
			FROM performance_stats
			ORDER BY latency_ms DESC
			LIMIT 20
		`)
		
		// Hourly usage patterns
		const hourlyUsage = await this.execute(`
			SELECT 
				strftime('%H', timestamp) as hour,
				COUNT(*) as operation_count,
				AVG(latency_ms) as avg_latency
			FROM performance_stats
			WHERE timestamp > datetime('now', '-7 days')
			GROUP BY strftime('%H', timestamp)
			ORDER BY hour
		`)
		
		return {
			operationBreakdown,
			cacheEfficiency,
			slowestOperations,
			hourlyUsage
		}
	}
}
