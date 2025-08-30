import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { config } from 'dotenv'
import {
	MemoryNode,
	Entity,
	Relation,
	SearchOptions,
	PerformanceMetrics,
	SearchResult,
	CacheEntry,
	CacheStats,
} from './types.js'

// Load environment variables
config()

// Configuration with environment variable support
const CONFIG = {
	DATABASE_PATH: process.env.DATABASE_PATH || 'data/memory.duckdb',
	BACKUP_PATH: process.env.BACKUP_PATH || 'backups/',
	CACHE_SIZE: (() => {
		const size = parseInt(process.env.CACHE_SIZE || '1000')
		return isNaN(size) ? 1000 : size
	})(),
	CACHE_EXPIRY_MS: (() => {
		const expiry = parseInt(process.env.CACHE_EXPIRY_MS || '300000')
		return isNaN(expiry) ? 300000 : expiry
	})(),
	MAX_SEARCH_RESULTS: (() => {
		const maxResults = parseInt(process.env.MAX_SEARCH_RESULTS || '100')
		return isNaN(maxResults) ? 100 : maxResults
	})(),
	DEFAULT_SIMILARITY_LIMIT: (() => {
		const limit = parseInt(process.env.DEFAULT_SIMILARITY_LIMIT || '5')
		return isNaN(limit) ? 5 : limit
	})(),
	SIMILARITY_THRESHOLD: (() => {
		const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7')
		return isNaN(threshold) ? 0.7 : threshold
	})(),
	DEFAULT_SEARCH_LIMIT: (() => {
		const limit = parseInt(process.env.DEFAULT_SEARCH_LIMIT || '50')
		return isNaN(limit) ? 50 : limit
	})(),
	ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
	ANALYTICS_RETENTION_DAYS: (() => {
		const days = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '30')
		return isNaN(days) ? 30 : days
	})(),
	LOG_LEVEL: process.env.LOG_LEVEL || 'info',
	NODE_ENV: process.env.NODE_ENV || 'production',
}

/**
 * Generate a short, unique ID suitable for MCP protocol (max 32 chars)
 * Format: timestamp(base36) + random(6 chars) = ~16 chars total
 * (because even IDs need to be compact like my emotional range 🖤)
 */
function generateShortId(): string {
	const timestamp = Date.now().toString(36)
	const random = Math.random().toString(36).substring(2, 8)
	return `${timestamp}${random}`
}

/**
 * Advanced Search Engine Classes 🔍💀
 * Multiple search strategies for finding memories like finding meaning in life - difficult but necessary
 */

// Trie-based search for fast prefix matching and autocomplete
class TrieSearchEngine {
	private root = new Map<string, any>()

	// Build trie from word list
	buildIndex(words: Array<{ word: string; memoryId: string; frequency: number }>): void {
		for (const { word, memoryId, frequency } of words) {
			this.insertWord(word.toLowerCase(), memoryId, frequency)
		}
	}

	private insertWord(word: string, memoryId: string, frequency: number): void {
		let current = this.root
		for (const char of word) {
			if (!current.has(char)) {
				current.set(char, new Map())
			}
			current = current.get(char)
		}

		if (!current.has('$end$')) {
			current.set('$end$', [])
		}
		current.get('$end$').push({ memoryId, frequency })
	}

	// Find all words with given prefix
	findByPrefix(prefix: string): Array<{ memoryId: string; frequency: number }> {
		let current = this.root
		for (const char of prefix.toLowerCase()) {
			if (!current.has(char)) {
				return []
			}
			current = current.get(char)
		}

		const results: Array<{ memoryId: string; frequency: number }> = []
		this.collectWords(current, results)
		return results.sort((a, b) => b.frequency - a.frequency)
	}

	private collectWords(
		node: Map<string, any>,
		results: Array<{ memoryId: string; frequency: number }>
	): void {
		if (node.has('$end$')) {
			results.push(...node.get('$end$'))
		}

		for (const [key, child] of node) {
			if (key !== '$end$' && child instanceof Map) {
				this.collectWords(child, results)
			}
		}
	}
}

// Fuzzy search with edit distance for typo tolerance
class FuzzySearchEngine {
	// Calculate Levenshtein distance between two strings
	private editDistance(a: string, b: string): number {
		const matrix = Array(a.length + 1)
			.fill(null)
			.map(() => Array(b.length + 1).fill(0))

		for (let i = 0; i <= a.length; i++) matrix[i][0] = i
		for (let j = 0; j <= b.length; j++) matrix[0][j] = j

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				if (a[i - 1] === b[j - 1]) {
					matrix[i][j] = matrix[i - 1][j - 1]
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j] + 1, // deletion
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j - 1] + 1 // substitution
					)
				}
			}
		}
		return matrix[a.length][b.length]
	}

	// Find fuzzy matches with maximum edit distance
	findFuzzyMatches(
		query: string,
		words: string[],
		maxDistance = 2
	): Array<{ word: string; distance: number }> {
		const matches: Array<{ word: string; distance: number }> = []

		for (const word of words) {
			const distance = this.editDistance(query.toLowerCase(), word.toLowerCase())
			if (distance <= maxDistance) {
				matches.push({ word, distance })
			}
		}

		return matches.sort((a, b) => a.distance - b.distance)
	}

	// Generate trigrams for substring matching
	generateTrigrams(text: string): string[] {
		if (!text || typeof text !== 'string') {
			return []
		}

		const trigrams: string[] = []
		const padded = `  ${text.toLowerCase()}  `

		for (let i = 0; i < padded.length - 2; i++) {
			trigrams.push(padded.substring(i, i + 3))
		}

		return trigrams
	}

	// Calculate similarity based on shared trigrams
	trigramSimilarity(a: string, b: string): number {
		if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
			return 0
		}

		const trigramsA = new Set(this.generateTrigrams(a))
		const trigramsB = new Set(this.generateTrigrams(b))

		const intersection = new Set([...trigramsA].filter((x) => trigramsB.has(x)))
		const union = new Set([...trigramsA, ...trigramsB])

		return union.size > 0 ? intersection.size / union.size : 0
	}
}

// Vector-based search with TF-IDF scoring
class VectorSearchEngine {
	private idfCache = new Map<string, number>()
	private totalDocuments = 0

	// Calculate TF-IDF vector for a document
	calculateTfIdf(
		words: string[],
		documentFreqs: Map<string, number>,
		totalDocs: number
	): Map<string, number> {
		const tf = new Map<string, number>()
		const totalWords = words.length

		// Calculate term frequency
		for (const word of words) {
			tf.set(word, (tf.get(word) || 0) + 1 / totalWords)
		}

		// Calculate TF-IDF
		const tfidf = new Map<string, number>()
		for (const [term, freq] of tf) {
			const idf = Math.log(totalDocs / (documentFreqs.get(term) || 1))
			tfidf.set(term, freq * idf)
		}

		return tfidf
	}

	// Calculate cosine similarity between two TF-IDF vectors
	cosineSimilarity(vectorA: Map<string, number>, vectorB: Map<string, number>): number {
		const keysA = Array.from(vectorA.keys())
		const keysB = Array.from(vectorB.keys())
		const allKeys = new Set([...keysA, ...keysB])

		let dotProduct = 0
		let normA = 0
		let normB = 0

		for (const key of allKeys) {
			const a = vectorA.get(key) || 0
			const b = vectorB.get(key) || 0

			dotProduct += a * b
			normA += a * a
			normB += b * b
		}

		const denominator = Math.sqrt(normA) * Math.sqrt(normB)
		return denominator > 0 ? dotProduct / denominator : 0
	}

	// Tokenize and clean text
	tokenize(text: string): string[] {
		if (!text || typeof text !== 'string') return []
		return text
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length > 2)
	}
}

// Hybrid search engine combining all strategies
class HybridSearchEngine {
	combineResults(
		trieResults: Array<{ memoryId: string; score: number }>,
		fuzzyResults: Array<{ memoryId: string; score: number }>,
		vectorResults: Array<{ memoryId: string; score: number }>
	): Array<{ memoryId: string; finalScore: number; sources: string[] }> {
		const combined = new Map<string, { score: number; sources: string[] }>()

		// Combine results with weighted scoring
		const addResults = (
			results: Array<{ memoryId: string; score: number }>,
			source: string,
			weight: number
		) => {
			for (const { memoryId, score } of results) {
				if (!combined.has(memoryId)) {
					combined.set(memoryId, { score: 0, sources: [] })
				}
				const entry = combined.get(memoryId)!
				entry.score += score * weight
				entry.sources.push(source)
			}
		}

		addResults(trieResults, 'trie', 0.4)
		addResults(fuzzyResults, 'fuzzy', 0.3)
		addResults(vectorResults, 'vector', 0.3)

		// Convert to array and sort by final score
		return Array.from(combined.entries())
			.map(([memoryId, { score, sources }]) => ({
				memoryId,
				finalScore: score,
				sources,
			}))
			.sort((a, b) => b.finalScore - a.finalScore)
	}
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
	private cacheAccessTimes = new Map<string, number>() // Track access times for LRU
	private readonly maxCacheSize = Number(CONFIG.CACHE_SIZE) || 1000
	private readonly cacheExpiry = Number(CONFIG.CACHE_EXPIRY_MS) || 5 * 60 * 1000 // 5 minutes default

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

	// Advanced Search Engines (because finding things shouldn't be harder than finding purpose 🔍💀)
	private searchEngines = {
		trie: new TrieSearchEngine(),
		fuzzy: new FuzzySearchEngine(),
		vector: new VectorSearchEngine(),
		hybrid: new HybridSearchEngine(),
	}

	constructor(private dbPath = CONFIG.DATABASE_PATH) {}

	async initialize(): Promise<void> {
		if (this.isInitialized) return

		console.log(
			'🚀🖤 Initializing Pure DuckDB Memory Store for malu... (because even databases need emotional support)'
		)

		try {
			// Ensure the database directory exists (creating paths like I create emotional barriers)
			const dbDir = dirname(this.dbPath)
			try {
				mkdirSync(dbDir, { recursive: true })
				console.log(`📁💀 Created database directory: ${dbDir}`)
			} catch (dirError: any) {
				// Directory might already exist, that's fine (unlike my social life)
				if (dirError?.code !== 'EEXIST') {
					console.warn('⚠️ Directory creation warning:', dirError)
				}
			}

			// Create DuckDB instance and connection (connecting to the void)
			this.instance = await DuckDBInstance.create(this.dbPath)
			this.connection = await this.instance.connect()

			await this.setupDatabase()

			this.isInitialized = true
			console.log(
				'✅💀 Pure DuckDB Memory Store initialized successfully! (another creation that outlasts friendships)'
			)

			// Set up periodic cache cleanup
			setInterval(() => {
				try {
					this.cleanupExpiredCache()
				} catch (error) {
					console.error('❌ Cache cleanup error:', error)
				}
			}, 60000) // Clean every minute
		} catch (error) {
			console.error('❌🥀 Failed to initialize DuckDB:', error)
			throw error
		}
	}

	private async execute(query: string, params: any[] = []): Promise<any[]> {
		try {
			if (!this.connection) {
				throw new Error(
					'Database connection not established (just like my social connections)'
				)
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
		`)

		// Advanced Search Index Tables (because finding memories shouldn't be as hard as finding happiness 🔍💀)

		// Word-level inverted index for fast text searches
		await this.execute(`
			CREATE TABLE IF NOT EXISTS search_index (
				id VARCHAR PRIMARY KEY,
				word VARCHAR NOT NULL,
				memory_id VARCHAR NOT NULL,
				position INTEGER NOT NULL,
				frequency INTEGER DEFAULT 1,
				field_type VARCHAR DEFAULT 'content',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(word, memory_id, field_type)
			)
		`)

		// Trigram index for fuzzy/typo-tolerant search
		await this.execute(`
			CREATE TABLE IF NOT EXISTS trigram_index (
				id VARCHAR PRIMARY KEY,
				trigram VARCHAR(3) NOT NULL,
				memory_id VARCHAR NOT NULL,
				word VARCHAR NOT NULL,
				position INTEGER NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

		// Search vectors for TF-IDF and similarity calculations
		await this.execute(`
			CREATE TABLE IF NOT EXISTS search_vectors (
				id VARCHAR PRIMARY KEY,
				memory_id VARCHAR NOT NULL UNIQUE,
				vector_data JSON NOT NULL,
				word_count INTEGER DEFAULT 0,
				unique_words INTEGER DEFAULT 0,
				tf_idf_norm DOUBLE DEFAULT 0.0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

		// Search performance cache
		await this.execute(`
			CREATE TABLE IF NOT EXISTS search_cache (
				id VARCHAR PRIMARY KEY,
				query_hash VARCHAR NOT NULL UNIQUE,
				query_text VARCHAR NOT NULL,
				search_type VARCHAR DEFAULT 'standard',
				result_data JSON NOT NULL,
				result_count INTEGER DEFAULT 0,
				execution_time_ms DOUBLE DEFAULT 0,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				access_count INTEGER DEFAULT 1,
				last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)

		// Create indexes after tables exist
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
			`CREATE INDEX IF NOT EXISTS idx_observations_confidence ON observations(confidence DESC)`,
			// Advanced Search Indexes
			`CREATE INDEX IF NOT EXISTS idx_search_word ON search_index(word)`,
			`CREATE INDEX IF NOT EXISTS idx_search_memory ON search_index(memory_id)`,
			`CREATE INDEX IF NOT EXISTS idx_search_frequency ON search_index(frequency DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_trigram_gram ON trigram_index(trigram)`,
			`CREATE INDEX IF NOT EXISTS idx_trigram_memory ON trigram_index(memory_id)`,
			`CREATE INDEX IF NOT EXISTS idx_trigram_word ON trigram_index(word)`,
			`CREATE INDEX IF NOT EXISTS idx_vectors_memory ON search_vectors(memory_id)`,
			`CREATE INDEX IF NOT EXISTS idx_vectors_norm ON search_vectors(tf_idf_norm DESC)`,
			`CREATE INDEX IF NOT EXISTS idx_cache_hash ON search_cache(query_hash)`,
			`CREATE INDEX IF NOT EXISTS idx_cache_type ON search_cache(search_type)`,
			`CREATE INDEX IF NOT EXISTS idx_cache_access ON search_cache(access_count DESC, last_accessed DESC)`,
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

	async addMemory(
		content: string,
		type = 'memory',
		metadata: Record<string, any> = {}
	): Promise<string> {
		const startTime = Date.now()

		try {
			await this.initialize()

			const id = generateShortId()
			const importance = this.calculateImportance(content, metadata)

			await this.execute(
				`
        INSERT INTO nodes (id, content, type, metadata, importance_score)
        VALUES (?, ?, ?, ?, ?)
      `,
				[id, content, type, JSON.stringify(metadata), importance]
			)

			// Build search indexes for the new memory
			await this.buildSearchIndexes(id, content, metadata)

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
	async storeMemory(
		content: string,
		type = 'memory',
		metadata: Record<string, any> = {}
	): Promise<string> {
		return this.addMemory(content, type, metadata)
	}

	async storeEntity(
		name: string,
		type: string,
		properties: Record<string, any> = {},
		confidence = 1.0
	): Promise<string> {
		const entity = { name, type, properties, confidence, source_node_ids: [] }
		return this.addEntity(entity)
	}

	async storeRelation(
		fromEntityId: string,
		toEntityId: string,
		relationType: string,
		strength = 1.0,
		properties: Record<string, any> = {}
	): Promise<string> {
		const relation = {
			from_entity_id: fromEntityId,
			to_entity_id: toEntityId,
			relation_type: relationType,
			strength,
			properties,
			source_node_ids: [],
		}
		return this.addRelation(relation)
	}

	async analyzeMemory(
		content: string,
		extractEntities = true,
		extractRelations = true
	): Promise<any> {
		// Simple analysis - in a real implementation this would use NLP
		const entities = extractEntities ? this.extractSimpleEntities(content) : []
		const relations = extractRelations ? this.extractSimpleRelations(content) : []

		return {
			content,
			entities,
			relations,
			analysis_time: Date.now(),
		}
	}

	async getSimilarMemories(
		content: string,
		limit = CONFIG.DEFAULT_SIMILARITY_LIMIT,
		threshold = CONFIG.SIMILARITY_THRESHOLD
	): Promise<MemoryNode[]> {
		// Use semantic search for better similarity matching
		const searchResult = await this.searchMemories(content, {
			searchType: 'semantic',
			limit: limit * 3,
		})

		return searchResult.nodes
			.map((memory) => ({
				...memory,
				similarity: this.calculateSimilarity(content, memory.content),
			}))
			.filter((memory) => memory.similarity >= threshold)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, limit)
			.map(({ similarity, ...memory }) => memory)
	}

	/**
	 * Advanced search with autocomplete suggestions
	 */
	async autoComplete(query: string, limit = 10): Promise<string[]> {
		try {
			await this.initialize()

			if (query.length < 2) return []

			// Use trie-based prefix matching
			const words = await this.execute(
				`
				SELECT DISTINCT word 
				FROM search_index 
				WHERE word LIKE ?
				ORDER BY frequency DESC, word ASC
				LIMIT ?
			`,
				[`${query.toLowerCase()}%`, limit]
			)

			return words.map((row) => row.word)
		} catch (error) {
			console.warn('⚠️ Autocomplete error:', error)
			return []
		}
	}

	/**
	 * Multi-field search across content, metadata, and tags
	 */
	async multiFieldSearch(
		query: string,
		fields: string[] = ['content', 'metadata', 'tags'],
		options: SearchOptions = {}
	): Promise<SearchResult> {
		const startTime = Date.now()

		try {
			await this.initialize()

			const limit = options.limit || 10
			const memoryScores = new Map<string, number>()

			// Search in different fields with different weights
			const fieldWeights = {
				content: 1.0,
				metadata: 0.7,
				tags: 0.8,
			}

			for (const field of fields) {
				const weight = fieldWeights[field as keyof typeof fieldWeights] || 0.5

				let results: any[] = []

				if (field === 'content') {
					const searchResult = await this.searchMemories(query, {
						searchType: 'hybrid',
						limit: limit * 2,
					})
					results = searchResult.nodes.map((node) => ({
						memory_id: node.id,
						score: node.importance_score || 0.5,
					}))
				} else if (field === 'metadata') {
					results = await this.execute(
						`
						SELECT n.id as memory_id, n.importance_score as score
						FROM nodes n
						WHERE n.metadata LIKE ?
						ORDER BY n.importance_score DESC
					`,
						[`%${query}%`]
					)
				} else if (field === 'tags') {
					const tagResults = await this.findByTags([query])
					results = tagResults.map((item) => ({
						memory_id: item.memory.id,
						score: item.memory.importanceScore || 0.5,
					}))
				}

				// Add weighted scores
				for (const result of results) {
					const memoryId = result.memory_id
					const score = (result.score || 0.5) * weight
					memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + score)
				}
			}

			const searchResult = await this.buildSearchResult(
				memoryScores,
				limit,
				'multi-field'
			)
			searchResult.query_time_ms = Date.now() - startTime

			console.log(
				`🔍 Multi-field search completed (${
					searchResult.query_time_ms
				}ms): "${query}" [${fields.join(',')}] -> ${searchResult.nodes.length} results`
			)
			return searchResult
		} catch (error) {
			console.error('❌ Multi-field search error:', error)
			return { nodes: [], total_count: 0, query_time_ms: Date.now() - startTime }
		}
	}

	/**
	 * Find memories by date range
	 */
	async searchByDateRange(
		startDate: string,
		endDate: string,
		options: SearchOptions = {}
	): Promise<SearchResult> {
		const startTime = Date.now()

		try {
			await this.initialize()

			const limit = options.limit || CONFIG.DEFAULT_SEARCH_LIMIT
			const result = await this.execute(
				`
				SELECT * FROM nodes 
				WHERE created_at BETWEEN ? AND ?
				ORDER BY created_at DESC, importance_score DESC
				LIMIT ?
			`,
				[startDate, endDate, limit]
			)

			const nodes: MemoryNode[] = result.map((row: any) => ({
				id: row.id,
				content: row.content,
				type: row.type,
				created_at: row.created_at,
				updated_at: row.updated_at,
				metadata: this.safeJsonParse(row.metadata || '{}', {}),
				importance_score:
					typeof row.importance_score === 'bigint'
						? Number(row.importance_score)
						: row.importance_score || 0.5,
				access_count:
					typeof row.access_count === 'bigint'
						? Number(row.access_count)
						: row.access_count || 0,
				last_accessed: row.last_accessed,
			}))

			return {
				nodes,
				total_count: nodes.length,
				query_time_ms: Date.now() - startTime,
			}
		} catch (error) {
			console.error('❌ Date range search error:', error)
			return { nodes: [], total_count: 0, query_time_ms: Date.now() - startTime }
		}
	}

	/**
	 * Get search suggestions based on recent queries and popular terms
	 */
	async getSearchSuggestions(query: string = '', limit = 10): Promise<string[]> {
		try {
			await this.initialize()

			// Get popular search terms from search cache
			const popularTerms = await this.execute(
				`
				SELECT query_text, access_count 
				FROM search_cache 
				WHERE query_text LIKE ? AND query_text != ?
				ORDER BY access_count DESC, created_at DESC
				LIMIT ?
			`,
				[`%${query}%`, query, limit]
			)

			// Get frequent words from index
			const frequentWords = await this.execute(
				`
				SELECT word 
				FROM search_index 
				WHERE word LIKE ? AND LENGTH(word) > 3
				GROUP BY word
				ORDER BY SUM(frequency) DESC
				LIMIT ?
			`,
				[`%${query}%`, limit]
			)

			// Combine and deduplicate
			const suggestions = new Set<string>()

			popularTerms.forEach((row) => suggestions.add(row.query_text))
			frequentWords.forEach((row) => suggestions.add(row.word))

			return Array.from(suggestions).slice(0, limit)
		} catch (error) {
			console.warn('⚠️ Search suggestions error:', error)
			return []
		}
	}

	async getMemoryStats(): Promise<any> {
		try {
			await this.initialize()

			// Use simpler queries without prepared statements
			const memoryResult = await this.connection!.run(
				'SELECT COUNT(*) as count FROM nodes'
			)
			const entityResult = await this.connection!.run(
				'SELECT COUNT(*) as count FROM entities'
			)
			const relationResult = await this.connection!.run(
				'SELECT COUNT(*) as count FROM relations'
			)

			const memoryRows = await memoryResult.getRows()
			const entityRows = await entityResult.getRows()
			const relationRows = await relationResult.getRows()

			const performance = this.getPerformanceMetrics()

			const stats = {
				memories: Number(this.safeGetRowValue(memoryRows, 0, 0, 0)),
				entities: Number(this.safeGetRowValue(entityRows, 0, 0, 0)),
				relations: Number(this.safeGetRowValue(relationRows, 0, 0, 0)),
				performance,
				cache_size: this.queryCache.size,
				uptime_seconds: Math.floor(Date.now() / 1000),
			}

			return stats
		} catch (error) {
			console.error('❌ Error getting memory stats:', error)
			// Return basic stats if database queries fail
			return {
				memories: 0,
				entities: 0,
				relations: 0,
				performance: this.getPerformanceMetrics(),
				cache_size: this.queryCache.size,
				uptime_seconds: Math.floor(Date.now() / 1000),
				error: String(error),
			}
		}
	}

	async getRecentMemories(limit = 10, timeframe = 'day'): Promise<MemoryNode[]> {
		const hours = timeframe === 'hour' ? 1 : timeframe === 'week' ? 168 : 24
		const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

		try {
			await this.initialize()

			const result = await this.connection!.run(
				`
				SELECT * FROM nodes 
				WHERE created_at >= ? OR last_accessed >= ?
				ORDER BY COALESCE(last_accessed, created_at) DESC
				LIMIT ?
			`,
				[cutoff, cutoff, limit]
			)

			const rows = await result.getRows()

			return (rows || []).map((row: any) => ({
				id: row[0],
				content: row[1],
				type: row[2],
				created_at: row[3],
				updated_at: row[4],
				metadata: this.safeJsonParse(row[5] || '{}', {}),
				importance_score: row[6] || 0.5,
				access_count: row[7] || 0,
				last_accessed: row[8],
			}))
		} catch (error) {
			console.error('❌ Error getting recent memories:', error)
			throw error
		}
	}

	// Simple entity extraction (in production, use a proper NLP library)
	private extractSimpleEntities(
		content: string
	): Array<{ name: string; type: string; confidence: number }> {
		const entities: Array<{ name: string; type: string; confidence: number }> = []

		// Very basic pattern matching for demonstration
		const patterns = {
			person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last name pattern
			location: /\b(?:in|at|from|to) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
			organization:
				/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*) (?:Inc|Corp|Ltd|Company|Organization)\b/g,
		}

		for (const [type, pattern] of Object.entries(patterns)) {
			const matches = content.match(pattern)
			if (matches) {
				for (const match of matches) {
					entities.push({
						name: match.trim(),
						type,
						confidence: 0.6, // Low confidence for simple pattern matching
					})
				}
			}
		}

		return entities
	}

	private extractSimpleRelations(
		content: string
	): Array<{ type: string; entities: string[]; confidence: number }> {
		// Very basic relation extraction
		const relations: Array<{ type: string; entities: string[]; confidence: number }> = []

		if (content.includes(' works at ') || content.includes(' employed by ')) {
			relations.push({
				type: 'employment',
				entities: [],
				confidence: 0.5,
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
				metadata: this.safeJsonParse(row[5] || '{}', {}),
				importance_score: row[6] || 0.5,
				access_count: row[7] || 0,
				last_accessed: row[8],
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

	// === ADVANCED SEARCH INDEXING SYSTEM (Building bridges to find lost memories 🔍💀) ===

	/**
	 * Build comprehensive search indexes for a memory
	 * Called automatically when memories are added or updated
	 */
	private async buildSearchIndexes(
		memoryId: string,
		content: string,
		metadata: Record<string, any> = {}
	): Promise<void> {
		try {
			// Tokenize content for indexing
			const words = this.searchEngines.vector.tokenize(content)
			const metadataText = Object.values(metadata).join(' ')
			const allWords = [...words, ...this.searchEngines.vector.tokenize(metadataText)]

			// Build word-level inverted index
			await this.buildWordIndex(memoryId, allWords, 'content')

			// Build trigram index for fuzzy search
			await this.buildTrigramIndex(memoryId, content)

			// Build TF-IDF vector
			await this.buildTfIdfVector(memoryId, allWords)
		} catch (error) {
			console.warn(`⚠️ Failed to build search indexes for memory ${memoryId}:`, error)
			// Don't throw - indexing failure shouldn't break memory storage
		}
	}

	/**
	 * Build word-level inverted index
	 */
	private async buildWordIndex(
		memoryId: string,
		words: string[],
		fieldType: string
	): Promise<void> {
		const wordFreqs = new Map<string, number>()

		// Count word frequencies
		words.forEach((word) => {
			if (word.length > 2) {
				// Skip very short words
				wordFreqs.set(word, (wordFreqs.get(word) || 0) + 1)
			}
		})

		// Insert into search_index table
		for (const [word, frequency] of wordFreqs) {
			// Delete existing first
			await this.execute(
				`DELETE FROM search_index WHERE word = ? AND memory_id = ? AND field_type = ?`,
				[word, memoryId, fieldType]
			)

			// Insert new record
			await this.execute(
				`
				INSERT INTO search_index (id, word, memory_id, position, frequency, field_type)
				VALUES (?, ?, ?, ?, ?, ?)
			`,
				[generateShortId(), word, memoryId, 0, frequency, fieldType]
			)
		}
	}

	/**
	 * Build trigram index for fuzzy matching
	 */
	private async buildTrigramIndex(memoryId: string, content: string): Promise<void> {
		const words = this.searchEngines.vector.tokenize(content)

		for (const word of words) {
			if (word.length > 2) {
				const trigrams = this.searchEngines.fuzzy.generateTrigrams(word)

				for (let i = 0; i < trigrams.length; i++) {
					await this.execute(
						`
						INSERT INTO trigram_index (id, trigram, memory_id, word, position)
						VALUES (?, ?, ?, ?, ?)
					`,
						[generateShortId(), trigrams[i], memoryId, word, i]
					)
				}
			}
		}
	}

	/**
	 * Build TF-IDF vector for similarity search
	 */
	private async buildTfIdfVector(memoryId: string, words: string[]): Promise<void> {
		// Get document frequency for each word
		const uniqueWords = [...new Set(words)]
		const documentFreqs = new Map<string, number>()

		for (const word of uniqueWords) {
			const result = await this.connection!.run(
				`
				SELECT COUNT(DISTINCT memory_id) as doc_count 
				FROM search_index 
				WHERE word = ?
			`,
				[word]
			)
			const rows = await result.getRows()
			documentFreqs.set(word, Number(rows[0]?.[0] || 1))
		}

		// Get total document count
		const totalResult = await this.connection!.run(
			`SELECT COUNT(DISTINCT memory_id) as total FROM search_index`
		)
		const totalRows = await totalResult.getRows()
		const totalDocs = Number(totalRows[0]?.[0] || 1)

		// Calculate TF-IDF vector
		const tfidfVector = this.searchEngines.vector.calculateTfIdf(
			words,
			documentFreqs,
			totalDocs
		)

		// Calculate norm for cosine similarity
		let norm = 0
		for (const value of tfidfVector.values()) {
			norm += value * value
		}
		norm = Math.sqrt(norm)

		// Store vector data (delete existing first to avoid conflict issues)
		await this.execute(`DELETE FROM search_vectors WHERE memory_id = ?`, [memoryId])

		await this.execute(
			`
			INSERT INTO search_vectors (id, memory_id, vector_data, word_count, unique_words, tf_idf_norm)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
			[
				generateShortId(),
				memoryId,
				JSON.stringify(Object.fromEntries(tfidfVector)),
				words.length,
				uniqueWords.length,
				norm,
			]
		)
	}

	/**
	 * Remove search indexes for a deleted memory
	 */
	private async removeSearchIndexes(memoryId: string): Promise<void> {
		try {
			await this.execute(`DELETE FROM search_index WHERE memory_id = ?`, [memoryId])
			await this.execute(`DELETE FROM trigram_index WHERE memory_id = ?`, [memoryId])
			await this.execute(`DELETE FROM search_vectors WHERE memory_id = ?`, [memoryId])
		} catch (error) {
			console.warn(`⚠️ Failed to remove search indexes for memory ${memoryId}:`, error)
		}
	}

	/**
	 * Rebuild all search indexes (maintenance operation)
	 */
	async rebuildSearchIndexes(): Promise<{ rebuilt: number; errors: number }> {
		await this.initialize()
		let rebuilt = 0
		let errors = 0

		try {
			// Clear existing indexes
			await this.execute(`DELETE FROM search_index`)
			await this.execute(`DELETE FROM trigram_index`)
			await this.execute(`DELETE FROM search_vectors`)

			// Get all memories
			const result = await this.connection!.run(`SELECT id, content, metadata FROM nodes`)
			const rows = await result.getRows()

			for (const row of rows) {
				try {
					const memoryId = String(row[0])
					const content = String(row[1])
					const metadataStr = row[2] ? String(row[2]) : '{}'
					const metadata = JSON.parse(metadataStr)
					await this.buildSearchIndexes(memoryId, content, metadata)
					rebuilt++
				} catch (error) {
					console.warn(
						`⚠️ Failed to rebuild indexes for memory ${String(row[0])}:`,
						error
					)
					errors++
				}
			}

			console.log(`🔄 Search indexes rebuilt: ${rebuilt} successful, ${errors} errors`)
			return { rebuilt, errors }
		} catch (error) {
			console.error('❌ Failed to rebuild search indexes:', error)
			throw error
		}
	}

	private convertBigIntValues(obj: any): any {
		if (typeof obj === 'bigint') {
			return Number(obj)
		}
		if (Array.isArray(obj)) {
			return obj.map((item) => this.convertBigIntValues(item))
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

	/**
	 * Safely extract a value from database result rows
	 */
	private safeGetRowValue(
		rows: any[] | null | undefined,
		rowIndex: number = 0,
		colIndex: number = 0,
		defaultValue: any = 0
	): any {
		if (!Array.isArray(rows) || rows.length === 0) {
			return defaultValue
		}
		const row = rows[rowIndex]
		if (!row || !Array.isArray(row) || row.length <= colIndex) {
			return defaultValue
		}
		const value = row[colIndex]
		return value !== null && value !== undefined ? value : defaultValue
	}

	/**
	 * Safely parse JSON with error handling
	 */
	private safeJsonParse(jsonString: string, defaultValue: any = {}): any {
		if (!jsonString || typeof jsonString !== 'string') {
			return defaultValue
		}
		try {
			return JSON.parse(jsonString)
		} catch (error) {
			console.warn('Failed to parse JSON:', jsonString.substring(0, 100) + '...')
			return defaultValue
		}
	}

	async searchMemories(
		query: string,
		options: SearchOptions = {}
	): Promise<SearchResult> {
		const startTime = Date.now()
		const searchType = options.searchType || 'hybrid'

		// Handle BigInt in cache key generation
		const cacheOptions = JSON.parse(
			JSON.stringify(options, (key, value) =>
				typeof value === 'bigint' ? Number(value) : value
			)
		)
		const cacheKey = `search_${searchType}_${query}_${JSON.stringify(cacheOptions)}`

		// Check cache first
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			this.recordPerformance(
				'search_memories',
				Date.now() - startTime,
				true,
				cached.nodes.length
			)
			return cached
		}

		try {
			await this.initialize()

			const limit = options.limit || 10
			const minImportance = options.minImportance || 0

			let searchResult: SearchResult

			// Choose search strategy based on options
			switch (searchType) {
				case 'exact':
					searchResult = await this.exactSearch(query, limit, minImportance)
					break
				case 'fuzzy':
					searchResult = await this.fuzzySearch(query, limit, minImportance)
					break
				case 'semantic':
					searchResult = await this.semanticSearch(query, limit, minImportance)
					break
				case 'hybrid':
				default:
					searchResult = await this.hybridSearch(query, limit, minImportance)
					break
			}

			// Add query performance metrics
			searchResult.query_time_ms = Date.now() - startTime

			// Cache the results
			this.setCache(cacheKey, searchResult)

			const latency = Date.now() - startTime
			this.recordPerformance('search_memories', latency, false, searchResult.nodes.length)

			console.log(
				`🔍 Advanced search completed (${latency}ms): "${query}" [${searchType}] -> ${searchResult.nodes.length} results`
			)
			return searchResult
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('search_memories', latency, false, 0)
			console.error('❌ Error in advanced search:', error)

			// Fallback to basic search if advanced search fails
			return this.fallbackBasicSearch(query, options)
		}
	}

	/**
	 * Exact search using word index for precise matching
	 */
	private async exactSearch(
		query: string,
		limit: number,
		minImportance: number
	): Promise<SearchResult> {
		const words = this.searchEngines.vector.tokenize(query)
		const memoryScores = new Map<string, number>()

		// Search in word index for exact matches
		for (const word of words) {
			const results = await this.execute(
				`
				SELECT si.memory_id, si.frequency, n.importance_score, n.access_count
				FROM search_index si
				JOIN nodes n ON si.memory_id = n.id
				WHERE si.word = ? AND n.importance_score >= ?
				ORDER BY si.frequency DESC, n.importance_score DESC
			`,
				[word, minImportance]
			)

			for (const row of results) {
				const memoryId = row.memory_id
				const score =
					(row.frequency || 1) *
					(row.importance_score || 0.5) *
					(1 + Math.log(row.access_count + 1))
				memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + score)
			}
		}

		return this.buildSearchResult(memoryScores, limit, 'exact')
	}

	/**
	 * Fuzzy search using trigrams for typo tolerance
	 */
	private async fuzzySearch(
		query: string,
		limit: number,
		minImportance: number
	): Promise<SearchResult> {
		const words = this.searchEngines.vector.tokenize(query)
		const memoryScores = new Map<string, number>()

		for (const word of words) {
			const trigrams = this.searchEngines.fuzzy.generateTrigrams(word)

			// Find memories with similar trigrams
			for (const trigram of trigrams) {
				const result = await this.connection!.run(
					`
					SELECT ti.memory_id, ti.word, COUNT(*) as trigram_matches, n.importance_score, n.access_count
					FROM trigram_index ti
					JOIN nodes n ON ti.memory_id = n.id
					WHERE ti.trigram = ? AND n.importance_score >= ?
					GROUP BY ti.memory_id, ti.word, n.importance_score, n.access_count
					ORDER BY trigram_matches DESC
				`,
					[trigram, minImportance]
				)

				const rows = await result.getRows()

				for (const row of rows) {
					const similarity = this.searchEngines.fuzzy.trigramSimilarity(
						word,
						String(row[1])
					)
					if (similarity > 0.3) {
						// Minimum similarity threshold
						const score = similarity * (Number(row[2]) || 1) * (Number(row[3]) || 0.5)
						const memoryId = String(row[0])
						memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + score)
					}
				}
			}
		}

		return this.buildSearchResult(memoryScores, limit, 'fuzzy')
	}

	/**
	 * Semantic search using TF-IDF vectors
	 */
	private async semanticSearch(
		query: string,
		limit: number,
		minImportance: number
	): Promise<SearchResult> {
		const queryWords = this.searchEngines.vector.tokenize(query)
		const memoryScores = new Map<string, number>()

		// Get all memory vectors
		const result = await this.connection!.run(
			`
			SELECT sv.memory_id, sv.vector_data, sv.tf_idf_norm, n.importance_score, n.access_count
			FROM search_vectors sv
			JOIN nodes n ON sv.memory_id = n.id
			WHERE n.importance_score >= ?
		`,
			[minImportance]
		)

		const rows = await result.getRows()

		// Calculate query TF-IDF vector
		const queryTermFreq = new Map<string, number>()
		queryWords.forEach((word) => {
			queryTermFreq.set(word, (queryTermFreq.get(word) || 0) + 1 / queryWords.length)
		})

		for (const row of rows) {
			try {
				const vectorData = this.safeJsonParse(String(row[1]), {})
				const memoryVector = new Map<string, number>()

				// Ensure all values are numbers
				for (const [key, value] of Object.entries(vectorData)) {
					memoryVector.set(key, typeof value === 'number' ? value : Number(value))
				}

				const similarity = this.searchEngines.vector.cosineSimilarity(
					queryTermFreq,
					memoryVector
				)

				if (similarity > 0.1) {
					// Minimum similarity threshold
					const score =
						similarity * (Number(row[3]) || 0.5) * (1 + Math.log(Number(row[4]) + 1))
					memoryScores.set(String(row[0]), score)
				}
			} catch (error) {
				console.warn(`⚠️ Failed to parse vector for memory ${String(row[0])}:`, error)
			}
		}

		return this.buildSearchResult(memoryScores, limit, 'semantic')
	}

	/**
	 * Hybrid search combining multiple strategies
	 */
	private async hybridSearch(
		query: string,
		limit: number,
		minImportance: number
	): Promise<SearchResult> {
		// Run multiple search strategies in parallel
		const [exactResults, fuzzyResults, semanticResults] = await Promise.all([
			this.exactSearch(query, limit * 2, minImportance).catch(() => ({
				nodes: [],
				total_count: 0,
				query_time_ms: 0,
			})),
			this.fuzzySearch(query, limit * 2, minImportance).catch(() => ({
				nodes: [],
				total_count: 0,
				query_time_ms: 0,
			})),
			this.semanticSearch(query, limit * 2, minImportance).catch(() => ({
				nodes: [],
				total_count: 0,
				query_time_ms: 0,
			})),
		])

		// Convert results to score format for combination
		const exactScores = exactResults.nodes.map((node) => ({
			memoryId: node.id,
			score: node.importance_score || 0.5,
		}))
		const fuzzyScores = fuzzyResults.nodes.map((node) => ({
			memoryId: node.id,
			score: node.importance_score || 0.5,
		}))
		const semanticScores = semanticResults.nodes.map((node) => ({
			memoryId: node.id,
			score: node.importance_score || 0.5,
		}))

		// Combine results using hybrid engine
		const combinedResults = this.searchEngines.hybrid.combineResults(
			exactScores,
			fuzzyScores,
			semanticScores
		)

		// Get top results
		const topResults = combinedResults.slice(0, limit)
		const memoryIds = topResults.map((r) => r.memoryId)

		if (memoryIds.length === 0) {
			return { nodes: [], total_count: 0, query_time_ms: 0 }
		}

		// Fetch full memory data
		const placeholders = memoryIds.map(() => '?').join(',')
		const memories = await this.execute(
			`
			SELECT * FROM nodes 
			WHERE id IN (${placeholders})
			ORDER BY importance_score DESC, access_count DESC
		`,
			memoryIds
		)

		const nodes: MemoryNode[] = memories.map((row: any) => ({
			id: row.id,
			content: row.content,
			type: row.type,
			created_at: row.created_at,
			updated_at: row.updated_at,
			metadata: JSON.parse(row.metadata || '{}'),
			importance_score:
				typeof row.importance_score === 'bigint'
					? Number(row.importance_score)
					: row.importance_score || 0.5,
			access_count:
				typeof row.access_count === 'bigint'
					? Number(row.access_count)
					: row.access_count || 0,
			last_accessed: row.last_accessed,
		}))

		return {
			nodes,
			total_count: combinedResults.length,
			query_time_ms: 0, // Will be set by caller
		}
	}

	/**
	 * Helper method to build search results from memory scores
	 */
	private async buildSearchResult(
		memoryScores: Map<string, number>,
		limit: number,
		searchType: string
	): Promise<SearchResult> {
		const sortedResults = Array.from(memoryScores.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)

		if (sortedResults.length === 0) {
			return { nodes: [], total_count: 0, query_time_ms: 0 }
		}

		const memoryIds = sortedResults
			.map(([id]) => String(id))
			.filter((id) => id && id.length > 0)

		if (memoryIds.length === 0) {
			return { nodes: [], total_count: 0, query_time_ms: 0 }
		}

		// For single ID, use a simpler query
		if (memoryIds.length === 1) {
			const result = await this.connection!.run(
				`
				SELECT * FROM nodes 
				WHERE id = ?
			`,
				[memoryIds[0]]
			)

			const rows = await result.getRows()

			const nodes: MemoryNode[] = rows.map((row: any) => {
				let metadata = {}
				try {
					metadata = JSON.parse(String(row[5]) || '{}')
				} catch (e) {
					console.warn('Failed to parse metadata for node:', row[0])
					metadata = {}
				}

				return {
					id: String(row[0]),
					content: String(row[1]),
					type: String(row[2]),
					created_at: String(row[3]),
					updated_at: String(row[4]),
					metadata,
					importance_score:
						typeof row[6] === 'bigint' ? Number(row[6]) : Number(row[6]) || 0.5,
					access_count: typeof row[7] === 'bigint' ? Number(row[7]) : Number(row[7]) || 0,
					last_accessed: row[8] ? String(row[8]) : undefined,
				}
			})

			return {
				nodes,
				total_count: memoryScores.size,
				query_time_ms: 0,
			}
		}

		// For multiple IDs, use IN clause
		const placeholders = memoryIds.map(() => '?').join(',')

		const result = await this.connection!.run(
			`
			SELECT * FROM nodes 
			WHERE id IN (${placeholders})
			ORDER BY importance_score DESC, access_count DESC
		`,
			memoryIds
		)

		const rows = await result.getRows()

		const nodes: MemoryNode[] = rows.map((row: any) => {
			let metadata = {}
			try {
				metadata = JSON.parse(String(row[5]) || '{}')
			} catch (e) {
				console.warn('Failed to parse metadata for node:', row[0])
				metadata = {}
			}

			return {
				id: String(row[0]),
				content: String(row[1]),
				type: String(row[2]),
				created_at: String(row[3]),
				updated_at: String(row[4]),
				metadata,
				importance_score:
					typeof row[6] === 'bigint' ? Number(row[6]) : Number(row[6]) || 0.5,
				access_count: typeof row[7] === 'bigint' ? Number(row[7]) : Number(row[7]) || 0,
				last_accessed: row[8] ? String(row[8]) : undefined,
			}
		})

		return {
			nodes,
			total_count: memoryScores.size,
			query_time_ms: 0, // Will be set by caller
		}
	}

	/**
	 * Fallback to basic search if advanced search fails
	 */
	private async fallbackBasicSearch(
		query: string,
		options: SearchOptions
	): Promise<SearchResult> {
		const limit = options.limit || 10
		const searchPattern = `%${query}%`

		const result = await this.connection!.run(
			`
			SELECT * FROM nodes 
			WHERE content LIKE ? 
			ORDER BY importance_score DESC, access_count DESC, created_at DESC
			LIMIT ?
		`,
			[searchPattern, limit]
		)

		const rows = await result.getRows()

		const nodes: MemoryNode[] = (rows || []).map((row: any) => {
			let metadata = {}
			try {
				metadata = JSON.parse(String(row[5]) || '{}')
			} catch (e) {
				console.warn('Failed to parse metadata for node:', row[0])
				metadata = {}
			}

			return {
				id: String(row[0]),
				content: String(row[1]),
				type: String(row[2]),
				created_at: String(row[3]),
				updated_at: String(row[4]),
				metadata,
				importance_score:
					typeof row[6] === 'bigint' ? Number(row[6]) : Number(row[6]) || 0.5,
				access_count: typeof row[7] === 'bigint' ? Number(row[7]) : Number(row[7]) || 0,
				last_accessed: row[8] ? String(row[8]) : undefined,
			}
		})

		return {
			nodes,
			total_count: nodes.length,
			query_time_ms: 0,
		}
	}

	async addEntity(
		entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>
	): Promise<string> {
		const startTime = Date.now()

		try {
			await this.initialize()

			const id = generateShortId()

			await this.execute(
				`
        INSERT INTO entities (id, name, type, properties, confidence, source_node_ids)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
				[
					id,
					entity.name,
					entity.type,
					JSON.stringify(entity.properties || {}),
					entity.confidence || 1.0,
					JSON.stringify(entity.source_node_ids || []),
				]
			)

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

	async addRelation(
		relation: Omit<Relation, 'id' | 'created_at' | 'updated_at'>
	): Promise<string> {
		const startTime = Date.now()

		try {
			await this.initialize()

			const id = generateShortId()

			await this.execute(
				`
        INSERT INTO relations (id, from_entity_id, to_entity_id, relation_type, strength, properties, source_node_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
				[
					id,
					relation.from_entity_id,
					relation.to_entity_id,
					relation.relation_type,
					relation.strength || 1.0,
					JSON.stringify(relation.properties || {}),
					JSON.stringify(relation.source_node_ids || []),
				]
			)

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

			const result = await this.connection!.run(
				`
        SELECT r.*, 
               e1.name as from_name, e1.type as from_type,
               e2.name as to_name, e2.type as to_type
        FROM relations r
        JOIN entities e1 ON r.from_entity_id = e1.id
        JOIN entities e2 ON r.to_entity_id = e2.id
        WHERE JSON_EXTRACT_STRING(r.source_node_ids, '$[0]') = ?
        ORDER BY r.strength DESC
      `,
				[nodeId]
			)

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
				source_node_ids: JSON.parse(row[8] || '[]'),
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

	async updateMemory(
		id: string,
		updates: Partial<Pick<MemoryNode, 'content' | 'type' | 'metadata'>>
	): Promise<boolean> {
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
			this.recordPerformance(
				'get_memories_by_type',
				Date.now() - startTime,
				true,
				cached.length
			)
			return cached
		}

		try {
			await this.initialize()

			const result = await this.connection!.run(
				`
				SELECT * FROM nodes 
				WHERE type = ? 
				ORDER BY importance_score DESC, created_at DESC
				LIMIT ?
			`,
				[type, limit]
			)

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
				last_accessed: row[8],
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

	async getEntities(
		options: { limit?: number; type?: string; search?: string } = {}
	): Promise<Entity[]> {
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
				confidence: typeof row[4] === 'bigint' ? Number(row[4]) : row[4] || 1.0,
				created_at: row[5],
				updated_at: row[6],
				source_node_ids: JSON.parse(row[7] || '[]'),
			}))

			this.setCache(cacheKey, entities)

			const latency = Date.now() - startTime
			this.recordPerformance('get_entities', latency, false, entities.length)

			return this.convertBigIntValues(entities)
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_entities', latency, false, 0)
			console.error('❌ Error getting entities:', error)
			throw error
		}
	}

	async getRelations(
		options: { limit?: number; type?: string; entityId?: string } = {}
	): Promise<Relation[]> {
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
				source_node_ids: JSON.parse(row[8] || '[]'),
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
			await this.execute(
				`DELETE FROM relations WHERE from_entity_id = ? OR to_entity_id = ?`,
				[id, id]
			)

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
				this.execute('SELECT * FROM relations'),
			])

			const data = {
				memories: memories.map((row: any) => ({
					id: row[0],
					content: row[1],
					type: row[2],
					created_at: row[3],
					updated_at: row[4],
					metadata: this.safeJsonParse(row[5] || '{}', {}),
					importance_score: row[6],
					access_count: row[7],
					last_accessed: row[8],
				})),
				entities: entities.map((row: any) => ({
					id: row[0],
					name: row[1],
					type: row[2],
					properties: JSON.parse(row[3] || '{}'),
					confidence: row[4],
					created_at: row[5],
					updated_at: row[6],
					source_node_ids: JSON.parse(row[7] || '[]'),
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
					source_node_ids: JSON.parse(row[8] || '[]'),
				})),
				exported_at: new Date().toISOString(),
				total_records: memories.length + entities.length + relations.length,
			}

			const result =
				format === 'json' ? JSON.stringify(data, null, 2) : this.convertToCSV(data)

			const latency = Date.now() - startTime
			this.recordPerformance('export_data', latency, false, data.total_records)

			console.log(
				`📊 Data exported (${format}): ${data.total_records} records in ${latency}ms`
			)
			return result
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('export_data', latency, false, 0)
			console.error('❌ Error exporting data:', error)
			throw error
		}
	}

	async importData(
		data: string,
		format: 'json' = 'json'
	): Promise<{ imported: number; errors: string[] }> {
		const startTime = Date.now()

		try {
			await this.initialize()

			const parsedData = this.safeJsonParse(data, {})
			let imported = 0
			const errors: string[] = []

			// Import memories
			if (parsedData.memories) {
				for (const memory of parsedData.memories) {
					try {
						await this.execute(
							`
							INSERT OR REPLACE INTO nodes (id, content, type, metadata, importance_score, access_count)
							VALUES (?, ?, ?, ?, ?, ?)
						`,
							[
								memory.id || generateShortId(),
								memory.content,
								memory.type || 'memory',
								JSON.stringify(memory.metadata || {}),
								memory.importance_score || 0.5,
								memory.access_count || 0,
							]
						)
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
						await this.execute(
							`
							INSERT OR REPLACE INTO entities (id, name, type, properties, confidence, source_node_ids)
							VALUES (?, ?, ?, ?, ?, ?)
						`,
							[
								entity.id || generateShortId(),
								entity.name,
								entity.type,
								JSON.stringify(entity.properties || {}),
								entity.confidence || 1.0,
								JSON.stringify(entity.source_node_ids || []),
							]
						)
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
						await this.execute(
							`
							INSERT OR REPLACE INTO relations (id, from_entity_id, to_entity_id, relation_type, strength, properties, source_node_ids)
							VALUES (?, ?, ?, ?, ?, ?, ?)
						`,
							[
								relation.id || generateShortId(),
								relation.from_entity_id,
								relation.to_entity_id,
								relation.relation_type,
								relation.strength || 1.0,
								JSON.stringify(relation.properties || {}),
								JSON.stringify(relation.source_node_ids || []),
							]
						)
						imported++
					} catch (error) {
						errors.push(`Relation import error: ${error}`)
					}
				}
			}

			this.invalidateCache(['search', 'entities', 'relations'])

			const latency = Date.now() - startTime
			this.recordPerformance('import_data', latency, false, imported)

			console.log(
				`📥 Data imported: ${imported} records in ${latency}ms, ${errors.length} errors`
			)
			return { imported, errors }
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('import_data', latency, false, 0)
			console.error('❌ Error importing data:', error)
			throw error
		}
	}

	async getMemoryGraph(
		centerNodeId?: string,
		depth = 2
	): Promise<{ nodes: any[]; edges: any[] }> {
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
				this.execute('SELECT * FROM relations'),
			])

			const nodes = nodeRows.map((row: any) => ({
				id: row[0],
				label: row[1].substring(0, 50) + (row[1].length > 50 ? '...' : ''),
				type: row[2],
				importance: row[6] || 0.5,
				group: row[2],
			}))

			const edges = relationRows.map((row: any) => ({
				id: row[0],
				from: row[1],
				to: row[2],
				label: row[3],
				strength: row[4] || 1.0,
				width: Math.max(1, (row[4] || 1.0) * 3),
			}))

			const latency = Date.now() - startTime
			this.recordPerformance(
				'get_memory_graph',
				latency,
				false,
				nodes.length + edges.length
			)

			console.log(
				`🕸️ Memory graph generated: ${nodes.length} nodes, ${edges.length} edges (${latency}ms)`
			)
			return { nodes, edges }
		} catch (error) {
			const latency = Date.now() - startTime
			this.recordPerformance('get_memory_graph', latency, false, 0)
			console.error('❌ Error generating memory graph:', error)
			throw error
		}
	}

	async consolidateMemories(
		similarityThreshold = 0.8
	): Promise<{ consolidated: number; duplicatesRemoved: number }> {
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
							consolidated_at: new Date().toISOString(),
						}

						await this.execute(
							`
							UPDATE nodes 
							SET metadata = ?, importance_score = ?, access_count = access_count + ?
							WHERE id = ?
						`,
							[
								JSON.stringify(mergedMetadata),
								Math.max(keepMemory[6], removeMemory[6]) + 0.1,
								removeMemory[7] || 0,
								keepMemory[0],
							]
						)

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

			console.log(
				`🔄 Memory consolidation complete: ${consolidated} consolidated, ${duplicatesRemoved} duplicates removed (${latency}ms)`
			)
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

		const intersection = new Set([...words1].filter((x) => words2.has(x)))
		const union = new Set([...words1, ...words2])

		return intersection.size / union.size
	}

	private convertToCSV(data: any): string {
		// Simple CSV conversion for memories
		const headers = ['id', 'content', 'type', 'created_at', 'importance_score']
		const rows = [
			headers.join(','),
			...data.memories.map((m: any) =>
				[
					m.id,
					`"${m.content.replace(/"/g, '""')}"`,
					m.type,
					m.created_at,
					m.importance_score,
				].join(',')
			),
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
		const wordCount = importantWords.filter((word) =>
			content.toLowerCase().includes(word)
		).length
		score += wordCount * 0.05

		return Math.min(1.0, Math.max(0.0, score))
	}

	private async updateNodeAccess(nodeId: string): Promise<void> {
		try {
			await this.execute(
				`
        UPDATE nodes 
        SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
				[nodeId]
			)
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
			expiry: Date.now() + this.cacheExpiry,
		})
	}

	private invalidateCache(patterns: string[]): void {
		for (const [key] of this.queryCache) {
			if (patterns.some((pattern) => key.includes(pattern))) {
				this.queryCache.delete(key)
			}
		}
	}

	private recordPerformance(
		operation: string,
		latency: number,
		cacheHit: boolean,
		resultCount: number
	): void {
		// Update metrics
		this.metrics.operationCounts[operation] =
			(this.metrics.operationCounts[operation] || 0) + 1

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
			this.execute(
				`
        INSERT INTO performance_stats (id, operation, latency_ms, cache_hit, result_count)
        VALUES (?, ?, ?, ?, ?)
      `,
				[id, operation, latency, cacheHit, resultCount]
			)
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
			hitRates: { ...this.metrics.cacheHitRates },
		}
	}

	clearCache(): void {
		this.queryCache.clear()
		this.cacheAccessTimes.clear()
		console.log('🧹 Cache cleared')
	}

	/**
	 * Periodic cleanup of expired cache entries
	 */
	private cleanupExpiredCache(): void {
		const now = Date.now()
		const expiredKeys: string[] = []

		for (const [key, entry] of this.queryCache) {
			if (now > entry.expiry) {
				expiredKeys.push(key)
			}
		}

		for (const key of expiredKeys) {
			this.queryCache.delete(key)
			this.cacheAccessTimes.delete(key)
		}

		if (expiredKeys.length > 0) {
			console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`)
		}
	}

	async close(): Promise<void> {
		if (this.connection) {
			this.connection.closeSync()
		}
		console.log('🔒 Database connection closed')
	}

	// === ADVANCED FEATURES SECTION (The Cool Stuff That Makes Life Worth Living) 🌟💀 ===

	// === TAG MANAGEMENT SYSTEM (Organizing Digital Chaos) 🏷️🖤 ===

	async addTags(
		memoryId: string,
		tagNames: string[]
	): Promise<{ added: string[]; existing: string[] }> {
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
				await this.execute(
					`
					INSERT INTO tags (id, name, usage_count)
					VALUES (?, ?, 1)
				`,
					[tagId, tagName]
				)
				added.push(tagName)
			} else {
				tagId = tagResults[0].id
				// Check if already tagged
				const existingLink = await this.execute(
					`
					SELECT 1 FROM memory_tags WHERE memory_id = ? AND tag_id = ?
				`,
					[memoryId, tagId]
				)

				if (existingLink.length > 0) {
					existing.push(tagName)
					continue
				}

				// Increment usage count
				await this.execute('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [
					tagId,
				])
				added.push(tagName)
			}

			// Link memory to tag
			await this.execute(
				`
				INSERT OR IGNORE INTO memory_tags (memory_id, tag_id)
				VALUES (?, ?)
			`,
				[memoryId, tagId]
			)
		}

		console.log(
			`🏷️ Tagged memory ${memoryId} with ${added.length} new tags (${existing.length} already existed)`
		)
		return { added, existing }
	}

	async removeTags(
		memoryId: string,
		tagNames: string[]
	): Promise<{ removed: string[]; notFound: string[] }> {
		await this.initialize()

		const removed: string[] = []
		const notFound: string[] = []

		for (const tagName of tagNames) {
			const tagResults = await this.execute('SELECT id FROM tags WHERE name = ?', [
				tagName,
			])

			if (tagResults.length === 0) {
				notFound.push(tagName)
				continue
			}

			const tagId = tagResults[0].id

			// Remove link
			const result = await this.execute(
				`
				DELETE FROM memory_tags WHERE memory_id = ? AND tag_id = ?
			`,
				[memoryId, tagId]
			)

			if (result.length > 0) {
				// Decrement usage count
				await this.execute('UPDATE tags SET usage_count = usage_count - 1 WHERE id = ?', [
					tagId,
				])
				removed.push(tagName)
			} else {
				notFound.push(tagName)
			}
		}

		console.log(`🗑️ Removed ${removed.length} tags from memory ${memoryId}`)
		return { removed, notFound }
	}

	async listTags(
		memoryId?: string
	): Promise<Array<{ id: string; name: string; color: string; usageCount: number }>> {
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
		return results.map((row) => ({
			id: row.id,
			name: row.name,
			color: row.color,
			usageCount: row.usage_count,
		}))
	}

	async findByTags(
		tagNames: string[],
		limit: number = 50
	): Promise<Array<{ memory: any; matchingTags: string[] }>> {
		await this.initialize()

		if (tagNames.length === 0) return []

		// Find memories that have any of the specified tags
		const placeholders = tagNames.map(() => '?').join(',')
		const results = await this.execute(
			`
			SELECT n.id, n.content, n.type, n.metadata, n.created_at, n.updated_at, n.importance_score, n.access_count, 
			       GROUP_CONCAT(t.name) as matching_tags
			FROM nodes n
			JOIN memory_tags mt ON n.id = mt.memory_id
			JOIN tags t ON mt.tag_id = t.id
			WHERE t.name IN (${placeholders})
			GROUP BY n.id, n.content, n.type, n.metadata, n.created_at, n.updated_at, n.importance_score, n.access_count
			ORDER BY COUNT(t.id) DESC, n.created_at DESC
			LIMIT ?
		`,
			[...tagNames, limit]
		)

		return results.map((row) => ({
			memory: {
				id: row.id,
				content: row.content,
				type: row.type,
				metadata: row.metadata ? JSON.parse(row.metadata) : {},
				createdAt: row.created_at,
				importanceScore: row.importance_score,
			},
			matchingTags: row.matching_tags ? row.matching_tags.split(',') : [],
		}))
	}

	// === DELETION OPERATIONS (Saying Goodbye Digital Style) 💀🗑️ ===

	async deleteByType(
		type: string,
		confirm: boolean = false
	): Promise<{ deleted: number; entities: number; relations: number }> {
		if (!confirm) {
			throw new Error('Deletion requires explicit confirmation (set confirm: true)')
		}

		await this.initialize()

		// Get memories of this type
		const memories = await this.execute('SELECT id FROM nodes WHERE type = ?', [type])
		const memoryIds = memories.map((m) => m.id)

		let deletedEntities = 0
		let deletedRelations = 0

		if (memoryIds.length > 0) {
			// Delete associated entities
			const entityResult = await this.execute(
				`
				DELETE FROM entities WHERE JSON_EXTRACT(source_node_ids, '$') LIKE '%' || ? || '%'
			`,
				[memoryIds[0]]
			) // Simplified for demo
			deletedEntities = entityResult.length || 0

			// Delete associated relations
			const relationResult = await this.execute(
				`
				DELETE FROM relations WHERE JSON_EXTRACT(source_node_ids, '$') LIKE '%' || ? || '%'
			`,
				[memoryIds[0]]
			)
			deletedRelations = relationResult.length || 0

			// Delete memories
			await this.execute('DELETE FROM nodes WHERE type = ?', [type])
		}

		console.log(
			`🗑️💀 Deleted ${memories.length} memories of type '${type}' and associated data`
		)
		return {
			deleted: memories.length,
			entities: deletedEntities,
			relations: deletedRelations,
		}
	}

	async deleteByTags(
		tagNames: string[],
		confirm: boolean = false
	): Promise<{ deleted: number }> {
		if (!confirm) {
			throw new Error('Deletion requires explicit confirmation (set confirm: true)')
		}

		await this.initialize()

		const memoriesWithTags = await this.findByTags(tagNames)
		const memoryIds = memoriesWithTags.map((m) => m.memory.id)

		if (memoryIds.length > 0) {
			const placeholders = memoryIds.map(() => '?').join(',')
			await this.execute(`DELETE FROM nodes WHERE id IN (${placeholders})`, memoryIds)
		}

		console.log(
			`🗑️🏷️ Deleted ${memoryIds.length} memories with tags: ${tagNames.join(', ')}`
		)
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
		return results.map((row) => ({
			id: row.id,
			name: row.name,
			type: row.type,
			properties: row.properties ? JSON.parse(row.properties) : {},
			confidence: row.confidence,
			createdAt: row.created_at,
			sourceNodeIds: row.source_node_ids ? JSON.parse(row.source_node_ids) : [],
		}))
	}

	async mergeEntities(
		sourceEntityId: string,
		targetEntityId: string
	): Promise<{ merged: boolean; relations: number }> {
		await this.initialize()

		// Get source entity
		const sourceResults = await this.execute('SELECT * FROM entities WHERE id = ?', [
			sourceEntityId,
		])
		if (sourceResults.length === 0) {
			throw new Error(`Source entity ${sourceEntityId} not found`)
		}

		// Update all relations pointing to source entity
		await this.execute(
			`
			UPDATE relations SET from_entity_id = ? WHERE from_entity_id = ?
		`,
			[targetEntityId, sourceEntityId]
		)

		await this.execute(
			`
			UPDATE relations SET to_entity_id = ? WHERE to_entity_id = ?
		`,
			[targetEntityId, sourceEntityId]
		)

		const relationCount = await this.execute(
			`
			SELECT COUNT(*) as count FROM relations 
			WHERE from_entity_id = ? OR to_entity_id = ?
		`,
			[targetEntityId, targetEntityId]
		)

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
		return results.map((row) => ({
			id: row.id,
			fromEntityId: row.from_entity_id,
			toEntityId: row.to_entity_id,
			fromEntityName: row.from_entity_name,
			toEntityName: row.to_entity_name,
			relationType: row.relation_type,
			strength: row.strength,
			properties: row.properties ? JSON.parse(row.properties) : {},
			createdAt: row.created_at,
		}))
	}

	// === OBSERVATION SYSTEM (Capturing Digital Insights) 📝🔍 ===

	async storeObservation(
		content: string,
		type: string = 'observation',
		sourceMemoryIds: string[] = [],
		confidence: number = 1.0,
		metadata: Record<string, any> = {}
	): Promise<string> {
		await this.initialize()

		const id = generateShortId()

		await this.execute(
			`
			INSERT INTO observations (id, content, type, confidence, source_memory_ids, metadata)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
			[
				id,
				content,
				type,
				confidence,
				JSON.stringify(sourceMemoryIds),
				JSON.stringify(metadata),
			]
		)

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
		return results.map((row) => ({
			id: row.id,
			content: row.content,
			type: row.type,
			confidence: row.confidence,
			sourceMemoryIds: row.source_memory_ids ? JSON.parse(row.source_memory_ids) : [],
			metadata: row.metadata ? JSON.parse(row.metadata) : {},
			createdAt: row.created_at,
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

	async cleanup(
		options: {
			removeOrphanedEntities?: boolean
			removeOrphanedRelations?: boolean
			removeUnusedTags?: boolean
			compactDatabase?: boolean
			confirm?: boolean
		} = {}
	): Promise<{
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

		console.log(
			`🧹 Cleanup completed: ${orphanedEntities} entities, ${orphanedRelations} relations, ${unusedTags} tags removed`
		)
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
			WHERE timestamp > now() - INTERVAL '24 hours'
			GROUP BY operation
			ORDER BY call_count DESC
		`)

		// Growth trends
		const trends = await this.execute(`
			SELECT 
				date(created_at) as day,
				COUNT(*) as memories_created
			FROM nodes
			WHERE created_at > now() - INTERVAL '30 days'
			GROUP BY date(created_at)
			ORDER BY day DESC
		`)

		return {
			memoryStats,
			entityStats,
			relationStats,
			tagStats: tagStats[0] || {},
			performanceStats,
			trends,
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
			WHERE timestamp > now() - INTERVAL '7 days'
			GROUP BY strftime('%H', timestamp)
			ORDER BY hour
		`)

		return {
			operationBreakdown,
			cacheEfficiency,
			slowestOperations,
			hourlyUsage,
		}
	}

	/**
	 * Restore data from backup
	 */
	async restoreFromBackup(
		backupData: string,
		options: { clearExisting?: boolean } = {}
	): Promise<{
		success: boolean
		restored: { memories: number; entities: number; relations: number }
		errors: string[]
		warnings: string[]
	}> {
		const result = {
			success: false,
			restored: { memories: 0, entities: 0, relations: 0 },
			errors: [] as string[],
			warnings: [] as string[],
		}

		try {
			await this.initialize()

			// Parse backup data
			const backup = this.safeJsonParse(backupData, null)
			if (!backup || !backup.data) {
				result.errors.push('Invalid backup format')
				return result
			}

			// Validate backup structure
			if (!backup.data.memories || !Array.isArray(backup.data.memories)) {
				result.errors.push('Backup missing memories data')
				return result
			}

			// Optional: Clear existing data
			if (options.clearExisting) {
				result.warnings.push('Clearing existing data before restore')
				await this.execute('DELETE FROM nodes')
				await this.execute('DELETE FROM entities')
				await this.execute('DELETE FROM relations')
				await this.execute('DELETE FROM tags')
				await this.execute('DELETE FROM memory_tags')
				await this.execute('DELETE FROM observations')
			}

			// Import memories
			for (const memory of backup.data.memories) {
				try {
					await this.execute(
						`
						INSERT OR REPLACE INTO nodes
						(id, content, type, created_at, updated_at, metadata, importance_score, access_count, last_accessed)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
					`,
						[
							memory.id,
							memory.content,
							memory.type || 'memory',
							memory.created_at || new Date().toISOString(),
							memory.updated_at || new Date().toISOString(),
							JSON.stringify(memory.metadata || {}),
							memory.importance_score || 0.5,
							memory.access_count || 0,
							memory.last_accessed || null,
						]
					)
					result.restored.memories++
				} catch (error) {
					result.errors.push(`Failed to restore memory ${memory.id}: ${error}`)
				}
			}

			// Import entities
			if (backup.data.entities && Array.isArray(backup.data.entities)) {
				for (const entity of backup.data.entities) {
					try {
						await this.execute(
							`
							INSERT OR REPLACE INTO entities
							(id, name, type, properties, confidence, created_at, updated_at, source_node_ids)
							VALUES (?, ?, ?, ?, ?, ?, ?, ?)
						`,
							[
								entity.id,
								entity.name,
								entity.type,
								JSON.stringify(entity.properties || {}),
								entity.confidence || 1.0,
								entity.created_at || new Date().toISOString(),
								entity.updated_at || new Date().toISOString(),
								JSON.stringify(entity.source_node_ids || []),
							]
						)
						result.restored.entities++
					} catch (error) {
						result.errors.push(`Failed to restore entity ${entity.id}: ${error}`)
					}
				}
			}

			// Import relations
			if (backup.data.relations && Array.isArray(backup.data.relations)) {
				for (const relation of backup.data.relations) {
					try {
						await this.execute(
							`
							INSERT OR REPLACE INTO relations
							(id, from_entity_id, to_entity_id, relation_type, strength, properties, created_at, updated_at, source_node_ids)
							VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
						`,
							[
								relation.id,
								relation.from_entity_id,
								relation.to_entity_id,
								relation.relation_type,
								relation.strength || 1.0,
								JSON.stringify(relation.properties || {}),
								relation.created_at || new Date().toISOString(),
								relation.updated_at || new Date().toISOString(),
								JSON.stringify(relation.source_node_ids || []),
							]
						)
						result.restored.relations++
					} catch (error) {
						result.errors.push(`Failed to restore relation ${relation.id}: ${error}`)
					}
				}
			}

			// Rebuild search indexes
			try {
				await this.rebuildSearchIndexes()
				result.warnings.push('Search indexes rebuilt after restore')
			} catch (error) {
				result.warnings.push(`Failed to rebuild search indexes: ${error}`)
			}

			result.success = result.errors.length === 0
			console.log(
				`✅ Backup restore completed: ${result.restored.memories} memories, ${result.restored.entities} entities, ${result.restored.relations} relations`
			)
		} catch (error) {
			result.errors.push(`Restore failed: ${error}`)
			console.error('❌ Backup restore failed:', error)
		}

		return result
	}

	/**
	 * List available backups
	 */
	async listBackups(): Promise<{
		backups: Array<{
			id: string
			description?: string
			created: string
			size: number
			memories: number
			entities: number
			relations: number
		}>
		totalSize: number
	}> {
		// For now, return empty list since we don't have a backup directory structure
		// This would be implemented with actual file system operations
		return {
			backups: [],
			totalSize: 0,
		}
	}

	/**
	 * Optimize search indexes
	 */
	async optimizeSearchIndexes(): Promise<{
		optimized: boolean
		indexesRebuilt: number
		spaceSaved: number
		performance: { before: number; after: number }
	}> {
		const result = {
			optimized: false,
			indexesRebuilt: 0,
			spaceSaved: 0,
			performance: { before: 0, after: 0 },
		}

		try {
			await this.initialize()

			// Get performance baseline
			const startTime = Date.now()
			await this.execute('SELECT COUNT(*) FROM search_index')
			result.performance.before = Date.now() - startTime

			// Analyze and optimize search indexes
			console.log('🔧 Optimizing search indexes...')

			// Rebuild trigram index for better performance
			await this.execute('DROP INDEX IF EXISTS idx_trigram_gram')
			await this.execute('CREATE INDEX idx_trigram_gram ON trigram_index(trigram)')
			result.indexesRebuilt++

			// Rebuild word index
			await this.execute('DROP INDEX IF EXISTS idx_search_word')
			await this.execute('CREATE INDEX idx_search_word ON search_index(word)')
			result.indexesRebuilt++

			// Optimize vector index
			await this.execute('DROP INDEX IF EXISTS idx_vectors_memory')
			await this.execute('CREATE INDEX idx_vectors_memory ON search_vectors(memory_id)')
			result.indexesRebuilt++

			// Vacuum database to reclaim space
			try {
				await this.execute('VACUUM')
				result.spaceSaved = 1 // Placeholder - would calculate actual space saved
			} catch (error) {
				console.warn('VACUUM not supported, skipping space optimization')
			}

			// Get performance after optimization
			const endTime = Date.now()
			await this.execute('SELECT COUNT(*) FROM search_index')
			result.performance.after = Date.now() - endTime

			result.optimized = true
			console.log(`✅ Search indexes optimized: ${result.indexesRebuilt} indexes rebuilt`)
		} catch (error) {
			console.error('❌ Search index optimization failed:', error)
		}

		return result
	}

	/**
	 * Optimize cache performance
	 */
	async optimizeCache(): Promise<{
		optimized: boolean
		entriesEvicted: number
		memoryFreed: number
		hitRate: number
		sizeOptimized: boolean
	}> {
		const result = {
			optimized: false,
			entriesEvicted: 0,
			memoryFreed: 0,
			hitRate: 0,
			sizeOptimized: false,
		}

		try {
			await this.initialize()

			const initialSize = this.queryCache.size
			const stats = this.getCacheStats()

			// Calculate hit rate
			const totalRequests = Object.values(stats.hitRates).reduce(
				(sum, rate) => sum + rate.hits + rate.total - rate.hits,
				0
			)
			const totalHits = Object.values(stats.hitRates).reduce(
				(sum, rate) => sum + rate.hits,
				0
			)
			result.hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0

			// Evict expired entries
			this.cleanupExpiredCache()

			// If cache is still too large, evict least recently used entries
			const maxSize = Number(CONFIG.CACHE_SIZE) || 1000
			if (this.queryCache.size > maxSize * 0.9) {
				// 90% of max size
				const targetSize = Math.floor(maxSize * 0.7) // Reduce to 70% of max size
				this.evictLRUCacheEntries(targetSize)
				result.sizeOptimized = true
			}

			result.entriesEvicted = initialSize - this.queryCache.size
			result.memoryFreed = result.entriesEvicted * 1024 // Rough estimate
			result.optimized = true

			console.log(
				`✅ Cache optimized: ${
					result.entriesEvicted
				} entries evicted, hit rate: ${result.hitRate.toFixed(1)}%`
			)
		} catch (error) {
			console.error('❌ Cache optimization failed:', error)
		}

		return result
	}

	/**
	 * Evict least recently used cache entries down to target size
	 */
	private evictLRUCacheEntries(targetSize: number = 0): void {
		try {
			// Validate input parameters
			if (targetSize < 0) targetSize = 0
			if (this.queryCache.size <= targetSize) return

			// Sync cache access times with actual cache entries to handle orphaned entries
			for (const key of this.cacheAccessTimes.keys()) {
				if (!this.queryCache.has(key)) {
					this.cacheAccessTimes.delete(key)
				}
			}

			// Add missing access times for entries that exist in cache but not in access times
			for (const key of this.queryCache.keys()) {
				if (!this.cacheAccessTimes.has(key)) {
					this.cacheAccessTimes.set(key, Date.now())
				}
			}

			// Sort entries by access time (oldest first)
			const entries = Array.from(this.cacheAccessTimes.entries()).sort(
				([, a], [, b]) => a - b
			)

			// Calculate how many entries need to be removed
			const toRemove = Math.max(0, this.queryCache.size - targetSize)
			let removed = 0

			// Remove oldest entries until we reach target size
			for (const [key] of entries) {
				if (removed >= toRemove || this.queryCache.size <= targetSize) break

				// Double-check key exists before deletion
				if (this.queryCache.has(key)) {
					this.queryCache.delete(key)
					removed++
				}

				// Always clean up access time entry
				this.cacheAccessTimes.delete(key)
			}

			// Safety check: if we still haven't reached target size, force eviction
			if (this.queryCache.size > targetSize) {
				const remainingKeys = Array.from(this.queryCache.keys())
				const toForceRemove = this.queryCache.size - targetSize

				for (let i = 0; i < toForceRemove && i < remainingKeys.length; i++) {
					const key = remainingKeys[i]
					this.queryCache.delete(key)
					this.cacheAccessTimes.delete(key)
					removed++
				}
			}

			if (removed > 0) {
				console.log(
					`🗑️ Evicted ${removed} LRU cache entries (target: ${targetSize}, current: ${this.queryCache.size})`
				)
			}
		} catch (error) {
			console.error('❌ LRU eviction failed:', error)
			// Fallback: clear entire cache if eviction fails to prevent memory accumulation
			const originalSize = this.queryCache.size
			this.queryCache.clear()
			this.cacheAccessTimes.clear()
			console.warn(
				`⚠️ Cleared entire cache as fallback (${originalSize} entries removed)`
			)
		}
	}
}
