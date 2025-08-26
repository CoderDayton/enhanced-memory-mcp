/**
 * HTTP Server Implementation - Express.js with MCP and RESTful API
 * Professional implementation with CORS, middleware, and comprehensive endpoints
 * Created by: malu
 */
import express from 'express';
// @ts-ignore
import cors from 'cors';
import { MCPProtocolHandler } from './mcp-protocol-handler.js';
import { EnhancedMemoryStore } from './enhanced-memory-store.js';
export class HTTPServer {
    app;
    server;
    port;
    protocolHandler;
    memoryStore;
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.memoryStore = new EnhancedMemoryStore();
        this.protocolHandler = new MCPProtocolHandler();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // CORS configuration
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }));
        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                server: 'Enhanced Memory MCP Server',
                version: '1.1.1',
                author: 'malu'
            });
        });
        // MCP Protocol endpoint (JSON-RPC over HTTP)
        this.app.post('/mcp', async (req, res) => {
            try {
                const mcpRequest = req.body;
                const response = await this.protocolHandler.handleRequest(mcpRequest);
                res.json(response);
            }
            catch (error) {
                console.error('❌ MCP endpoint error:', error);
                res.status(500).json({
                    jsonrpc: '2.0',
                    id: req.body?.id || null,
                    error: {
                        code: -32603,
                        message: error instanceof Error ? error.message : 'Internal error'
                    }
                });
            }
        });
        // RESTful API endpoints for direct HTTP access
        // Memory endpoints
        this.app.get('/api/memories', async (req, res) => {
            try {
                const limit = req.query.limit ? Number(req.query.limit) : undefined;
                const type = req.query.type;
                let memories;
                if (type) {
                    memories = await this.memoryStore.getMemoriesByType(type, limit);
                }
                else {
                    memories = await this.memoryStore.getRecentMemories(limit);
                }
                res.json({
                    success: true,
                    data: memories,
                    count: Array.isArray(memories) ? memories.length : 0
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.app.post('/api/memories', async (req, res) => {
            try {
                const { content, type, metadata } = req.body;
                if (!content) {
                    return res.status(400).json({ success: false, error: 'Content is required' });
                }
                const id = await this.memoryStore.addMemory(content, type, metadata);
                res.status(201).json({
                    success: true,
                    data: { id, content, type, metadata },
                    message: 'Memory created successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.app.get('/api/memories/:id', async (req, res) => {
            try {
                const memory = await this.memoryStore.getMemory(req.params.id);
                if (!memory) {
                    return res.status(404).json({ success: false, error: 'Memory not found' });
                }
                res.json({ success: true, data: memory });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.app.put('/api/memories/:id', async (req, res) => {
            try {
                const updates = req.body;
                const success = await this.memoryStore.updateMemory(req.params.id, updates);
                if (!success) {
                    return res.status(404).json({ success: false, error: 'Memory not found' });
                }
                res.json({
                    success: true,
                    message: 'Memory updated successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.app.delete('/api/memories/:id', async (req, res) => {
            try {
                const success = await this.memoryStore.deleteMemory(req.params.id);
                if (!success) {
                    return res.status(404).json({ success: false, error: 'Memory not found' });
                }
                res.json({
                    success: true,
                    message: 'Memory deleted successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Search endpoint
        this.app.post('/api/search', async (req, res) => {
            try {
                const { query, limit } = req.body;
                if (!query) {
                    return res.status(400).json({ success: false, error: 'Query is required' });
                }
                const results = await this.memoryStore.searchMemories(query, limit);
                res.json({
                    success: true,
                    data: results,
                    count: Array.isArray(results?.nodes) ? results.nodes.length : 0
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Entity endpoints
        this.app.get('/api/entities', async (req, res) => {
            try {
                const options = {
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                    type: req.query.type,
                    search: req.query.search
                };
                const entities = await this.memoryStore.getEntities(options);
                res.json({
                    success: true,
                    data: entities,
                    count: Array.isArray(entities) ? entities.length : 0
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.app.post('/api/entities', async (req, res) => {
            try {
                const { name, type, properties } = req.body;
                if (!name || !type) {
                    return res.status(400).json({ success: false, error: 'Name and type are required' });
                }
                const id = await this.memoryStore.addEntity({ name, type, properties: properties || {} });
                res.status(201).json({
                    success: true,
                    data: { id, name, type, properties },
                    message: 'Entity created successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Relations endpoints
        this.app.get('/api/relations', async (req, res) => {
            try {
                const options = {
                    limit: req.query.limit ? Number(req.query.limit) : undefined,
                    type: req.query.type,
                    entityId: req.query.entityId
                };
                const relations = await this.memoryStore.getRelations(options);
                res.json({
                    success: true,
                    data: relations,
                    count: Array.isArray(relations) ? relations.length : 0
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        this.app.post('/api/relations', async (req, res) => {
            try {
                const { from_entity_id, to_entity_id, relation_type } = req.body;
                if (!from_entity_id || !to_entity_id || !relation_type) {
                    return res.status(400).json({
                        success: false,
                        error: 'from_entity_id, to_entity_id, and relation_type are required'
                    });
                }
                const id = await this.memoryStore.addRelation({ from_entity_id, to_entity_id, relation_type });
                res.status(201).json({
                    success: true,
                    data: { id, from_entity_id, to_entity_id, relation_type },
                    message: 'Relation created successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Statistics endpoint
        this.app.get('/api/stats', async (req, res) => {
            try {
                const stats = await this.memoryStore.getMemoryStats();
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Export endpoint
        this.app.get('/api/export', async (req, res) => {
            try {
                const format = req.query.format || 'json';
                const exportFormat = format === 'csv' ? 'csv' : 'json';
                const data = await this.memoryStore.exportData(exportFormat);
                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `memory-export-${timestamp}.${format}`;
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
                res.send(data);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Import endpoint
        this.app.post('/api/import', async (req, res) => {
            try {
                const { data, format } = req.body;
                if (!data) {
                    return res.status(400).json({ success: false, error: 'Data is required' });
                }
                const result = await this.memoryStore.importData(data, format || 'json');
                res.json({
                    success: true,
                    data: result,
                    message: 'Data imported successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Memory graph endpoint
        this.app.get('/api/graph', async (req, res) => {
            try {
                const centerNodeId = req.query.centerNodeId;
                const depth = req.query.depth ? Number(req.query.depth) : undefined;
                const graph = await this.memoryStore.getMemoryGraph(centerNodeId, depth);
                res.json({
                    success: true,
                    data: graph
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Cache management endpoint
        this.app.post('/api/cache/clear', async (req, res) => {
            try {
                const result = await this.memoryStore.clearCache();
                res.json({
                    success: true,
                    data: result,
                    message: 'Cache cleared successfully'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Error handling middleware
        this.app.use((error, req, res, next) => {
            console.error('❌ Unhandled error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        });
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                path: req.path,
                method: req.method
            });
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`🌐 HTTP Server running on http://localhost:${this.port}`);
                console.log(`📖 API Documentation:`);
                console.log(`   Health Check: GET /health`);
                console.log(`   MCP Protocol: POST /mcp`);
                console.log(`   REST API: /api/memories, /api/entities, /api/relations`);
                console.log(`   Statistics: GET /api/stats`);
                console.log(`   Export: GET /api/export?format=json|csv`);
                resolve();
            }).on('error', reject);
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 HTTP Server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    getApp() {
        return this.app;
    }
}
//# sourceMappingURL=http-server.js.map