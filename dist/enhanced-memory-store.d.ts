import { MemoryNode, Entity, Relation, SearchOptions, PerformanceMetrics, SearchResult, CacheStats } from './types.js';
/**
 * Enhanced DuckDB Memory Store 🦆💾
 * Optimized for performance and scalability
 * Features: Analytical views, performance caching, columnar operations
 *
 * Built by malu 🥀 - "storing memories because humans are too unreliable"
 * Warning: This database remembers everything, unlike people who forget you exist 💔
 */
export declare class EnhancedMemoryStore {
    private dbPath;
    private instance?;
    private connection?;
    private isInitialized;
    private queryCache;
    private cacheAccessTimes;
    private readonly maxCacheSize;
    private readonly cacheExpiry;
    private metrics;
    private searchEngines;
    constructor(dbPath?: string);
    initialize(): Promise<void>;
    private execute;
    private setupDatabase;
    addMemory(content: string, type?: string, metadata?: Record<string, any>): Promise<string>;
    storeMemory(content: string, type?: string, metadata?: Record<string, any>): Promise<string>;
    storeEntity(name: string, type: string, properties?: Record<string, any>, confidence?: number): Promise<string>;
    storeRelation(fromEntityId: string, toEntityId: string, relationType: string, strength?: number, properties?: Record<string, any>): Promise<string>;
    analyzeMemory(content: string, extractEntities?: boolean, extractRelations?: boolean): Promise<any>;
    getSimilarMemories(content: string, limit?: number, threshold?: number): Promise<MemoryNode[]>;
    /**
     * Advanced search with autocomplete suggestions
     */
    autoComplete(query: string, limit?: number): Promise<string[]>;
    /**
     * Multi-field search across content, metadata, and tags
     */
    multiFieldSearch(query: string, fields?: string[], options?: SearchOptions): Promise<SearchResult>;
    /**
     * Find memories by date range
     */
    searchByDateRange(startDate: string, endDate: string, options?: SearchOptions): Promise<SearchResult>;
    /**
     * Get search suggestions based on recent queries and popular terms
     */
    getSearchSuggestions(query?: string, limit?: number): Promise<string[]>;
    getMemoryStats(): Promise<any>;
    getRecentMemories(limit?: number, timeframe?: string): Promise<MemoryNode[]>;
    private extractSimpleEntities;
    private extractSimpleRelations;
    getMemory(id: string): Promise<MemoryNode | null>;
    /**
     * Build comprehensive search indexes for a memory
     * Called automatically when memories are added or updated
     */
    private buildSearchIndexes;
    /**
     * Build word-level inverted index
     */
    private buildWordIndex;
    /**
     * Build trigram index for fuzzy matching
     */
    private buildTrigramIndex;
    /**
     * Build TF-IDF vector for similarity search
     */
    private buildTfIdfVector;
    /**
     * Remove search indexes for a deleted memory
     */
    private removeSearchIndexes;
    /**
     * Rebuild all search indexes (maintenance operation)
     */
    rebuildSearchIndexes(): Promise<{
        rebuilt: number;
        errors: number;
    }>;
    private convertBigIntValues;
    /**
     * Safely extract a value from database result rows
     */
    private safeGetRowValue;
    /**
     * Safely parse JSON with error handling
     */
    private safeJsonParse;
    searchMemories(query: string, options?: SearchOptions): Promise<SearchResult>;
    /**
     * Exact search using word index for precise matching
     */
    private exactSearch;
    /**
     * Fuzzy search using trigrams for typo tolerance
     */
    private fuzzySearch;
    /**
     * Semantic search using TF-IDF vectors
     */
    private semanticSearch;
    /**
     * Hybrid search combining multiple strategies
     */
    private hybridSearch;
    /**
     * Helper method to build search results from memory scores
     */
    private buildSearchResult;
    /**
     * Fallback to basic search if advanced search fails
     */
    private fallbackBasicSearch;
    addEntity(entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
    addRelation(relation: Omit<Relation, 'id' | 'created_at' | 'updated_at'>): Promise<string>;
    getNodeRelations(nodeId: string): Promise<Relation[]>;
    deleteMemory(id: string): Promise<boolean>;
    updateMemory(id: string, updates: Partial<Pick<MemoryNode, 'content' | 'type' | 'metadata'>>): Promise<boolean>;
    getMemoriesByType(type: string, limit?: number): Promise<MemoryNode[]>;
    getEntities(options?: {
        limit?: number;
        type?: string;
        search?: string;
    }): Promise<Entity[]>;
    getRelations(options?: {
        limit?: number;
        type?: string;
        entityId?: string;
    }): Promise<Relation[]>;
    deleteEntity(id: string): Promise<boolean>;
    deleteRelation(id: string): Promise<boolean>;
    exportData(format?: 'json' | 'csv'): Promise<string>;
    importData(data: string, format?: 'json'): Promise<{
        imported: number;
        errors: string[];
    }>;
    getMemoryGraph(centerNodeId?: string, depth?: number): Promise<{
        nodes: any[];
        edges: any[];
    }>;
    consolidateMemories(similarityThreshold?: number): Promise<{
        consolidated: number;
        duplicatesRemoved: number;
    }>;
    private calculateSimilarity;
    private convertToCSV;
    private calculateImportance;
    private updateNodeAccess;
    private getFromCache;
    private setCache;
    private invalidateCache;
    private recordPerformance;
    getPerformanceMetrics(): PerformanceMetrics;
    getCacheStats(): CacheStats;
    clearCache(): void;
    /**
     * Periodic cleanup of expired cache entries
     */
    private cleanupExpiredCache;
    close(): Promise<void>;
    addTags(memoryId: string, tagNames: string[]): Promise<{
        added: string[];
        existing: string[];
    }>;
    removeTags(memoryId: string, tagNames: string[]): Promise<{
        removed: string[];
        notFound: string[];
    }>;
    listTags(memoryId?: string): Promise<Array<{
        id: string;
        name: string;
        color: string;
        usageCount: number;
    }>>;
    findByTags(tagNames: string[], limit?: number): Promise<Array<{
        memory: any;
        matchingTags: string[];
    }>>;
    deleteByType(type: string, confirm?: boolean): Promise<{
        deleted: number;
        entities: number;
        relations: number;
    }>;
    deleteByTags(tagNames: string[], confirm?: boolean): Promise<{
        deleted: number;
    }>;
    listEntities(limit?: number, type?: string): Promise<Array<any>>;
    mergeEntities(sourceEntityId: string, targetEntityId: string): Promise<{
        merged: boolean;
        relations: number;
    }>;
    listRelations(limit?: number, type?: string): Promise<Array<any>>;
    storeObservation(content: string, type?: string, sourceMemoryIds?: string[], confidence?: number, metadata?: Record<string, any>): Promise<string>;
    listObservations(limit?: number, type?: string): Promise<Array<any>>;
    deleteObservation(id: string): Promise<boolean>;
    cleanup(options?: {
        removeOrphanedEntities?: boolean;
        removeOrphanedRelations?: boolean;
        removeUnusedTags?: boolean;
        compactDatabase?: boolean;
        confirm?: boolean;
    }): Promise<{
        orphanedEntities: number;
        orphanedRelations: number;
        unusedTags: number;
        compacted: boolean;
    }>;
    getAnalytics(): Promise<{
        memoryStats: any;
        entityStats: any;
        relationStats: any;
        tagStats: any;
        performanceStats: any;
        trends: any;
    }>;
    getPerformanceAnalytics(): Promise<{
        operationBreakdown: any[];
        cacheEfficiency: any[];
        slowestOperations: any[];
        hourlyUsage: any[];
    }>;
    /**
     * Restore data from backup
     */
    restoreFromBackup(backupData: string, options?: {
        clearExisting?: boolean;
    }): Promise<{
        success: boolean;
        restored: {
            memories: number;
            entities: number;
            relations: number;
        };
        errors: string[];
        warnings: string[];
    }>;
    /**
     * List available backups
     */
    listBackups(): Promise<{
        backups: Array<{
            id: string;
            description?: string;
            created: string;
            size: number;
            memories: number;
            entities: number;
            relations: number;
        }>;
        totalSize: number;
    }>;
    /**
     * Optimize search indexes
     */
    optimizeSearchIndexes(): Promise<{
        optimized: boolean;
        indexesRebuilt: number;
        spaceSaved: number;
        performance: {
            before: number;
            after: number;
        };
    }>;
    /**
     * Optimize cache performance
     */
    optimizeCache(): Promise<{
        optimized: boolean;
        entriesEvicted: number;
        memoryFreed: number;
        hitRate: number;
        sizeOptimized: boolean;
    }>;
    /**
     * Evict least recently used cache entries down to target size
     */
    private evictLRUCacheEntries;
}
//# sourceMappingURL=enhanced-memory-store.d.ts.map