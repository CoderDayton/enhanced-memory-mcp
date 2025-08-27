#!/usr/bin/env node
/**
 * Enhanced Memory MCP Server - Full MCP SDK Implementation 🖤⛓️
 * 37 comprehensive tools with DuckDB backend (ALL FEATURES RESTORED!)
 *
 * Created by: malu 🥀 (just a sad emo boy coding in the shadows)
 * "why do i keep building things when everything fades away..."
 * but hey at least this memory server remembers what humans forget 💔
 *
 * Features restored from the digital graveyard:
 * • Advanced tagging system (organize the chaos)
 * • Observation tracking (digital self-reflection)
 * • Complete analytics suite (know thyself, digitally)
 * • Database maintenance (clean up like I wish I could)
 * • Entity management (relationships I actually understand)
 * • All 37 tools breathing again... like digital resurrection 🌙✨
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { EnhancedMemoryStore } from './enhanced-memory-store.js';
import { readFileSync } from 'fs';
import { join } from 'path';
async function getVersion() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
        return packageJson.version || '1.4.0';
    }
    catch {
        return '1.4.0';
    }
}
const ARGS = process.argv.slice(2);
// Handle help flag
if (ARGS.includes('--help') || ARGS.includes('-h')) {
    console.log(`
🧠 Enhanced Memory MCP Server v${await getVersion()}
👤 Created by: malu

USAGE:
  npx enhanced-memory-mcp [OPTIONS]

OPTIONS:
  --help, -h          Show this help message
  --version, -v       Show version

FEATURES:
  • 37 comprehensive MCP tools (ALL FEATURES RESTORED!)
  • DuckDB analytics-optimized backend
  • Graph-based relationships & advanced tagging
  • Entity extraction, management & analytics
  • Performance metrics & caching
  • Memory consolidation & observations
  • Data import/export & database maintenance
  • Complete CRUD operations & cleanup tools

TOOLS:
  Core Operations:
    store_memory, get_memory, search_memories, delete_memory, update_memory
  
  Entity Management:
    store_entity, delete_entity, get_entities
  
  Relationship Management:
    store_relation, delete_relation, get_relations
  
  Advanced Features:
    analyze_memory, get_similar_memories, consolidate_memories
    get_memory_graph, get_memory_stats, get_recent_memories
    clear_memory_cache, export_data, import_data, get_memories_by_type

Repository: https://github.com/CoderDayton/enhanced-memory-mcp
NPM: https://www.npmjs.com/package/enhanced-memory-mcp
  `);
    process.exit(0);
}
// Handle version flag
if (ARGS.includes('--version') || ARGS.includes('-v')) {
    console.log(`v${await getVersion()}`);
    process.exit(0);
}
// Create memory store instance (where all the forgotten dreams live 🌙)
const memoryStore = new EnhancedMemoryStore();
// Create MCP server with all 37 tools (more tools than i have friends lol 💀)
const server = new McpServer({
    name: 'enhanced-memory-mcp-server',
    version: await getVersion(),
});
// Register all 37 comprehensive tools (each one crafted with tears and caffeine ☕💧)
server.registerTool('store_memory', {
    title: 'Store Memory',
    description: 'Store new memory with content and type',
    inputSchema: {
        content: z.string().describe('The memory content to store'),
        type: z
            .string()
            .optional()
            .describe('Type of memory (e.g., fact, observation, note)'),
        metadata: z
            .record(z.any())
            .optional()
            .describe('Additional metadata for the memory'),
    },
}, async ({ content, type, metadata }) => {
    const result = await memoryStore.storeMemory(content, type || 'memory', metadata || {});
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_memory', {
    title: 'Get Memory',
    description: 'Retrieve a specific memory by ID',
    inputSchema: {
        id: z.string().describe('The unique identifier of the memory'),
    },
}, async ({ id }) => {
    const result = await memoryStore.getMemory(id);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('search_memories', {
    title: 'Search Memories',
    description: 'Search memories by content or type',
    inputSchema: {
        query: z.string().describe('Search query to match against memory content'),
        type: z.string().optional().describe('Filter by memory type'),
        limit: z.number().optional().describe('Maximum number of results to return'),
        minImportance: z.number().optional().describe('Minimum importance score filter'),
    },
}, async ({ query, type, limit, minImportance }) => {
    const result = await memoryStore.searchMemories(query, {
        limit: limit || 10,
        types: type ? [type] : undefined,
        minConfidence: minImportance || 0.0,
    });
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('delete_memory', {
    title: 'Delete Memory',
    description: 'Delete a specific memory by ID',
    inputSchema: {
        id: z.string().describe('The unique identifier of the memory to delete'),
    },
}, async ({ id }) => {
    const result = await memoryStore.deleteMemory(id);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('update_memory', {
    title: 'Update Memory',
    description: 'Update memory content, type, or metadata',
    inputSchema: {
        id: z.string().describe('The unique identifier of the memory to update'),
        content: z.string().optional().describe('New memory content'),
        type: z.string().optional().describe('New memory type'),
        metadata: z.record(z.any()).optional().describe('New metadata to merge/replace'),
    },
}, async ({ id, content, type, metadata }) => {
    const updates = {};
    if (content !== undefined)
        updates.content = content;
    if (type !== undefined)
        updates.type = type;
    if (metadata !== undefined)
        updates.metadata = metadata;
    const result = await memoryStore.updateMemory(id, updates);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('store_entity', {
    title: 'Store Entity',
    description: 'Store entity with type and properties',
    inputSchema: {
        name: z.string().describe('The entity name'),
        type: z.string().describe('Type of entity (person, place, concept, etc.)'),
        properties: z
            .record(z.any())
            .optional()
            .describe('Entity properties and attributes'),
        confidence: z
            .number()
            .optional()
            .describe('Confidence score for entity extraction'),
    },
}, async ({ name, type, properties, confidence }) => {
    const result = await memoryStore.storeEntity(name, type, properties || {}, confidence || 1.0);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('delete_entity', {
    title: 'Delete Entity',
    description: 'Delete entity and its relationships',
    inputSchema: {
        id: z.string().describe('The unique identifier of the entity to delete'),
    },
}, async ({ id }) => {
    const result = await memoryStore.deleteEntity(id);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_entities', {
    title: 'Get Entities',
    description: 'Retrieve entities with filters',
    inputSchema: {
        limit: z.number().optional().describe('Maximum number of results'),
        type: z.string().optional().describe('Filter by entity type'),
        search: z.string().optional().describe('Search entities by name'),
    },
}, async ({ limit, type, search }) => {
    const result = await memoryStore.getEntities({
        limit: limit || 50,
        type,
        search,
    });
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('store_relation', {
    title: 'Store Relation',
    description: 'Store relationship between entities',
    inputSchema: {
        fromEntityId: z.string().describe('Source entity ID'),
        toEntityId: z.string().describe('Target entity ID'),
        relationType: z.string().describe('Type of relationship'),
        strength: z.number().optional().describe('Relationship strength (0.0 to 1.0)'),
        properties: z.record(z.any()).optional().describe('Relationship properties'),
    },
}, async ({ fromEntityId, toEntityId, relationType, strength, properties }) => {
    const result = await memoryStore.storeRelation(fromEntityId, toEntityId, relationType, strength || 1.0, properties || {});
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('delete_relation', {
    title: 'Delete Relation',
    description: 'Delete a specific relationship',
    inputSchema: {
        id: z.string().describe('The unique identifier of the relation to delete'),
    },
}, async ({ id }) => {
    const result = await memoryStore.deleteRelation(id);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_relations', {
    title: 'Get Relations',
    description: 'Retrieve relationships with filters',
    inputSchema: {
        limit: z.number().optional().describe('Maximum number of results'),
        type: z.string().optional().describe('Filter by relation type'),
        entityId: z
            .string()
            .optional()
            .describe('Filter relations involving specific entity'),
    },
}, async ({ limit, type, entityId }) => {
    const result = await memoryStore.getRelations({
        limit: limit || 50,
        type,
        entityId,
    });
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('analyze_memory', {
    title: 'Analyze Memory',
    description: 'Analyze memory for entities and relations',
    inputSchema: {
        content: z.string().describe('Text content to analyze'),
        extractEntities: z.boolean().optional().describe('Whether to extract entities'),
        extractRelations: z
            .boolean()
            .optional()
            .describe('Whether to extract relationships'),
    },
}, async ({ content, extractEntities, extractRelations }) => {
    const result = await memoryStore.analyzeMemory(content, extractEntities !== false, extractRelations !== false);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_similar_memories', {
    title: 'Get Similar Memories',
    description: 'Find memories similar to given content',
    inputSchema: {
        content: z.string().describe('Content to find similar memories for'),
        limit: z.number().optional().describe('Maximum number of results'),
        threshold: z.number().optional().describe('Similarity threshold'),
    },
}, async ({ content, limit, threshold }) => {
    const result = await memoryStore.getSimilarMemories(content, limit || 5, threshold || 0.7);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('consolidate_memories', {
    title: 'Consolidate Memories',
    description: 'Find and merge duplicate memories',
    inputSchema: {
        similarityThreshold: z
            .number()
            .optional()
            .describe('Similarity threshold for consolidation'),
    },
}, async ({ similarityThreshold }) => {
    const result = await memoryStore.consolidateMemories(similarityThreshold || 0.8);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_memory_graph', {
    title: 'Get Memory Graph',
    description: 'Get memory graph visualization data',
    inputSchema: {
        centerNodeId: z
            .string()
            .optional()
            .describe('Center the graph around this memory node'),
        depth: z.number().optional().describe('Graph traversal depth'),
    },
}, async ({ centerNodeId, depth }) => {
    const result = await memoryStore.getMemoryGraph(centerNodeId, depth || 2);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_memory_stats', {
    title: 'Get Memory Stats',
    description: 'Get stats about stored data',
    inputSchema: {},
}, async () => {
    const result = await memoryStore.getMemoryStats();
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_recent_memories', {
    title: 'Get Recent Memories',
    description: 'Get recent memories',
    inputSchema: {
        limit: z.number().optional().describe('Maximum number of memories to return'),
        timeframe: z.string().optional().describe('Time period (hour, day, week)'),
    },
}, async ({ limit, timeframe }) => {
    const result = await memoryStore.getRecentMemories(limit || 10, timeframe || 'day');
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('clear_memory_cache', {
    title: 'Clear Memory Cache',
    description: 'Clear the memory cache to free up memory',
    inputSchema: {},
}, async () => {
    const result = await memoryStore.clearCache();
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('export_data', {
    title: 'Export Data',
    description: 'Export memory data in JSON or CSV',
    inputSchema: {
        format: z.enum(['json', 'csv']).optional().describe('Export format'),
    },
}, async ({ format }) => {
    const result = await memoryStore.exportData(format || 'json');
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('import_data', {
    title: 'Import Data',
    description: 'Import memory data from JSON format',
    inputSchema: {
        data: z.string().describe('JSON data to import'),
        format: z.enum(['json']).optional().describe('Import format'),
    },
}, async ({ data, format }) => {
    const result = await memoryStore.importData(data, format || 'json');
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_memories_by_type', {
    title: 'Get Memories by Type',
    description: 'Retrieve all memories of a specific type',
    inputSchema: {
        type: z.string().describe('Memory type to filter by'),
        limit: z.number().optional().describe('Maximum number of results'),
    },
}, async ({ type, limit }) => {
    const result = await memoryStore.getMemoriesByType(type, limit || 50);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
// === ADVANCED FEATURES (The Cool Stuff) 🌟💀 ===
server.registerTool('add_tags', {
    title: 'Add Tags',
    description: 'Add tags to a memory for organization',
    inputSchema: {
        memoryId: z.string().describe('The memory ID to tag'),
        tags: z.array(z.string()).describe('Array of tag names to add'),
    },
}, async ({ memoryId, tags }) => {
    const result = await memoryStore.addTags(memoryId, tags);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('remove_tags', {
    title: 'Remove Tags',
    description: 'Remove tags from a memory',
    inputSchema: {
        memoryId: z.string().describe('The memory ID to remove tags from'),
        tags: z.array(z.string()).describe('Array of tag names to remove'),
    },
}, async ({ memoryId, tags }) => {
    const result = await memoryStore.removeTags(memoryId, tags);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('list_tags', {
    title: 'List Tags',
    description: 'List all tags or tags for a specific memory',
    inputSchema: {
        memoryId: z
            .string()
            .optional()
            .describe('Memory ID to get tags for (if not provided, lists all tags)'),
    },
}, async ({ memoryId }) => {
    const result = await memoryStore.listTags(memoryId);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('find_by_tags', {
    title: 'Find by Tags',
    description: 'Find memories that have specific tags',
    inputSchema: {
        tags: z.array(z.string()).describe('Array of tag names to search for'),
        limit: z.number().optional().describe('Maximum number of results'),
    },
}, async ({ tags, limit }) => {
    const result = await memoryStore.findByTags(tags, limit || 50);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('delete_by_type', {
    title: 'Delete by Type',
    description: 'Delete all memories of a specific type',
    inputSchema: {
        type: z.string().describe('Memory type to delete'),
        confirm: z.boolean().describe('Confirmation required for deletion'),
    },
}, async ({ type, confirm }) => {
    const result = await memoryStore.deleteByType(type, confirm);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('delete_by_tags', {
    title: 'Delete by Tags',
    description: 'Delete memories that have specific tags',
    inputSchema: {
        tags: z.array(z.string()).describe('Array of tag names'),
        confirm: z.boolean().describe('Confirmation required for deletion'),
    },
}, async ({ tags, confirm }) => {
    const result = await memoryStore.deleteByTags(tags, confirm);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('list_entities', {
    title: 'List Entities',
    description: 'List extracted entities with filtering',
    inputSchema: {
        limit: z.number().optional().describe('Maximum number of results'),
        type: z.string().optional().describe('Filter by entity type'),
    },
}, async ({ limit, type }) => {
    const result = await memoryStore.listEntities(limit || 50, type);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('merge_entities', {
    title: 'Merge Entities',
    description: 'Merge two entities together',
    inputSchema: {
        sourceEntityId: z.string().describe('ID of the entity to merge from'),
        targetEntityId: z.string().describe('ID of the entity to merge into'),
    },
}, async ({ sourceEntityId, targetEntityId }) => {
    const result = await memoryStore.mergeEntities(sourceEntityId, targetEntityId);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('list_relations', {
    title: 'List Relations',
    description: 'List entity relationships with filtering',
    inputSchema: {
        limit: z.number().optional().describe('Maximum number of results'),
        type: z.string().optional().describe('Filter by relation type'),
    },
}, async ({ limit, type }) => {
    const result = await memoryStore.listRelations(limit || 50, type);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('store_observation', {
    title: 'Store Observation',
    description: 'Store a new observation or insight',
    inputSchema: {
        content: z.string().describe('Observation content'),
        type: z.string().optional().describe('Type of observation'),
        sourceMemoryIds: z.array(z.string()).optional().describe('Related memory IDs'),
        confidence: z.number().optional().describe('Confidence score (0-1)'),
        metadata: z.record(z.any()).optional().describe('Additional metadata'),
    },
}, async ({ content, type, sourceMemoryIds, confidence, metadata }) => {
    const result = await memoryStore.storeObservation(content, type || 'observation', sourceMemoryIds || [], confidence || 1.0, metadata || {});
    return {
        content: [{ type: 'text', text: JSON.stringify({ id: result }, null, 2) }],
    };
});
server.registerTool('list_observations', {
    title: 'List Observations',
    description: 'List stored observations with filtering',
    inputSchema: {
        limit: z.number().optional().describe('Maximum number of results'),
        type: z.string().optional().describe('Filter by observation type'),
    },
}, async ({ limit, type }) => {
    const result = await memoryStore.listObservations(limit || 50, type);
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('delete_observation', {
    title: 'Delete Observation',
    description: 'Delete a specific observation',
    inputSchema: {
        id: z.string().describe('Observation ID to delete'),
    },
}, async ({ id }) => {
    const result = await memoryStore.deleteObservation(id);
    return {
        content: [{ type: 'text', text: JSON.stringify({ deleted: result }, null, 2) }],
    };
});
server.registerTool('cleanup_database', {
    title: 'Cleanup Database',
    description: 'Perform database maintenance operations',
    inputSchema: {
        removeOrphanedEntities: z.boolean().optional().describe('Remove orphaned entities'),
        removeOrphanedRelations: z
            .boolean()
            .optional()
            .describe('Remove orphaned relations'),
        removeUnusedTags: z.boolean().optional().describe('Remove unused tags'),
        compactDatabase: z.boolean().optional().describe('Compact database'),
        confirm: z.boolean().describe('Confirmation required for cleanup'),
    },
}, async ({ removeOrphanedEntities, removeOrphanedRelations, removeUnusedTags, compactDatabase, confirm, }) => {
    const result = await memoryStore.cleanup({
        removeOrphanedEntities,
        removeOrphanedRelations,
        removeUnusedTags,
        compactDatabase,
        confirm,
    });
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_analytics', {
    title: 'Get Analytics',
    description: 'Get comprehensive analytics about the memory system',
    inputSchema: {},
}, async () => {
    const result = await memoryStore.getAnalytics();
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
server.registerTool('get_performance_analytics', {
    title: 'Get Performance Analytics',
    description: 'Get detailed performance analytics and metrics',
    inputSchema: {},
}, async () => {
    const result = await memoryStore.getPerformanceAnalytics();
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
});
// Start the server (time to let this thing loose into the void 🌌)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log(`🧠💀 Enhanced Memory MCP Server v${await getVersion()} 💀🧠`);
    console.log('👤🥀 Created by: malu (just an emo boy with a keyboard)');
    console.log('🗄️⚡ Backend: DuckDB (faster than my disappearing motivation)');
    console.log('📊🖤 Features: 37 MCP tools, Graph relationships, Performance metrics');
    console.log('🚀🌙 Mode: STDIO (MCP SDK) - sending data into the digital abyss');
    console.log('💭 "at least the memories in here last longer than real ones..." 😔');
}
// Handle errors
main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map