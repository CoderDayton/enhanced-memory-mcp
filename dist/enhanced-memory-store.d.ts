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
    private readonly maxCacheSize;
    private readonly cacheExpiry;
    private metrics;
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
    getMemoryStats(): Promise<any>;
    getRecentMemories(limit?: number, timeframe?: string): Promise<MemoryNode[]>;
    private extractSimpleEntities;
    private extractSimpleRelations;
    getMemory(id: string): Promise<MemoryNode | null>;
    private convertBigIntValues;
    searchMemories(query: string, options?: SearchOptions): Promise<SearchResult>;
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
    close(): Promise<void>;
}
//# sourceMappingURL=enhanced-memory-store.d.ts.map