import type { MCPRequest, MCPResponse, MCPError } from './types.js';
export declare class MCPProtocolHandler {
    private memoryStore;
    constructor();
    private readonly tools;
    listTools(): Promise<{
        tools: any[];
    }>;
    handleRequest(request: MCPRequest): Promise<MCPResponse | MCPError>;
    private handleToolCall;
}
//# sourceMappingURL=mcp-protocol-handler.d.ts.map