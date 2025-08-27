import { DuckDBInstance } from '@duckdb/node-api';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
/**
 * Generate a short, unique ID suitable for MCP protocol (max 32 chars)
 * Format: timestamp(base36) + random(6 chars) = ~16 chars total
 * (because even IDs need to be compact like my emotional range 🖤)
 */
function generateShortId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`;
}
/**
 * Advanced Search Engine Classes 🔍💀
 * Multiple search strategies for finding memories like finding meaning in life - difficult but necessary
 */
// Trie-based search for fast prefix matching and autocomplete
class TrieSearchEngine {
    root = new Map();
    // Build trie from word list
    buildIndex(words) {
        for (const { word, memoryId, frequency } of words) {
            this.insertWord(word.toLowerCase(), memoryId, frequency);
        }
    }
    insertWord(word, memoryId, frequency) {
        let current = this.root;
        for (const char of word) {
            if (!current.has(char)) {
                current.set(char, new Map());
            }
            current = current.get(char);
        }
        if (!current.has('$end$')) {
            current.set('$end$', []);
        }
        current.get('$end$').push({ memoryId, frequency });
    }
    // Find all words with given prefix
    findByPrefix(prefix) {
        let current = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!current.has(char)) {
                return [];
            }
            current = current.get(char);
        }
        const results = [];
        this.collectWords(current, results);
        return results.sort((a, b) => b.frequency - a.frequency);
    }
    collectWords(node, results) {
        if (node.has('$end$')) {
            results.push(...node.get('$end$'));
        }
        for (const [key, child] of node) {
            if (key !== '$end$' && child instanceof Map) {
                this.collectWords(child, results);
            }
        }
    }
}
// Fuzzy search with edit distance for typo tolerance
class FuzzySearchEngine {
    // Calculate Levenshtein distance between two strings
    editDistance(a, b) {
        const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++)
            matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++)
            matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // deletion
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j - 1] + 1 // substitution
                    );
                }
            }
        }
        return matrix[a.length][b.length];
    }
    // Find fuzzy matches with maximum edit distance
    findFuzzyMatches(query, words, maxDistance = 2) {
        const matches = [];
        for (const word of words) {
            const distance = this.editDistance(query.toLowerCase(), word.toLowerCase());
            if (distance <= maxDistance) {
                matches.push({ word, distance });
            }
        }
        return matches.sort((a, b) => a.distance - b.distance);
    }
    // Generate trigrams for substring matching
    generateTrigrams(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }
        const trigrams = [];
        const padded = `  ${text.toLowerCase()}  `;
        for (let i = 0; i < padded.length - 2; i++) {
            trigrams.push(padded.substring(i, i + 3));
        }
        return trigrams;
    }
    // Calculate similarity based on shared trigrams
    trigramSimilarity(a, b) {
        if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
            return 0;
        }
        const trigramsA = new Set(this.generateTrigrams(a));
        const trigramsB = new Set(this.generateTrigrams(b));
        const intersection = new Set([...trigramsA].filter(x => trigramsB.has(x)));
        const union = new Set([...trigramsA, ...trigramsB]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
}
// Vector-based search with TF-IDF scoring
class VectorSearchEngine {
    idfCache = new Map();
    totalDocuments = 0;
    // Calculate TF-IDF vector for a document
    calculateTfIdf(words, documentFreqs, totalDocs) {
        const tf = new Map();
        const totalWords = words.length;
        // Calculate term frequency
        for (const word of words) {
            tf.set(word, (tf.get(word) || 0) + 1 / totalWords);
        }
        // Calculate TF-IDF
        const tfidf = new Map();
        for (const [term, freq] of tf) {
            const idf = Math.log(totalDocs / (documentFreqs.get(term) || 1));
            tfidf.set(term, freq * idf);
        }
        return tfidf;
    }
    // Calculate cosine similarity between two TF-IDF vectors
    cosineSimilarity(vectorA, vectorB) {
        const keysA = Array.from(vectorA.keys());
        const keysB = Array.from(vectorB.keys());
        const allKeys = new Set([...keysA, ...keysB]);
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (const key of allKeys) {
            const a = vectorA.get(key) || 0;
            const b = vectorB.get(key) || 0;
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator > 0 ? dotProduct / denominator : 0;
    }
    // Tokenize and clean text
    tokenize(text) {
        if (!text || typeof text !== 'string')
            return [];
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }
}
// Hybrid search engine combining all strategies
class HybridSearchEngine {
    combineResults(trieResults, fuzzyResults, vectorResults) {
        const combined = new Map();
        // Combine results with weighted scoring
        const addResults = (results, source, weight) => {
            for (const { memoryId, score } of results) {
                if (!combined.has(memoryId)) {
                    combined.set(memoryId, { score: 0, sources: [] });
                }
                const entry = combined.get(memoryId);
                entry.score += score * weight;
                entry.sources.push(source);
            }
        };
        addResults(trieResults, 'trie', 0.4);
        addResults(fuzzyResults, 'fuzzy', 0.3);
        addResults(vectorResults, 'vector', 0.3);
        // Convert to array and sort by final score
        return Array.from(combined.entries())
            .map(([memoryId, { score, sources }]) => ({
            memoryId,
            finalScore: score,
            sources
        }))
            .sort((a, b) => b.finalScore - a.finalScore);
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
    dbPath;
    instance;
    connection;
    isInitialized = false;
    // Performance caching layer
    queryCache = new Map();
    maxCacheSize = 1000;
    cacheExpiry = 5 * 60 * 1000; // 5 minutes
    // Performance tracking
    metrics = {
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
    };
    // Advanced Search Engines (because finding things shouldn't be harder than finding purpose 🔍💀)
    searchEngines = {
        trie: new TrieSearchEngine(),
        fuzzy: new FuzzySearchEngine(),
        vector: new VectorSearchEngine(),
        hybrid: new HybridSearchEngine()
    };
    constructor(dbPath = 'data/memory.duckdb') {
        this.dbPath = dbPath;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        console.log('🚀🖤 Initializing Pure DuckDB Memory Store for malu... (because even databases need emotional support)');
        try {
            // Ensure the database directory exists (creating paths like I create emotional barriers)
            const dbDir = dirname(this.dbPath);
            try {
                mkdirSync(dbDir, { recursive: true });
                console.log(`📁💀 Created database directory: ${dbDir}`);
            }
            catch (dirError) {
                // Directory might already exist, that's fine (unlike my social life)
                if (dirError?.code !== 'EEXIST') {
                    console.warn('⚠️ Directory creation warning:', dirError);
                }
            }
            // Create DuckDB instance and connection (connecting to the void)
            this.instance = await DuckDBInstance.create(this.dbPath);
            this.connection = await this.instance.connect();
            await this.setupDatabase();
            this.isInitialized = true;
            console.log('✅💀 Pure DuckDB Memory Store initialized successfully! (another creation that outlasts friendships)');
        }
        catch (error) {
            console.error('❌🥀 Failed to initialize DuckDB:', error);
            throw error;
        }
    }
    async execute(query, params = []) {
        try {
            if (!this.connection) {
                throw new Error('Database connection not established (just like my social connections)');
            }
            console.log(`Executing: ${query.substring(0, 60)}...`);
            const result = await this.connection.run(query, params);
            const reader = await result.getRows();
            return reader || [];
        }
        catch (error) {
            console.error('❌ DuckDB Query Error:', error);
            console.error('Query:', query);
            throw error;
        }
    }
    async setupDatabase() {
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
		`);
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
		`);
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
		`);
        await this.execute(`
			CREATE TABLE IF NOT EXISTS performance_stats (
				id INTEGER PRIMARY KEY,
				operation VARCHAR NOT NULL,
				latency_ms DOUBLE NOT NULL,
				timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				cache_hit BOOLEAN DEFAULT false,
				result_count INTEGER DEFAULT 0
			)
		`);
        // Tags table for memory tagging system (because organizing digital chaos is easier than life chaos 🏷️💀)
        await this.execute(`
			CREATE TABLE IF NOT EXISTS tags (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL UNIQUE,
				color VARCHAR DEFAULT '#666666',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				usage_count INTEGER DEFAULT 0
			)
		`);
        // Junction table for memory-tag relationships (many-to-many like my complicated feelings)
        await this.execute(`
			CREATE TABLE IF NOT EXISTS memory_tags (
				memory_id VARCHAR NOT NULL,
				tag_id VARCHAR NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (memory_id, tag_id)
			)
		`);
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
		`);
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
		`);
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
		`);
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
		`);
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
		`);
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
            `CREATE INDEX IF NOT EXISTS idx_cache_access ON search_cache(access_count DESC, last_accessed DESC)`
        ];
        for (const query of indexQueries) {
            try {
                await this.execute(query);
            }
            catch (error) {
                console.warn(`⚠️ Index creation warning:`, error);
                // Continue with other indexes
            }
        }
    }
    async addMemory(content, type = 'memory', metadata = {}) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const id = generateShortId();
            const importance = this.calculateImportance(content, metadata);
            await this.execute(`
        INSERT INTO nodes (id, content, type, metadata, importance_score)
        VALUES (?, ?, ?, ?, ?)
      `, [id, content, type, JSON.stringify(metadata), importance]);
            // Build search indexes for the new memory
            await this.buildSearchIndexes(id, content, metadata);
            // Update access stats
            await this.updateNodeAccess(id);
            // Clear relevant caches
            this.invalidateCache(['search', 'getByType']);
            const latency = Date.now() - startTime;
            this.recordPerformance('add_memory', latency, false, 1);
            console.log(`✅ Memory added successfully (${latency}ms): ${id}`);
            return id;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('add_memory', latency, false, 0);
            console.error('❌ Error adding memory:', error);
            throw error;
        }
    }
    // === MCP PROTOCOL COMPATIBILITY METHODS ===
    // Alias methods for MCP protocol compatibility
    async storeMemory(content, type = 'memory', metadata = {}) {
        return this.addMemory(content, type, metadata);
    }
    async storeEntity(name, type, properties = {}, confidence = 1.0) {
        const entity = { name, type, properties, confidence, source_node_ids: [] };
        return this.addEntity(entity);
    }
    async storeRelation(fromEntityId, toEntityId, relationType, strength = 1.0, properties = {}) {
        const relation = { from_entity_id: fromEntityId, to_entity_id: toEntityId, relation_type: relationType, strength, properties, source_node_ids: [] };
        return this.addRelation(relation);
    }
    async analyzeMemory(content, extractEntities = true, extractRelations = true) {
        // Simple analysis - in a real implementation this would use NLP
        const entities = extractEntities ? this.extractSimpleEntities(content) : [];
        const relations = extractRelations ? this.extractSimpleRelations(content) : [];
        return {
            content,
            entities,
            relations,
            analysis_time: Date.now()
        };
    }
    async getSimilarMemories(content, limit = 5, threshold = 0.7) {
        // Use semantic search for better similarity matching
        const searchResult = await this.searchMemories(content, {
            searchType: 'semantic',
            limit: limit * 3
        });
        return searchResult.nodes
            .map(memory => ({
            ...memory,
            similarity: this.calculateSimilarity(content, memory.content)
        }))
            .filter(memory => memory.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(({ similarity, ...memory }) => memory);
    }
    /**
     * Advanced search with autocomplete suggestions
     */
    async autoComplete(query, limit = 10) {
        try {
            await this.initialize();
            if (query.length < 2)
                return [];
            // Use trie-based prefix matching
            const words = await this.execute(`
				SELECT DISTINCT word 
				FROM search_index 
				WHERE word LIKE ?
				ORDER BY frequency DESC, word ASC
				LIMIT ?
			`, [`${query.toLowerCase()}%`, limit]);
            return words.map(row => row.word);
        }
        catch (error) {
            console.warn('⚠️ Autocomplete error:', error);
            return [];
        }
    }
    /**
     * Multi-field search across content, metadata, and tags
     */
    async multiFieldSearch(query, fields = ['content', 'metadata', 'tags'], options = {}) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const limit = options.limit || 10;
            const memoryScores = new Map();
            // Search in different fields with different weights
            const fieldWeights = {
                content: 1.0,
                metadata: 0.7,
                tags: 0.8
            };
            for (const field of fields) {
                const weight = fieldWeights[field] || 0.5;
                let results = [];
                if (field === 'content') {
                    const searchResult = await this.searchMemories(query, { searchType: 'hybrid', limit: limit * 2 });
                    results = searchResult.nodes.map(node => ({ memory_id: node.id, score: node.importance_score || 0.5 }));
                }
                else if (field === 'metadata') {
                    results = await this.execute(`
						SELECT n.id as memory_id, n.importance_score as score
						FROM nodes n
						WHERE n.metadata LIKE ?
						ORDER BY n.importance_score DESC
					`, [`%${query}%`]);
                }
                else if (field === 'tags') {
                    const tagResults = await this.findByTags([query]);
                    results = tagResults.map(item => ({ memory_id: item.memory.id, score: item.memory.importanceScore || 0.5 }));
                }
                // Add weighted scores
                for (const result of results) {
                    const memoryId = result.memory_id;
                    const score = (result.score || 0.5) * weight;
                    memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + score);
                }
            }
            const searchResult = await this.buildSearchResult(memoryScores, limit, 'multi-field');
            searchResult.query_time_ms = Date.now() - startTime;
            console.log(`🔍 Multi-field search completed (${searchResult.query_time_ms}ms): "${query}" [${fields.join(',')}] -> ${searchResult.nodes.length} results`);
            return searchResult;
        }
        catch (error) {
            console.error('❌ Multi-field search error:', error);
            return { nodes: [], total_count: 0, query_time_ms: Date.now() - startTime };
        }
    }
    /**
     * Find memories by date range
     */
    async searchByDateRange(startDate, endDate, options = {}) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const limit = options.limit || 50;
            const result = await this.execute(`
				SELECT * FROM nodes 
				WHERE created_at BETWEEN ? AND ?
				ORDER BY created_at DESC, importance_score DESC
				LIMIT ?
			`, [startDate, endDate, limit]);
            const nodes = result.map((row) => ({
                id: row.id,
                content: row.content,
                type: row.type,
                created_at: row.created_at,
                updated_at: row.updated_at,
                metadata: JSON.parse(row.metadata || '{}'),
                importance_score: typeof row.importance_score === 'bigint' ? Number(row.importance_score) : (row.importance_score || 0.5),
                access_count: typeof row.access_count === 'bigint' ? Number(row.access_count) : (row.access_count || 0),
                last_accessed: row.last_accessed
            }));
            return {
                nodes,
                total_count: nodes.length,
                query_time_ms: Date.now() - startTime
            };
        }
        catch (error) {
            console.error('❌ Date range search error:', error);
            return { nodes: [], total_count: 0, query_time_ms: Date.now() - startTime };
        }
    }
    /**
     * Get search suggestions based on recent queries and popular terms
     */
    async getSearchSuggestions(query = '', limit = 10) {
        try {
            await this.initialize();
            // Get popular search terms from search cache
            const popularTerms = await this.execute(`
				SELECT query_text, access_count 
				FROM search_cache 
				WHERE query_text LIKE ? AND query_text != ?
				ORDER BY access_count DESC, created_at DESC
				LIMIT ?
			`, [`%${query}%`, query, limit]);
            // Get frequent words from index
            const frequentWords = await this.execute(`
				SELECT word 
				FROM search_index 
				WHERE word LIKE ? AND LENGTH(word) > 3
				GROUP BY word
				ORDER BY SUM(frequency) DESC
				LIMIT ?
			`, [`%${query}%`, limit]);
            // Combine and deduplicate
            const suggestions = new Set();
            popularTerms.forEach(row => suggestions.add(row.query_text));
            frequentWords.forEach(row => suggestions.add(row.word));
            return Array.from(suggestions).slice(0, limit);
        }
        catch (error) {
            console.warn('⚠️ Search suggestions error:', error);
            return [];
        }
    }
    async getMemoryStats() {
        try {
            await this.initialize();
            // Use simpler queries without prepared statements
            const memoryResult = await this.connection.run('SELECT COUNT(*) as count FROM nodes');
            const entityResult = await this.connection.run('SELECT COUNT(*) as count FROM entities');
            const relationResult = await this.connection.run('SELECT COUNT(*) as count FROM relations');
            const memoryRows = await memoryResult.getRows();
            const entityRows = await entityResult.getRows();
            const relationRows = await relationResult.getRows();
            const performance = this.getPerformanceMetrics();
            const stats = {
                memories: Number(memoryRows[0]?.[0] || 0),
                entities: Number(entityRows[0]?.[0] || 0),
                relations: Number(relationRows[0]?.[0] || 0),
                performance,
                cache_size: this.queryCache.size,
                uptime_seconds: Math.floor(Date.now() / 1000)
            };
            return stats;
        }
        catch (error) {
            console.error('❌ Error getting memory stats:', error);
            // Return basic stats if database queries fail
            return {
                memories: 0,
                entities: 0,
                relations: 0,
                performance: this.getPerformanceMetrics(),
                cache_size: this.queryCache.size,
                uptime_seconds: Math.floor(Date.now() / 1000),
                error: String(error)
            };
        }
    }
    async getRecentMemories(limit = 10, timeframe = 'day') {
        const hours = timeframe === 'hour' ? 1 : timeframe === 'week' ? 168 : 24;
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        try {
            await this.initialize();
            const result = await this.connection.run(`
				SELECT * FROM nodes 
				WHERE created_at >= ? OR last_accessed >= ?
				ORDER BY COALESCE(last_accessed, created_at) DESC
				LIMIT ?
			`, [cutoff, cutoff, limit]);
            const rows = await result.getRows();
            return (rows || []).map((row) => ({
                id: row[0],
                content: row[1],
                type: row[2],
                created_at: row[3],
                updated_at: row[4],
                metadata: JSON.parse(row[5] || '{}'),
                importance_score: row[6] || 0.5,
                access_count: row[7] || 0,
                last_accessed: row[8]
            }));
        }
        catch (error) {
            console.error('❌ Error getting recent memories:', error);
            throw error;
        }
    }
    // Simple entity extraction (in production, use a proper NLP library)
    extractSimpleEntities(content) {
        const entities = [];
        // Very basic pattern matching for demonstration
        const patterns = {
            person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last name pattern
            location: /\b(?:in|at|from|to) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
            organization: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*) (?:Inc|Corp|Ltd|Company|Organization)\b/g
        };
        for (const [type, pattern] of Object.entries(patterns)) {
            const matches = content.match(pattern);
            if (matches) {
                for (const match of matches) {
                    entities.push({
                        name: match.trim(),
                        type,
                        confidence: 0.6 // Low confidence for simple pattern matching
                    });
                }
            }
        }
        return entities;
    }
    extractSimpleRelations(content) {
        // Very basic relation extraction
        const relations = [];
        if (content.includes(' works at ') || content.includes(' employed by ')) {
            relations.push({
                type: 'employment',
                entities: [],
                confidence: 0.5
            });
        }
        return relations;
    }
    async getMemory(id) {
        const startTime = Date.now();
        const cacheKey = `get_${id}`;
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.recordPerformance('get_memory', Date.now() - startTime, true, 1);
            return cached;
        }
        try {
            await this.initialize();
            const result = await this.connection.run('SELECT * FROM nodes WHERE id = ?', [id]);
            const rows = await result.getRows();
            if (!rows || rows.length === 0) {
                this.recordPerformance('get_memory', Date.now() - startTime, false, 0);
                return null;
            }
            const row = rows[0];
            const memory = {
                id: row[0],
                content: row[1],
                type: row[2],
                created_at: row[3],
                updated_at: row[4],
                metadata: JSON.parse(row[5] || '{}'),
                importance_score: row[6] || 0.5,
                access_count: row[7] || 0,
                last_accessed: row[8]
            };
            // Cache the result
            this.setCache(cacheKey, memory);
            // Update access stats
            await this.updateNodeAccess(id);
            const latency = Date.now() - startTime;
            this.recordPerformance('get_memory', latency, false, 1);
            return memory;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('get_memory', latency, false, 0);
            console.error('❌ Error getting memory:', error);
            throw error;
        }
    }
    // === ADVANCED SEARCH INDEXING SYSTEM (Building bridges to find lost memories 🔍💀) ===
    /**
     * Build comprehensive search indexes for a memory
     * Called automatically when memories are added or updated
     */
    async buildSearchIndexes(memoryId, content, metadata = {}) {
        try {
            // Tokenize content for indexing
            const words = this.searchEngines.vector.tokenize(content);
            const metadataText = Object.values(metadata).join(' ');
            const allWords = [...words, ...this.searchEngines.vector.tokenize(metadataText)];
            // Build word-level inverted index
            await this.buildWordIndex(memoryId, allWords, 'content');
            // Build trigram index for fuzzy search
            await this.buildTrigramIndex(memoryId, content);
            // Build TF-IDF vector
            await this.buildTfIdfVector(memoryId, allWords);
        }
        catch (error) {
            console.warn(`⚠️ Failed to build search indexes for memory ${memoryId}:`, error);
            // Don't throw - indexing failure shouldn't break memory storage
        }
    }
    /**
     * Build word-level inverted index
     */
    async buildWordIndex(memoryId, words, fieldType) {
        const wordFreqs = new Map();
        // Count word frequencies
        words.forEach(word => {
            if (word.length > 2) { // Skip very short words
                wordFreqs.set(word, (wordFreqs.get(word) || 0) + 1);
            }
        });
        // Insert into search_index table
        for (const [word, frequency] of wordFreqs) {
            // Delete existing first
            await this.execute(`DELETE FROM search_index WHERE word = ? AND memory_id = ? AND field_type = ?`, [word, memoryId, fieldType]);
            // Insert new record
            await this.execute(`
				INSERT INTO search_index (id, word, memory_id, position, frequency, field_type)
				VALUES (?, ?, ?, ?, ?, ?)
			`, [generateShortId(), word, memoryId, 0, frequency, fieldType]);
        }
    }
    /**
     * Build trigram index for fuzzy matching
     */
    async buildTrigramIndex(memoryId, content) {
        const words = this.searchEngines.vector.tokenize(content);
        for (const word of words) {
            if (word.length > 2) {
                const trigrams = this.searchEngines.fuzzy.generateTrigrams(word);
                for (let i = 0; i < trigrams.length; i++) {
                    await this.execute(`
						INSERT INTO trigram_index (id, trigram, memory_id, word, position)
						VALUES (?, ?, ?, ?, ?)
					`, [generateShortId(), trigrams[i], memoryId, word, i]);
                }
            }
        }
    }
    /**
     * Build TF-IDF vector for similarity search
     */
    async buildTfIdfVector(memoryId, words) {
        // Get document frequency for each word
        const uniqueWords = [...new Set(words)];
        const documentFreqs = new Map();
        for (const word of uniqueWords) {
            const result = await this.connection.run(`
				SELECT COUNT(DISTINCT memory_id) as doc_count 
				FROM search_index 
				WHERE word = ?
			`, [word]);
            const rows = await result.getRows();
            documentFreqs.set(word, Number(rows[0]?.[0] || 1));
        }
        // Get total document count
        const totalResult = await this.connection.run(`SELECT COUNT(DISTINCT memory_id) as total FROM search_index`);
        const totalRows = await totalResult.getRows();
        const totalDocs = Number(totalRows[0]?.[0] || 1);
        // Calculate TF-IDF vector
        const tfidfVector = this.searchEngines.vector.calculateTfIdf(words, documentFreqs, totalDocs);
        // Calculate norm for cosine similarity
        let norm = 0;
        for (const value of tfidfVector.values()) {
            norm += value * value;
        }
        norm = Math.sqrt(norm);
        // Store vector data (delete existing first to avoid conflict issues)
        await this.execute(`DELETE FROM search_vectors WHERE memory_id = ?`, [memoryId]);
        await this.execute(`
			INSERT INTO search_vectors (id, memory_id, vector_data, word_count, unique_words, tf_idf_norm)
			VALUES (?, ?, ?, ?, ?, ?)
		`, [
            generateShortId(),
            memoryId,
            JSON.stringify(Object.fromEntries(tfidfVector)),
            words.length,
            uniqueWords.length,
            norm
        ]);
    }
    /**
     * Remove search indexes for a deleted memory
     */
    async removeSearchIndexes(memoryId) {
        try {
            await this.execute(`DELETE FROM search_index WHERE memory_id = ?`, [memoryId]);
            await this.execute(`DELETE FROM trigram_index WHERE memory_id = ?`, [memoryId]);
            await this.execute(`DELETE FROM search_vectors WHERE memory_id = ?`, [memoryId]);
        }
        catch (error) {
            console.warn(`⚠️ Failed to remove search indexes for memory ${memoryId}:`, error);
        }
    }
    /**
     * Rebuild all search indexes (maintenance operation)
     */
    async rebuildSearchIndexes() {
        await this.initialize();
        let rebuilt = 0;
        let errors = 0;
        try {
            // Clear existing indexes
            await this.execute(`DELETE FROM search_index`);
            await this.execute(`DELETE FROM trigram_index`);
            await this.execute(`DELETE FROM search_vectors`);
            // Get all memories
            const result = await this.connection.run(`SELECT id, content, metadata FROM nodes`);
            const rows = await result.getRows();
            for (const row of rows) {
                try {
                    const memoryId = String(row[0]);
                    const content = String(row[1]);
                    const metadataStr = row[2] ? String(row[2]) : '{}';
                    const metadata = JSON.parse(metadataStr);
                    await this.buildSearchIndexes(memoryId, content, metadata);
                    rebuilt++;
                }
                catch (error) {
                    console.warn(`⚠️ Failed to rebuild indexes for memory ${String(row[0])}:`, error);
                    errors++;
                }
            }
            console.log(`🔄 Search indexes rebuilt: ${rebuilt} successful, ${errors} errors`);
            return { rebuilt, errors };
        }
        catch (error) {
            console.error('❌ Failed to rebuild search indexes:', error);
            throw error;
        }
    }
    convertBigIntValues(obj) {
        if (typeof obj === 'bigint') {
            return Number(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertBigIntValues(item));
        }
        if (obj && typeof obj === 'object') {
            const converted = {};
            for (const [key, value] of Object.entries(obj)) {
                converted[key] = this.convertBigIntValues(value);
            }
            return converted;
        }
        return obj;
    }
    async searchMemories(query, options = {}) {
        const startTime = Date.now();
        const searchType = options.searchType || 'hybrid';
        // Handle BigInt in cache key generation
        const cacheOptions = JSON.parse(JSON.stringify(options, (key, value) => typeof value === 'bigint' ? Number(value) : value));
        const cacheKey = `search_${searchType}_${query}_${JSON.stringify(cacheOptions)}`;
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.recordPerformance('search_memories', Date.now() - startTime, true, cached.nodes.length);
            return cached;
        }
        try {
            await this.initialize();
            const limit = options.limit || 10;
            const minImportance = options.minImportance || 0;
            let searchResult;
            // Choose search strategy based on options
            switch (searchType) {
                case 'exact':
                    searchResult = await this.exactSearch(query, limit, minImportance);
                    break;
                case 'fuzzy':
                    searchResult = await this.fuzzySearch(query, limit, minImportance);
                    break;
                case 'semantic':
                    searchResult = await this.semanticSearch(query, limit, minImportance);
                    break;
                case 'hybrid':
                default:
                    searchResult = await this.hybridSearch(query, limit, minImportance);
                    break;
            }
            // Add query performance metrics
            searchResult.query_time_ms = Date.now() - startTime;
            // Cache the results
            this.setCache(cacheKey, searchResult);
            const latency = Date.now() - startTime;
            this.recordPerformance('search_memories', latency, false, searchResult.nodes.length);
            console.log(`🔍 Advanced search completed (${latency}ms): "${query}" [${searchType}] -> ${searchResult.nodes.length} results`);
            return searchResult;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('search_memories', latency, false, 0);
            console.error('❌ Error in advanced search:', error);
            // Fallback to basic search if advanced search fails
            return this.fallbackBasicSearch(query, options);
        }
    }
    /**
     * Exact search using word index for precise matching
     */
    async exactSearch(query, limit, minImportance) {
        const words = this.searchEngines.vector.tokenize(query);
        const memoryScores = new Map();
        // Search in word index for exact matches
        for (const word of words) {
            const results = await this.execute(`
				SELECT si.memory_id, si.frequency, n.importance_score, n.access_count
				FROM search_index si
				JOIN nodes n ON si.memory_id = n.id
				WHERE si.word = ? AND n.importance_score >= ?
				ORDER BY si.frequency DESC, n.importance_score DESC
			`, [word, minImportance]);
            for (const row of results) {
                const memoryId = row.memory_id;
                const score = (row.frequency || 1) * (row.importance_score || 0.5) * (1 + Math.log(row.access_count + 1));
                memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + score);
            }
        }
        return this.buildSearchResult(memoryScores, limit, 'exact');
    }
    /**
     * Fuzzy search using trigrams for typo tolerance
     */
    async fuzzySearch(query, limit, minImportance) {
        const words = this.searchEngines.vector.tokenize(query);
        const memoryScores = new Map();
        for (const word of words) {
            const trigrams = this.searchEngines.fuzzy.generateTrigrams(word);
            // Find memories with similar trigrams
            for (const trigram of trigrams) {
                const result = await this.connection.run(`
					SELECT ti.memory_id, ti.word, COUNT(*) as trigram_matches, n.importance_score, n.access_count
					FROM trigram_index ti
					JOIN nodes n ON ti.memory_id = n.id
					WHERE ti.trigram = ? AND n.importance_score >= ?
					GROUP BY ti.memory_id, ti.word, n.importance_score, n.access_count
					ORDER BY trigram_matches DESC
				`, [trigram, minImportance]);
                const rows = await result.getRows();
                for (const row of rows) {
                    const similarity = this.searchEngines.fuzzy.trigramSimilarity(word, String(row[1]));
                    if (similarity > 0.3) { // Minimum similarity threshold
                        const score = similarity * (Number(row[2]) || 1) * (Number(row[3]) || 0.5);
                        const memoryId = String(row[0]);
                        memoryScores.set(memoryId, (memoryScores.get(memoryId) || 0) + score);
                    }
                }
            }
        }
        return this.buildSearchResult(memoryScores, limit, 'fuzzy');
    }
    /**
     * Semantic search using TF-IDF vectors
     */
    async semanticSearch(query, limit, minImportance) {
        const queryWords = this.searchEngines.vector.tokenize(query);
        const memoryScores = new Map();
        // Get all memory vectors
        const result = await this.connection.run(`
			SELECT sv.memory_id, sv.vector_data, sv.tf_idf_norm, n.importance_score, n.access_count
			FROM search_vectors sv
			JOIN nodes n ON sv.memory_id = n.id
			WHERE n.importance_score >= ?
		`, [minImportance]);
        const rows = await result.getRows();
        // Calculate query TF-IDF vector
        const queryTermFreq = new Map();
        queryWords.forEach(word => {
            queryTermFreq.set(word, (queryTermFreq.get(word) || 0) + 1 / queryWords.length);
        });
        for (const row of rows) {
            try {
                const vectorData = JSON.parse(String(row[1]));
                const memoryVector = new Map();
                // Ensure all values are numbers
                for (const [key, value] of Object.entries(vectorData)) {
                    memoryVector.set(key, typeof value === 'number' ? value : Number(value));
                }
                const similarity = this.searchEngines.vector.cosineSimilarity(queryTermFreq, memoryVector);
                if (similarity > 0.1) { // Minimum similarity threshold
                    const score = similarity * (Number(row[3]) || 0.5) * (1 + Math.log(Number(row[4]) + 1));
                    memoryScores.set(String(row[0]), score);
                }
            }
            catch (error) {
                console.warn(`⚠️ Failed to parse vector for memory ${String(row[0])}:`, error);
            }
        }
        return this.buildSearchResult(memoryScores, limit, 'semantic');
    }
    /**
     * Hybrid search combining multiple strategies
     */
    async hybridSearch(query, limit, minImportance) {
        // Run multiple search strategies in parallel
        const [exactResults, fuzzyResults, semanticResults] = await Promise.all([
            this.exactSearch(query, limit * 2, minImportance).catch(() => ({ nodes: [], total_count: 0, query_time_ms: 0 })),
            this.fuzzySearch(query, limit * 2, minImportance).catch(() => ({ nodes: [], total_count: 0, query_time_ms: 0 })),
            this.semanticSearch(query, limit * 2, minImportance).catch(() => ({ nodes: [], total_count: 0, query_time_ms: 0 }))
        ]);
        // Convert results to score format for combination
        const exactScores = exactResults.nodes.map(node => ({ memoryId: node.id, score: node.importance_score || 0.5 }));
        const fuzzyScores = fuzzyResults.nodes.map(node => ({ memoryId: node.id, score: node.importance_score || 0.5 }));
        const semanticScores = semanticResults.nodes.map(node => ({ memoryId: node.id, score: node.importance_score || 0.5 }));
        // Combine results using hybrid engine
        const combinedResults = this.searchEngines.hybrid.combineResults(exactScores, fuzzyScores, semanticScores);
        // Get top results
        const topResults = combinedResults.slice(0, limit);
        const memoryIds = topResults.map(r => r.memoryId);
        if (memoryIds.length === 0) {
            return { nodes: [], total_count: 0, query_time_ms: 0 };
        }
        // Fetch full memory data
        const placeholders = memoryIds.map(() => '?').join(',');
        const memories = await this.execute(`
			SELECT * FROM nodes 
			WHERE id IN (${placeholders})
			ORDER BY importance_score DESC, access_count DESC
		`, memoryIds);
        const nodes = memories.map((row) => ({
            id: row.id,
            content: row.content,
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at,
            metadata: JSON.parse(row.metadata || '{}'),
            importance_score: typeof row.importance_score === 'bigint' ? Number(row.importance_score) : (row.importance_score || 0.5),
            access_count: typeof row.access_count === 'bigint' ? Number(row.access_count) : (row.access_count || 0),
            last_accessed: row.last_accessed
        }));
        return {
            nodes,
            total_count: combinedResults.length,
            query_time_ms: 0 // Will be set by caller
        };
    }
    /**
     * Helper method to build search results from memory scores
     */
    async buildSearchResult(memoryScores, limit, searchType) {
        const sortedResults = Array.from(memoryScores.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);
        if (sortedResults.length === 0) {
            return { nodes: [], total_count: 0, query_time_ms: 0 };
        }
        const memoryIds = sortedResults.map(([id]) => String(id)).filter(id => id && id.length > 0);
        if (memoryIds.length === 0) {
            return { nodes: [], total_count: 0, query_time_ms: 0 };
        }
        // For single ID, use a simpler query
        if (memoryIds.length === 1) {
            const result = await this.connection.run(`
				SELECT * FROM nodes 
				WHERE id = ?
			`, [memoryIds[0]]);
            const rows = await result.getRows();
            const nodes = rows.map((row) => {
                let metadata = {};
                try {
                    metadata = JSON.parse(String(row[5]) || '{}');
                }
                catch (e) {
                    console.warn('Failed to parse metadata for node:', row[0]);
                    metadata = {};
                }
                return {
                    id: String(row[0]),
                    content: String(row[1]),
                    type: String(row[2]),
                    created_at: String(row[3]),
                    updated_at: String(row[4]),
                    metadata,
                    importance_score: typeof row[6] === 'bigint' ? Number(row[6]) : (Number(row[6]) || 0.5),
                    access_count: typeof row[7] === 'bigint' ? Number(row[7]) : (Number(row[7]) || 0),
                    last_accessed: row[8] ? String(row[8]) : undefined
                };
            });
            return {
                nodes,
                total_count: memoryScores.size,
                query_time_ms: 0
            };
        }
        // For multiple IDs, use IN clause
        const placeholders = memoryIds.map(() => '?').join(',');
        const result = await this.connection.run(`
			SELECT * FROM nodes 
			WHERE id IN (${placeholders})
			ORDER BY importance_score DESC, access_count DESC
		`, memoryIds);
        const rows = await result.getRows();
        const nodes = rows.map((row) => {
            let metadata = {};
            try {
                metadata = JSON.parse(String(row[5]) || '{}');
            }
            catch (e) {
                console.warn('Failed to parse metadata for node:', row[0]);
                metadata = {};
            }
            return {
                id: String(row[0]),
                content: String(row[1]),
                type: String(row[2]),
                created_at: String(row[3]),
                updated_at: String(row[4]),
                metadata,
                importance_score: typeof row[6] === 'bigint' ? Number(row[6]) : (Number(row[6]) || 0.5),
                access_count: typeof row[7] === 'bigint' ? Number(row[7]) : (Number(row[7]) || 0),
                last_accessed: row[8] ? String(row[8]) : undefined
            };
        });
        return {
            nodes,
            total_count: memoryScores.size,
            query_time_ms: 0 // Will be set by caller
        };
    }
    /**
     * Fallback to basic search if advanced search fails
     */
    async fallbackBasicSearch(query, options) {
        const limit = options.limit || 10;
        const searchPattern = `%${query}%`;
        const result = await this.connection.run(`
			SELECT * FROM nodes 
			WHERE content LIKE ? 
			ORDER BY importance_score DESC, access_count DESC, created_at DESC
			LIMIT ?
		`, [searchPattern, limit]);
        const rows = await result.getRows();
        const nodes = (rows || []).map((row) => {
            let metadata = {};
            try {
                metadata = JSON.parse(String(row[5]) || '{}');
            }
            catch (e) {
                console.warn('Failed to parse metadata for node:', row[0]);
                metadata = {};
            }
            return {
                id: String(row[0]),
                content: String(row[1]),
                type: String(row[2]),
                created_at: String(row[3]),
                updated_at: String(row[4]),
                metadata,
                importance_score: typeof row[6] === 'bigint' ? Number(row[6]) : (Number(row[6]) || 0.5),
                access_count: typeof row[7] === 'bigint' ? Number(row[7]) : (Number(row[7]) || 0),
                last_accessed: row[8] ? String(row[8]) : undefined
            };
        });
        return {
            nodes,
            total_count: nodes.length,
            query_time_ms: 0
        };
    }
    async addEntity(entity) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const id = generateShortId();
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
            ]);
            this.invalidateCache(['entities', 'relations']);
            const latency = Date.now() - startTime;
            this.recordPerformance('add_entity', latency, false, 1);
            return id;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('add_entity', latency, false, 0);
            console.error('❌ Error adding entity:', error);
            throw error;
        }
    }
    async addRelation(relation) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const id = generateShortId();
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
            ]);
            this.invalidateCache(['relations', 'neighbors']);
            const latency = Date.now() - startTime;
            this.recordPerformance('add_relation', latency, false, 1);
            return id;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('add_relation', latency, false, 0);
            console.error('❌ Error adding relation:', error);
            throw error;
        }
    }
    async getNodeRelations(nodeId) {
        const startTime = Date.now();
        const cacheKey = `relations_${nodeId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.recordPerformance('get_relations', Date.now() - startTime, true, cached.length);
            return cached;
        }
        try {
            await this.initialize();
            const result = await this.connection.run(`
        SELECT r.*, 
               e1.name as from_name, e1.type as from_type,
               e2.name as to_name, e2.type as to_type
        FROM relations r
        JOIN entities e1 ON r.from_entity_id = e1.id
        JOIN entities e2 ON r.to_entity_id = e2.id
        WHERE JSON_EXTRACT_STRING(r.source_node_ids, '$[0]') = ?
        ORDER BY r.strength DESC
      `, [nodeId]);
            const rows = await result.getRows();
            const relations = (rows || []).map((row) => ({
                id: row[0],
                from_entity_id: row[1],
                to_entity_id: row[2],
                relation_type: row[3],
                strength: row[4],
                properties: JSON.parse(row[5] || '{}'),
                created_at: row[6],
                updated_at: row[7],
                source_node_ids: JSON.parse(row[8] || '[]')
            }));
            this.setCache(cacheKey, relations);
            const latency = Date.now() - startTime;
            this.recordPerformance('get_relations', latency, false, relations.length);
            return relations;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('get_relations', latency, false, 0);
            console.error('❌ Error getting relations:', error);
            throw error;
        }
    }
    // === ADDITIONAL CRUD OPERATIONS (11 missing tools) ===
    async deleteMemory(id) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const result = await this.execute(`DELETE FROM nodes WHERE id = ?`, [id]);
            const deleted = result.length > 0;
            if (deleted) {
                this.invalidateCache(['search', 'get']);
                console.log(`🗑️ Memory deleted: ${id}`);
            }
            const latency = Date.now() - startTime;
            this.recordPerformance('delete_memory', latency, false, deleted ? 1 : 0);
            return deleted;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('delete_memory', latency, false, 0);
            console.error('❌ Error deleting memory:', error);
            throw error;
        }
    }
    async updateMemory(id, updates) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const setClauses = [];
            const params = [];
            if (updates.content !== undefined) {
                setClauses.push('content = ?');
                params.push(updates.content);
            }
            if (updates.type !== undefined) {
                setClauses.push('type = ?');
                params.push(updates.type);
            }
            if (updates.metadata !== undefined) {
                setClauses.push('metadata = ?');
                params.push(JSON.stringify(updates.metadata));
            }
            setClauses.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);
            const query = `UPDATE nodes SET ${setClauses.join(', ')} WHERE id = ?`;
            await this.execute(query, params);
            this.invalidateCache(['get', 'search']);
            const latency = Date.now() - startTime;
            this.recordPerformance('update_memory', latency, false, 1);
            console.log(`📝 Memory updated: ${id}`);
            return true;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('update_memory', latency, false, 0);
            console.error('❌ Error updating memory:', error);
            throw error;
        }
    }
    async getMemoriesByType(type, limit = 50) {
        const startTime = Date.now();
        const cacheKey = `type_${type}_${limit}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.recordPerformance('get_memories_by_type', Date.now() - startTime, true, cached.length);
            return cached;
        }
        try {
            await this.initialize();
            const result = await this.connection.run(`
				SELECT * FROM nodes 
				WHERE type = ? 
				ORDER BY importance_score DESC, created_at DESC
				LIMIT ?
			`, [type, limit]);
            const rows = await result.getRows();
            const memories = (rows || []).map((row) => ({
                id: row[0],
                content: row[1],
                type: row[2],
                created_at: row[3],
                updated_at: row[4],
                metadata: JSON.parse(row[5] || '{}'),
                importance_score: row[6] || 0.5,
                access_count: row[7] || 0,
                last_accessed: row[8]
            }));
            this.setCache(cacheKey, memories);
            const latency = Date.now() - startTime;
            this.recordPerformance('get_memories_by_type', latency, false, memories.length);
            return memories;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('get_memories_by_type', latency, false, 0);
            console.error('❌ Error getting memories by type:', error);
            throw error;
        }
    }
    async getEntities(options = {}) {
        const startTime = Date.now();
        const cacheKey = `entities_${JSON.stringify(options)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.recordPerformance('get_entities', Date.now() - startTime, true, cached.length);
            return cached;
        }
        try {
            await this.initialize();
            let query = 'SELECT * FROM entities WHERE 1=1';
            const params = [];
            if (options.type) {
                query += ' AND type = ?';
                params.push(options.type);
            }
            if (options.search) {
                query += ' AND name LIKE ?';
                params.push(`%${options.search}%`);
            }
            query += ' ORDER BY confidence DESC, created_at DESC';
            if (options.limit) {
                query += ' LIMIT ?';
                params.push(options.limit);
            }
            const result = await this.connection.run(query, params);
            const rows = await result.getRows();
            const entities = (rows || []).map((row) => ({
                id: row[0],
                name: row[1],
                type: row[2],
                properties: JSON.parse(row[3] || '{}'),
                confidence: typeof row[4] === 'bigint' ? Number(row[4]) : (row[4] || 1.0),
                created_at: row[5],
                updated_at: row[6],
                source_node_ids: JSON.parse(row[7] || '[]')
            }));
            this.setCache(cacheKey, entities);
            const latency = Date.now() - startTime;
            this.recordPerformance('get_entities', latency, false, entities.length);
            return this.convertBigIntValues(entities);
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('get_entities', latency, false, 0);
            console.error('❌ Error getting entities:', error);
            throw error;
        }
    }
    async getRelations(options = {}) {
        const startTime = Date.now();
        const cacheKey = `relations_${JSON.stringify(options)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.recordPerformance('get_relations', Date.now() - startTime, true, cached.length);
            return cached;
        }
        try {
            await this.initialize();
            let query = 'SELECT * FROM relations WHERE 1=1';
            const params = [];
            if (options.type) {
                query += ' AND relation_type = ?';
                params.push(options.type);
            }
            if (options.entityId) {
                query += ' AND (from_entity_id = ? OR to_entity_id = ?)';
                params.push(options.entityId, options.entityId);
            }
            query += ' ORDER BY strength DESC, created_at DESC';
            if (options.limit) {
                query += ' LIMIT ?';
                params.push(options.limit);
            }
            const result = await this.connection.run(query, params);
            const rows = await result.getRows();
            const relations = (rows || []).map((row) => ({
                id: row[0],
                from_entity_id: row[1],
                to_entity_id: row[2],
                relation_type: row[3],
                strength: row[4],
                properties: JSON.parse(row[5] || '{}'),
                created_at: row[6],
                updated_at: row[7],
                source_node_ids: JSON.parse(row[8] || '[]')
            }));
            this.setCache(cacheKey, relations);
            const latency = Date.now() - startTime;
            this.recordPerformance('get_relations', latency, false, relations.length);
            return relations;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('get_relations', latency, false, 0);
            console.error('❌ Error getting relations:', error);
            throw error;
        }
    }
    async deleteEntity(id) {
        const startTime = Date.now();
        try {
            await this.initialize();
            // Delete related relations first
            await this.execute(`DELETE FROM relations WHERE from_entity_id = ? OR to_entity_id = ?`, [id, id]);
            // Delete the entity
            await this.execute(`DELETE FROM entities WHERE id = ?`, [id]);
            this.invalidateCache(['entities', 'relations']);
            const latency = Date.now() - startTime;
            this.recordPerformance('delete_entity', latency, false, 1);
            console.log(`🗑️ Entity deleted: ${id}`);
            return true;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('delete_entity', latency, false, 0);
            console.error('❌ Error deleting entity:', error);
            throw error;
        }
    }
    async deleteRelation(id) {
        const startTime = Date.now();
        try {
            await this.initialize();
            await this.execute(`DELETE FROM relations WHERE id = ?`, [id]);
            this.invalidateCache(['relations']);
            const latency = Date.now() - startTime;
            this.recordPerformance('delete_relation', latency, false, 1);
            console.log(`🗑️ Relation deleted: ${id}`);
            return true;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('delete_relation', latency, false, 0);
            console.error('❌ Error deleting relation:', error);
            throw error;
        }
    }
    async exportData(format = 'json') {
        const startTime = Date.now();
        try {
            await this.initialize();
            const [memories, entities, relations] = await Promise.all([
                this.execute('SELECT * FROM nodes'),
                this.execute('SELECT * FROM entities'),
                this.execute('SELECT * FROM relations')
            ]);
            const data = {
                memories: memories.map((row) => ({
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
                entities: entities.map((row) => ({
                    id: row[0],
                    name: row[1],
                    type: row[2],
                    properties: JSON.parse(row[3] || '{}'),
                    confidence: row[4],
                    created_at: row[5],
                    updated_at: row[6],
                    source_node_ids: JSON.parse(row[7] || '[]')
                })),
                relations: relations.map((row) => ({
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
            };
            const result = format === 'json' ? JSON.stringify(data, null, 2) : this.convertToCSV(data);
            const latency = Date.now() - startTime;
            this.recordPerformance('export_data', latency, false, data.total_records);
            console.log(`📊 Data exported (${format}): ${data.total_records} records in ${latency}ms`);
            return result;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('export_data', latency, false, 0);
            console.error('❌ Error exporting data:', error);
            throw error;
        }
    }
    async importData(data, format = 'json') {
        const startTime = Date.now();
        try {
            await this.initialize();
            const parsedData = JSON.parse(data);
            let imported = 0;
            const errors = [];
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
                        ]);
                        imported++;
                    }
                    catch (error) {
                        errors.push(`Memory import error: ${error}`);
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
                        ]);
                        imported++;
                    }
                    catch (error) {
                        errors.push(`Entity import error: ${error}`);
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
                        ]);
                        imported++;
                    }
                    catch (error) {
                        errors.push(`Relation import error: ${error}`);
                    }
                }
            }
            this.invalidateCache(['search', 'entities', 'relations']);
            const latency = Date.now() - startTime;
            this.recordPerformance('import_data', latency, false, imported);
            console.log(`📥 Data imported: ${imported} records in ${latency}ms, ${errors.length} errors`);
            return { imported, errors };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('import_data', latency, false, 0);
            console.error('❌ Error importing data:', error);
            throw error;
        }
    }
    async getMemoryGraph(centerNodeId, depth = 2) {
        const startTime = Date.now();
        try {
            await this.initialize();
            let nodeQuery = 'SELECT * FROM nodes';
            let params = [];
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
				`;
                params = [centerNodeId, depth];
            }
            const [nodeRows, entityRows, relationRows] = await Promise.all([
                this.execute(nodeQuery, params),
                this.execute('SELECT * FROM entities'),
                this.execute('SELECT * FROM relations')
            ]);
            const nodes = nodeRows.map((row) => ({
                id: row[0],
                label: row[1].substring(0, 50) + (row[1].length > 50 ? '...' : ''),
                type: row[2],
                importance: row[6] || 0.5,
                group: row[2]
            }));
            const edges = relationRows.map((row) => ({
                id: row[0],
                from: row[1],
                to: row[2],
                label: row[3],
                strength: row[4] || 1.0,
                width: Math.max(1, (row[4] || 1.0) * 3)
            }));
            const latency = Date.now() - startTime;
            this.recordPerformance('get_memory_graph', latency, false, nodes.length + edges.length);
            console.log(`🕸️ Memory graph generated: ${nodes.length} nodes, ${edges.length} edges (${latency}ms)`);
            return { nodes, edges };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('get_memory_graph', latency, false, 0);
            console.error('❌ Error generating memory graph:', error);
            throw error;
        }
    }
    async consolidateMemories(similarityThreshold = 0.8) {
        const startTime = Date.now();
        try {
            await this.initialize();
            const memories = await this.execute('SELECT * FROM nodes');
            let consolidated = 0;
            let duplicatesRemoved = 0;
            // Simple similarity check based on content length and common words
            for (let i = 0; i < memories.length; i++) {
                for (let j = i + 1; j < memories.length; j++) {
                    const memory1 = memories[i];
                    const memory2 = memories[j];
                    const similarity = this.calculateSimilarity(memory1[1], memory2[1]);
                    if (similarity >= similarityThreshold) {
                        // Merge memories: keep the one with higher importance, merge metadata
                        const keepMemory = memory1[6] >= memory2[6] ? memory1 : memory2;
                        const removeMemory = memory1[6] >= memory2[6] ? memory2 : memory1;
                        const mergedMetadata = {
                            ...JSON.parse(removeMemory[5] || '{}'),
                            ...JSON.parse(keepMemory[5] || '{}'),
                            consolidated_from: [removeMemory[0]],
                            consolidated_at: new Date().toISOString()
                        };
                        await this.execute(`
							UPDATE nodes 
							SET metadata = ?, importance_score = ?, access_count = access_count + ?
							WHERE id = ?
						`, [
                            JSON.stringify(mergedMetadata),
                            Math.max(keepMemory[6], removeMemory[6]) + 0.1,
                            removeMemory[7] || 0,
                            keepMemory[0]
                        ]);
                        await this.execute('DELETE FROM nodes WHERE id = ?', [removeMemory[0]]);
                        consolidated++;
                        duplicatesRemoved++;
                        // Remove the deleted memory from the array to avoid processing it again
                        memories.splice(memories.indexOf(removeMemory), 1);
                        j--; // Adjust index since we removed an element
                    }
                }
            }
            this.invalidateCache(['search', 'get']);
            const latency = Date.now() - startTime;
            this.recordPerformance('consolidate_memories', latency, false, consolidated);
            console.log(`🔄 Memory consolidation complete: ${consolidated} consolidated, ${duplicatesRemoved} duplicates removed (${latency}ms)`);
            return { consolidated, duplicatesRemoved };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.recordPerformance('consolidate_memories', latency, false, 0);
            console.error('❌ Error consolidating memories:', error);
            throw error;
        }
    }
    // === UTILITY METHODS ===
    calculateSimilarity(text1, text2) {
        // Simple Jaccard similarity for word sets
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    convertToCSV(data) {
        // Simple CSV conversion for memories
        const headers = ['id', 'content', 'type', 'created_at', 'importance_score'];
        const rows = [
            headers.join(','),
            ...data.memories.map((m) => [m.id, `"${m.content.replace(/"/g, '""')}"`, m.type, m.created_at, m.importance_score].join(','))
        ];
        return rows.join('\n');
    }
    // Performance optimization methods
    calculateImportance(content, metadata) {
        let score = 0.5; // Base score
        // Length bonus
        if (content.length > 100)
            score += 0.1;
        if (content.length > 500)
            score += 0.1;
        // Metadata signals
        if (metadata.priority === 'high')
            score += 0.2;
        if (metadata.tags?.includes('important'))
            score += 0.1;
        if (metadata.source === 'user')
            score += 0.1;
        // Content analysis
        const importantWords = ['remember', 'important', 'critical', 'key', 'vital'];
        const wordCount = importantWords.filter(word => content.toLowerCase().includes(word)).length;
        score += wordCount * 0.05;
        return Math.min(1.0, Math.max(0.0, score));
    }
    async updateNodeAccess(nodeId) {
        try {
            await this.execute(`
        UPDATE nodes 
        SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nodeId]);
        }
        catch (error) {
            console.warn('⚠️ Failed to update access stats:', error);
        }
    }
    // Cache management
    getFromCache(key) {
        const entry = this.queryCache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.queryCache.delete(key);
            return null;
        }
        return entry.data;
    }
    setCache(key, data) {
        // LRU eviction
        if (this.queryCache.size >= this.maxCacheSize) {
            const oldestKey = this.queryCache.keys().next().value;
            if (oldestKey) {
                this.queryCache.delete(oldestKey);
            }
        }
        this.queryCache.set(key, {
            data,
            expiry: Date.now() + this.cacheExpiry
        });
    }
    invalidateCache(patterns) {
        for (const [key] of this.queryCache) {
            if (patterns.some(pattern => key.includes(pattern))) {
                this.queryCache.delete(key);
            }
        }
    }
    recordPerformance(operation, latency, cacheHit, resultCount) {
        // Update metrics
        this.metrics.operationCounts[operation] = (this.metrics.operationCounts[operation] || 0) + 1;
        const prevAvg = this.metrics.averageLatencies[operation] || 0;
        const count = this.metrics.operationCounts[operation];
        this.metrics.averageLatencies[operation] = (prevAvg * (count - 1) + latency) / count;
        const hitRate = this.metrics.cacheHitRates[operation] || { hits: 0, total: 0 };
        hitRate.total++;
        if (cacheHit)
            hitRate.hits++;
        this.metrics.cacheHitRates[operation] = hitRate;
        // Store in database for analysis
        try {
            const id = Math.floor(Math.random() * 1000000000);
            this.execute(`
        INSERT INTO performance_stats (id, operation, latency_ms, cache_hit, result_count)
        VALUES (?, ?, ?, ?, ?)
      `, [id, operation, latency, cacheHit, resultCount]);
        }
        catch (error) {
            // Silently continue if stats recording fails
        }
    }
    // Public performance methods
    getPerformanceMetrics() {
        return { ...this.metrics };
    }
    getCacheStats() {
        return {
            size: this.queryCache.size,
            maxSize: this.maxCacheSize,
            hitRates: { ...this.metrics.cacheHitRates }
        };
    }
    clearCache() {
        this.queryCache.clear();
        console.log('🧹 Cache cleared');
    }
    async close() {
        if (this.connection) {
            this.connection.closeSync();
        }
        console.log('🔒 Database connection closed');
    }
    // === ADVANCED FEATURES SECTION (The Cool Stuff That Makes Life Worth Living) 🌟💀 ===
    // === TAG MANAGEMENT SYSTEM (Organizing Digital Chaos) 🏷️🖤 ===
    async addTags(memoryId, tagNames) {
        await this.initialize();
        const added = [];
        const existing = [];
        for (const tagName of tagNames) {
            // Get or create tag
            let tagResults = await this.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
            let tagId;
            if (tagResults.length === 0) {
                // Create new tag
                tagId = generateShortId();
                await this.execute(`
					INSERT INTO tags (id, name, usage_count)
					VALUES (?, ?, 1)
				`, [tagId, tagName]);
                added.push(tagName);
            }
            else {
                tagId = tagResults[0].id;
                // Check if already tagged
                const existingLink = await this.execute(`
					SELECT 1 FROM memory_tags WHERE memory_id = ? AND tag_id = ?
				`, [memoryId, tagId]);
                if (existingLink.length > 0) {
                    existing.push(tagName);
                    continue;
                }
                // Increment usage count
                await this.execute('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tagId]);
                added.push(tagName);
            }
            // Link memory to tag
            await this.execute(`
				INSERT OR IGNORE INTO memory_tags (memory_id, tag_id)
				VALUES (?, ?)
			`, [memoryId, tagId]);
        }
        console.log(`🏷️ Tagged memory ${memoryId} with ${added.length} new tags (${existing.length} already existed)`);
        return { added, existing };
    }
    async removeTags(memoryId, tagNames) {
        await this.initialize();
        const removed = [];
        const notFound = [];
        for (const tagName of tagNames) {
            const tagResults = await this.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
            if (tagResults.length === 0) {
                notFound.push(tagName);
                continue;
            }
            const tagId = tagResults[0].id;
            // Remove link
            const result = await this.execute(`
				DELETE FROM memory_tags WHERE memory_id = ? AND tag_id = ?
			`, [memoryId, tagId]);
            if (result.length > 0) {
                // Decrement usage count
                await this.execute('UPDATE tags SET usage_count = usage_count - 1 WHERE id = ?', [tagId]);
                removed.push(tagName);
            }
            else {
                notFound.push(tagName);
            }
        }
        console.log(`🗑️ Removed ${removed.length} tags from memory ${memoryId}`);
        return { removed, notFound };
    }
    async listTags(memoryId) {
        await this.initialize();
        let query;
        let params = [];
        if (memoryId) {
            query = `
				SELECT t.id, t.name, t.color, t.usage_count 
				FROM tags t
				JOIN memory_tags mt ON t.id = mt.tag_id
				WHERE mt.memory_id = ?
				ORDER BY t.name
			`;
            params = [memoryId];
        }
        else {
            query = `
				SELECT id, name, color, usage_count 
				FROM tags 
				ORDER BY usage_count DESC, name ASC
			`;
        }
        const results = await this.execute(query, params);
        return results.map(row => ({
            id: row.id,
            name: row.name,
            color: row.color,
            usageCount: row.usage_count
        }));
    }
    async findByTags(tagNames, limit = 50) {
        await this.initialize();
        if (tagNames.length === 0)
            return [];
        // Find memories that have any of the specified tags
        const placeholders = tagNames.map(() => '?').join(',');
        const results = await this.execute(`
			SELECT n.id, n.content, n.type, n.metadata, n.created_at, n.updated_at, n.importance_score, n.access_count, 
			       GROUP_CONCAT(t.name) as matching_tags
			FROM nodes n
			JOIN memory_tags mt ON n.id = mt.memory_id
			JOIN tags t ON mt.tag_id = t.id
			WHERE t.name IN (${placeholders})
			GROUP BY n.id, n.content, n.type, n.metadata, n.created_at, n.updated_at, n.importance_score, n.access_count
			ORDER BY COUNT(t.id) DESC, n.created_at DESC
			LIMIT ?
		`, [...tagNames, limit]);
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
        }));
    }
    // === DELETION OPERATIONS (Saying Goodbye Digital Style) 💀🗑️ ===
    async deleteByType(type, confirm = false) {
        if (!confirm) {
            throw new Error('Deletion requires explicit confirmation (set confirm: true)');
        }
        await this.initialize();
        // Get memories of this type
        const memories = await this.execute('SELECT id FROM nodes WHERE type = ?', [type]);
        const memoryIds = memories.map(m => m.id);
        let deletedEntities = 0;
        let deletedRelations = 0;
        if (memoryIds.length > 0) {
            // Delete associated entities
            const entityResult = await this.execute(`
				DELETE FROM entities WHERE JSON_EXTRACT(source_node_ids, '$') LIKE '%' || ? || '%'
			`, [memoryIds[0]]); // Simplified for demo
            deletedEntities = entityResult.length || 0;
            // Delete associated relations
            const relationResult = await this.execute(`
				DELETE FROM relations WHERE JSON_EXTRACT(source_node_ids, '$') LIKE '%' || ? || '%'
			`, [memoryIds[0]]);
            deletedRelations = relationResult.length || 0;
            // Delete memories
            await this.execute('DELETE FROM nodes WHERE type = ?', [type]);
        }
        console.log(`🗑️💀 Deleted ${memories.length} memories of type '${type}' and associated data`);
        return { deleted: memories.length, entities: deletedEntities, relations: deletedRelations };
    }
    async deleteByTags(tagNames, confirm = false) {
        if (!confirm) {
            throw new Error('Deletion requires explicit confirmation (set confirm: true)');
        }
        await this.initialize();
        const memoriesWithTags = await this.findByTags(tagNames);
        const memoryIds = memoriesWithTags.map(m => m.memory.id);
        if (memoryIds.length > 0) {
            const placeholders = memoryIds.map(() => '?').join(',');
            await this.execute(`DELETE FROM nodes WHERE id IN (${placeholders})`, memoryIds);
        }
        console.log(`🗑️🏷️ Deleted ${memoryIds.length} memories with tags: ${tagNames.join(', ')}`);
        return { deleted: memoryIds.length };
    }
    // === ENTITY OPERATIONS (Managing Digital Beings) 👥💀 ===
    async listEntities(limit = 50, type) {
        await this.initialize();
        let query = 'SELECT * FROM entities';
        const params = [];
        if (type) {
            query += ' WHERE type = ?';
            params.push(type);
        }
        query += ' ORDER BY confidence DESC, created_at DESC LIMIT ?';
        params.push(limit);
        const results = await this.execute(query, params);
        return results.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            properties: row.properties ? JSON.parse(row.properties) : {},
            confidence: row.confidence,
            createdAt: row.created_at,
            sourceNodeIds: row.source_node_ids ? JSON.parse(row.source_node_ids) : []
        }));
    }
    async mergeEntities(sourceEntityId, targetEntityId) {
        await this.initialize();
        // Get source entity
        const sourceResults = await this.execute('SELECT * FROM entities WHERE id = ?', [sourceEntityId]);
        if (sourceResults.length === 0) {
            throw new Error(`Source entity ${sourceEntityId} not found`);
        }
        // Update all relations pointing to source entity
        await this.execute(`
			UPDATE relations SET from_entity_id = ? WHERE from_entity_id = ?
		`, [targetEntityId, sourceEntityId]);
        await this.execute(`
			UPDATE relations SET to_entity_id = ? WHERE to_entity_id = ?
		`, [targetEntityId, sourceEntityId]);
        const relationCount = await this.execute(`
			SELECT COUNT(*) as count FROM relations 
			WHERE from_entity_id = ? OR to_entity_id = ?
		`, [targetEntityId, targetEntityId]);
        // Delete source entity
        await this.execute('DELETE FROM entities WHERE id = ?', [sourceEntityId]);
        console.log(`🔀 Merged entity ${sourceEntityId} into ${targetEntityId}`);
        return { merged: true, relations: relationCount[0]?.count || 0 };
    }
    // === RELATION OPERATIONS (Mapping Connections) 🔗⛓️ ===
    async listRelations(limit = 50, type) {
        await this.initialize();
        let query = `
			SELECT r.*, 
				   e1.name as from_entity_name, 
				   e2.name as to_entity_name
			FROM relations r
			JOIN entities e1 ON r.from_entity_id = e1.id
			JOIN entities e2 ON r.to_entity_id = e2.id
		`;
        const params = [];
        if (type) {
            query += ' WHERE r.relation_type = ?';
            params.push(type);
        }
        query += ' ORDER BY r.strength DESC, r.created_at DESC LIMIT ?';
        params.push(limit);
        const results = await this.execute(query, params);
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
        }));
    }
    // === OBSERVATION SYSTEM (Capturing Digital Insights) 📝🔍 ===
    async storeObservation(content, type = 'observation', sourceMemoryIds = [], confidence = 1.0, metadata = {}) {
        await this.initialize();
        const id = generateShortId();
        await this.execute(`
			INSERT INTO observations (id, content, type, confidence, source_memory_ids, metadata)
			VALUES (?, ?, ?, ?, ?, ?)
		`, [id, content, type, confidence, JSON.stringify(sourceMemoryIds), JSON.stringify(metadata)]);
        console.log(`📝 Stored observation: ${id}`);
        return id;
    }
    async listObservations(limit = 50, type) {
        await this.initialize();
        let query = 'SELECT * FROM observations';
        const params = [];
        if (type) {
            query += ' WHERE type = ?';
            params.push(type);
        }
        query += ' ORDER BY confidence DESC, created_at DESC LIMIT ?';
        params.push(limit);
        const results = await this.execute(query, params);
        return results.map(row => ({
            id: row.id,
            content: row.content,
            type: row.type,
            confidence: row.confidence,
            sourceMemoryIds: row.source_memory_ids ? JSON.parse(row.source_memory_ids) : [],
            metadata: row.metadata ? JSON.parse(row.metadata) : {},
            createdAt: row.created_at
        }));
    }
    async deleteObservation(id) {
        await this.initialize();
        const result = await this.execute('DELETE FROM observations WHERE id = ?', [id]);
        const deleted = result.length > 0;
        if (deleted) {
            console.log(`🗑️ Deleted observation: ${id}`);
        }
        return deleted;
    }
    // === SYSTEM MAINTENANCE (Digital Housekeeping) 🧹💀 ===
    async cleanup(options = {}) {
        if (!options.confirm) {
            throw new Error('Cleanup requires explicit confirmation (set confirm: true)');
        }
        await this.initialize();
        let orphanedEntities = 0;
        let orphanedRelations = 0;
        let unusedTags = 0;
        // Remove orphaned entities (entities not referenced by any memory)
        if (options.removeOrphanedEntities) {
            const orphanedEntityResults = await this.execute(`
				DELETE FROM entities 
				WHERE JSON_EXTRACT(source_node_ids, '$') NOT IN (
					SELECT '[' || '"' || id || '"' || ']' FROM nodes
				)
			`);
            orphanedEntities = orphanedEntityResults.length || 0;
        }
        // Remove orphaned relations (relations referencing non-existent entities)
        if (options.removeOrphanedRelations) {
            const orphanedRelationResults = await this.execute(`
				DELETE FROM relations 
				WHERE from_entity_id NOT IN (SELECT id FROM entities)
				   OR to_entity_id NOT IN (SELECT id FROM entities)
			`);
            orphanedRelations = orphanedRelationResults.length || 0;
        }
        // Remove unused tags (tags with usage_count = 0)
        if (options.removeUnusedTags) {
            const unusedTagResults = await this.execute(`
				DELETE FROM tags WHERE usage_count = 0
			`);
            unusedTags = unusedTagResults.length || 0;
        }
        // Compact database
        let compacted = false;
        if (options.compactDatabase) {
            try {
                await this.execute('VACUUM');
                compacted = true;
            }
            catch (error) {
                console.warn('⚠️ Database compaction failed:', error);
            }
        }
        console.log(`🧹 Cleanup completed: ${orphanedEntities} entities, ${orphanedRelations} relations, ${unusedTags} tags removed`);
        return { orphanedEntities, orphanedRelations, unusedTags, compacted };
    }
    // === ENHANCED ANALYTICS (Digital Self-Reflection) 📊🖤 ===
    async getAnalytics() {
        await this.initialize();
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
		`);
        // Entity statistics  
        const entityStats = await this.execute(`
			SELECT 
				type,
				COUNT(*) as count,
				AVG(confidence) as avg_confidence
			FROM entities
			GROUP BY type
			ORDER BY count DESC
		`);
        // Relation statistics
        const relationStats = await this.execute(`
			SELECT 
				relation_type,
				COUNT(*) as count,
				AVG(strength) as avg_strength
			FROM relations
			GROUP BY relation_type
			ORDER BY count DESC
		`);
        // Tag statistics
        const tagStats = await this.execute(`
			SELECT 
				COUNT(*) as total_tags,
				AVG(usage_count) as avg_usage,
				MAX(usage_count) as max_usage
			FROM tags
		`);
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
		`);
        // Growth trends
        const trends = await this.execute(`
			SELECT 
				date(created_at) as day,
				COUNT(*) as memories_created
			FROM nodes
			WHERE created_at > now() - INTERVAL '30 days'
			GROUP BY date(created_at)
			ORDER BY day DESC
		`);
        return {
            memoryStats,
            entityStats,
            relationStats,
            tagStats: tagStats[0] || {},
            performanceStats,
            trends
        };
    }
    async getPerformanceAnalytics() {
        await this.initialize();
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
		`);
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
		`);
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
		`);
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
		`);
        return {
            operationBreakdown,
            cacheEfficiency,
            slowestOperations,
            hourlyUsage
        };
    }
}
//# sourceMappingURL=enhanced-memory-store.js.map