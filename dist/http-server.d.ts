/**
 * HTTP Server Implementation - Express.js with MCP and RESTful API
 * Professional implementation with CORS, middleware, and comprehensive endpoints
 * Created by: malu
 */
import { Application } from 'express';
export declare class HTTPServer {
    private app;
    private server;
    private port;
    private protocolHandler;
    private memoryStore;
    constructor(port?: number);
    private setupMiddleware;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): Application;
}
//# sourceMappingURL=http-server.d.ts.map