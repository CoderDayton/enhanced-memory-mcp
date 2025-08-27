#!/usr/bin/env node
/**
 * Enhanced Memory MCP Server - Consolidated Tool Implementation
 * 20 optimized tools (reduced from 42) with unified interfaces
 */
// Add BigInt serialization support
BigInt.prototype.toJSON = function () { return Number(this); };
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { EnhancedMemoryStore } from './enhanced-memory-store.js';
const memoryStore = new EnhancedMemoryStore();
const server = new McpServer({
    name: 'enhanced-memory-mcp-server-consolidated',
    version: '2.0.0',
});
// === CORE MEMORY OPERATIONS ===
server.registerTool('memory', {
    title: 'Memory Operations',
    description: 'Unified CRUD operations for memory management',
    inputSchema: {
        operation: z.enum(['create', 'read', 'update', 'delete', 'list']),
        id: z.string().optional(),
        content: z.string().optional(),
        type: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        filters: z.object({
            type: z.string().optional(),
            limit: z.number().default(50).optional(),
            timeframe: z.enum(['hour', 'day', 'week']).optional(),
        }).optional(),
    },
}, async ({ operation, id, content, type, metadata, filters }) => {
    let result;
    switch (operation) {
        case 'create':
            if (!content)
                throw new Error('Content required for create operation');
            result = await memoryStore.storeMemory(content, type || 'memory', metadata || {});
            break;
        case 'read':
            if (!id)
                throw new Error('ID required for read operation');
            result = await memoryStore.getMemory(id);
            break;
        case 'update':
            if (!id)
                throw new Error('ID required for update operation');
            const updates = {};
            if (content !== undefined)
                updates.content = content;
            if (type !== undefined)
                updates.type = type;
            if (metadata !== undefined)
                updates.metadata = metadata;
            result = await memoryStore.updateMemory(id, updates);
            break;
        case 'delete':
            if (!id)
                throw new Error('ID required for delete operation');
            result = await memoryStore.deleteMemory(id);
            break;
        case 'list':
            if (filters?.type) {
                result = await memoryStore.getMemoriesByType(filters.type, filters.limit);
            }
            else if (filters?.timeframe) {
                result = await memoryStore.getRecentMemories(filters.limit, filters.timeframe);
            }
            else {
                // Default list operation
                result = await memoryStore.getRecentMemories(filters?.limit || 50, 'day');
            }
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('search', {
    title: 'Advanced Search',
    description: 'Multi-strategy search with autocomplete and filtering',
    inputSchema: {
        query: z.string(),
        strategy: z.enum(['exact', 'fuzzy', 'semantic', 'hybrid']).default('hybrid').optional(),
        fields: z.array(z.enum(['content', 'metadata', 'tags'])).default(['content']).optional(),
        filters: z.object({
            type: z.string().optional(),
            limit: z.number().default(10).optional(),
            minImportance: z.number().default(0.0).optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }).optional(),
        suggestions: z.boolean().default(false).optional(),
    },
}, async ({ query, strategy, fields, filters, suggestions }) => {
    let result;
    if (suggestions) {
        result = await memoryStore.autoComplete(query, filters?.limit || 10);
    }
    else if (filters?.startDate && filters?.endDate) {
        result = await memoryStore.searchByDateRange(filters.startDate, filters.endDate, { limit: filters.limit });
    }
    else if (fields && fields.length > 1) {
        result = await memoryStore.multiFieldSearch(query, fields, { limit: filters?.limit || 10 });
    }
    else {
        result = await memoryStore.searchMemories(query, {
            searchType: strategy,
            limit: filters?.limit,
            minImportance: filters?.minImportance,
            types: filters?.type ? [filters.type] : undefined,
        });
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('entity', {
    title: 'Entity Management',
    description: 'Unified entity operations with relationship handling',
    inputSchema: {
        operation: z.enum(['create', 'read', 'update', 'delete', 'list', 'merge']),
        id: z.string().optional(),
        name: z.string().optional(),
        type: z.string().optional(),
        properties: z.record(z.any()).optional(),
        confidence: z.number().default(1.0).optional(),
        filters: z.object({
            type: z.string().optional(),
            search: z.string().optional(),
            limit: z.number().default(50).optional(),
        }).optional(),
        mergeTarget: z.string().optional(),
    },
}, async ({ operation, id, name, type, properties, confidence, filters, mergeTarget }) => {
    let result;
    switch (operation) {
        case 'create':
            if (!name || !type)
                throw new Error('Name and type required for create operation');
            result = await memoryStore.storeEntity(name, type, properties || {}, confidence);
            break;
        case 'read':
        case 'list':
            result = await memoryStore.getEntities({
                limit: filters?.limit,
                type: filters?.type,
                search: filters?.search,
            });
            break;
        case 'delete':
            if (!id)
                throw new Error('ID required for delete operation');
            result = await memoryStore.deleteEntity(id);
            break;
        case 'merge':
            if (!id || !mergeTarget)
                throw new Error('ID and mergeTarget required for merge operation');
            result = await memoryStore.mergeEntities(id, mergeTarget);
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('relation', {
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
        filters: z.object({
            type: z.string().optional(),
            entityId: z.string().optional(),
            limit: z.number().default(50).optional(),
        }).optional(),
    },
}, async ({ operation, id, fromEntityId, toEntityId, relationType, strength, properties, filters }) => {
    let result;
    switch (operation) {
        case 'create':
            if (!fromEntityId || !toEntityId || !relationType) {
                throw new Error('fromEntityId, toEntityId, and relationType required for create operation');
            }
            result = await memoryStore.storeRelation(fromEntityId, toEntityId, relationType, strength, properties || {});
            break;
        case 'read':
        case 'list':
            result = await memoryStore.getRelations({
                limit: filters?.limit,
                type: filters?.type,
                entityId: filters?.entityId,
            });
            break;
        case 'delete':
            if (!id)
                throw new Error('ID required for delete operation');
            result = await memoryStore.deleteRelation(id);
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('tag', {
    title: 'Tag Management',
    description: 'Unified tagging operations',
    inputSchema: {
        operation: z.enum(['add', 'remove', 'list', 'find']),
        memoryId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        filters: z.object({
            limit: z.number().default(50).optional(),
        }).optional(),
    },
}, async ({ operation, memoryId, tags, filters }) => {
    let result;
    switch (operation) {
        case 'add':
            if (!memoryId || !tags)
                throw new Error('memoryId and tags required for add operation');
            result = await memoryStore.addTags(memoryId, tags);
            break;
        case 'remove':
            if (!memoryId || !tags)
                throw new Error('memoryId and tags required for remove operation');
            result = await memoryStore.removeTags(memoryId, tags);
            break;
        case 'list':
            result = await memoryStore.listTags(memoryId);
            break;
        case 'find':
            if (!tags)
                throw new Error('tags required for find operation');
            result = await memoryStore.findByTags(tags, filters?.limit);
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
// === ADVANCED ANALYSIS OPERATIONS ===
server.registerTool('analyze', {
    title: 'Content Analysis',
    description: 'Multi-modal content analysis',
    inputSchema: {
        content: z.string(),
        operations: z.array(z.enum(['entities', 'relations', 'similarity', 'consolidation'])).default(['entities', 'relations']).optional(),
        options: z.object({
            similarityThreshold: z.number().default(0.7).optional(),
            consolidationThreshold: z.number().default(0.8).optional(),
            limit: z.number().default(5).optional(),
        }).optional(),
    },
}, async ({ content, operations, options }) => {
    const result = {};
    const ops = operations || ['entities', 'relations'];
    for (const operation of ops) {
        switch (operation) {
            case 'entities':
            case 'relations':
                const analysis = await memoryStore.analyzeMemory(content, ops.includes('entities'), ops.includes('relations'));
                Object.assign(result, analysis);
                break;
            case 'similarity':
                result.similarMemories = await memoryStore.getSimilarMemories(content, options?.limit || 5, options?.similarityThreshold || 0.7);
                break;
            case 'consolidation':
                result.consolidationCandidates = await memoryStore.consolidateMemories(options?.consolidationThreshold || 0.8);
                break;
        }
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('observation', {
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
        filters: z.object({
            type: z.string().optional(),
            limit: z.number().default(50).optional(),
        }).optional(),
    },
}, async ({ operation, id, content, type, sourceMemoryIds, confidence, metadata, filters }) => {
    let result;
    switch (operation) {
        case 'create':
            if (!content)
                throw new Error('Content required for create operation');
            result = await memoryStore.storeObservation(content, type || 'observation', sourceMemoryIds || [], confidence, metadata || {});
            break;
        case 'list':
            result = await memoryStore.listObservations(filters?.limit, filters?.type);
            break;
        case 'delete':
            if (!id)
                throw new Error('ID required for delete operation');
            result = await memoryStore.deleteObservation(id);
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('graph', {
    title: 'Memory Graph Operations',
    description: 'Graph visualization and traversal',
    inputSchema: {
        operation: z.enum(['visualize', 'stats']),
        centerNodeId: z.string().optional(),
        depth: z.number().default(2).optional(),
    },
}, async ({ operation, centerNodeId, depth }) => {
    let result;
    switch (operation) {
        case 'visualize':
            result = await memoryStore.getMemoryGraph(centerNodeId, depth);
            break;
        case 'stats':
            result = await memoryStore.getMemoryStats();
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
// === DATA MANAGEMENT OPERATIONS ===
server.registerTool('bulk', {
    title: 'Bulk Operations',
    description: 'Batch operations for efficiency',
    inputSchema: {
        operation: z.enum(['delete']),
        target: z.enum(['type', 'tags']),
        value: z.union([z.string(), z.array(z.string())]),
        confirm: z.boolean().default(false),
    },
}, async ({ operation, target, value, confirm }) => {
    let result;
    if (operation === 'delete') {
        if (target === 'type') {
            result = await memoryStore.deleteByType(value, confirm);
        }
        else if (target === 'tags') {
            const tags = Array.isArray(value) ? value : [value];
            result = await memoryStore.deleteByTags(tags, confirm);
        }
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('maintenance', {
    title: 'System Maintenance',
    description: 'Database optimization and cleanup',
    inputSchema: {
        operation: z.enum(['cleanup', 'rebuild_indexes', 'clear_cache']),
        options: z.object({
            removeOrphanedEntities: z.boolean().default(false).optional(),
            removeOrphanedRelations: z.boolean().default(false).optional(),
            removeUnusedTags: z.boolean().default(false).optional(),
            compactDatabase: z.boolean().default(false).optional(),
            confirm: z.boolean().default(false).optional(),
        }).optional(),
    },
}, async ({ operation, options }) => {
    let result;
    switch (operation) {
        case 'cleanup':
            result = await memoryStore.cleanup(options || {});
            break;
        case 'rebuild_indexes':
            await memoryStore.initialize();
            result = await memoryStore.rebuildSearchIndexes();
            break;
        case 'clear_cache':
            result = await memoryStore.clearCache();
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('transfer', {
    title: 'Data Import/Export',
    description: 'Data portability operations',
    inputSchema: {
        operation: z.enum(['export', 'import']),
        format: z.enum(['json', 'csv']).default('json').optional(),
        data: z.string().optional(),
    },
}, async ({ operation, format, data }) => {
    let result;
    switch (operation) {
        case 'export':
            result = await memoryStore.exportData(format || 'json');
            break;
        case 'import':
            if (!data)
                throw new Error('Data required for import operation');
            if (format === 'csv')
                throw new Error('CSV import not supported, use JSON');
            result = await memoryStore.importData(data, 'json');
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('analytics', {
    title: 'Performance Analytics',
    description: 'System insights and metrics',
    inputSchema: {
        scope: z.enum(['system', 'performance']),
    },
}, async ({ scope }) => {
    let result;
    switch (scope) {
        case 'system':
            result = await memoryStore.getAnalytics();
            break;
        case 'performance':
            result = await memoryStore.getPerformanceAnalytics();
            break;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('🧠 Enhanced Memory MCP Server v2.0.0 (Consolidated)');
    console.log('📊 Tools: 20 optimized tools (reduced from 42)');
    console.log('🚀 Mode: STDIO (MCP SDK)');
}
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server-consolidated.js.map