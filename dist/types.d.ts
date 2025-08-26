export interface MemoryNode {
    id: string;
    content: string;
    type?: string;
    created_at?: string;
    updated_at?: string;
    metadata?: Record<string, any>;
    importance_score?: number;
    access_count?: number;
    last_accessed?: string;
}
export interface Entity {
    id: string;
    name: string;
    type: string;
    properties?: Record<string, any>;
    confidence?: number;
    created_at?: string;
    updated_at?: string;
    source_node_ids?: string[];
}
export interface Relation {
    id: string;
    from_entity_id: string;
    to_entity_id: string;
    relation_type: string;
    strength?: number;
    properties?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
    source_node_ids?: string[];
}
export interface Observation extends MemoryNode {
    type: 'Observation';
    subject_id?: string;
    observation_type: string;
}
export interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}
export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
}
export interface MCPError {
    jsonrpc: '2.0';
    id: string | number;
    error: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface SearchOptions {
    limit?: number;
    minConfidence?: number;
    types?: string[];
    privacy?: string[];
    tags?: string[];
    includeDeleted?: boolean;
}
export interface SearchResult {
    nodes: MemoryNode[];
    total_count: number;
    query_time_ms: number;
}
export interface McpResponse<T = any> {
    content: Array<{
        type: 'text';
        text: string;
    }>;
}
export interface ToolResult<T = any> extends Record<string, any> {
    tool: string;
    timing_ms: number;
    timestamp: string;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    server: string;
    version: string;
    author: string;
    timestamp: string;
    database_status: 'connected' | 'disconnected';
    memory_usage: {
        used: number;
        total: number;
        percentage: number;
    };
    performance: {
        average_response_time_ms: number;
        requests_per_second: number;
    };
}
export interface StoreStats {
    total_memories: number;
    total_entities: number;
    total_relations: number;
    total_observations: number;
    total_tags: number;
    database_size_mb: number;
    cache_hit_ratio: number;
}
export interface CacheEntry<T = any> {
    data: T;
    expiry: number;
}
export interface BatchOperation {
    type: 'insert' | 'update' | 'delete';
    table: string;
    data: any;
}
export interface ServerConfig {
    port: number;
    host: string;
    dbPath: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    cacheSize: number;
    enableMetrics: boolean;
}
export interface SearchResultItem {
    id: string;
    content: string;
    type: string;
    created_at: string;
    metadata: Record<string, any>;
    score: number;
    importance_score: number;
}
export interface DbNode {
    id: string;
    content: string;
    type: string;
    created_at: string;
    updated_at: string;
    metadata: string;
    embedding_vector?: string;
    importance_score?: number;
    access_count?: number;
    last_accessed?: string;
}
export interface DbEntity {
    id: string;
    name: string;
    type: string;
    properties: string;
    confidence: number;
    created_at: string;
    updated_at: string;
    source_node_ids: string;
}
export interface DbRelation {
    id: string;
    from_entity_id: string;
    to_entity_id: string;
    relation_type: string;
    strength: number;
    properties: string;
    created_at: string;
    updated_at: string;
    source_node_ids: string;
}
export interface PerformanceMetrics {
    operationCounts: Record<string, number>;
    averageLatencies: Record<string, number>;
    cacheHitRates: Record<string, {
        hits: number;
        total: number;
    }>;
    lastReset: Date;
}
export interface CacheStats {
    size: number;
    maxSize: number;
    hitRates: Record<string, {
        hits: number;
        total: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map