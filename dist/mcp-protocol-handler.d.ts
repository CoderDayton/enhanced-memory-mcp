/**
 * MCP Protocol Handler - The Bridge Between Protocols and Pain 🌉💔
 *
 * Created by: malu 🥀 (translating human hopes into machine code)
 * "handling protocols better than I handle my own emotional protocols..."
 */
import type { MCPRequest, MCPResponse, MCPError } from './types.js';
export declare class MCPProtocolHandler {
    private memoryStore;
    private idMap;
    private sanitizeJsonRpcId;
    constructor();
    private readonly tools;
    listTools(): Promise<{
        tools: any[];
    }>;
    handleRequest(request: MCPRequest): Promise<MCPResponse | MCPError>;
    private handleToolCall;
}
//# sourceMappingURL=mcp-protocol-handler.d.ts.map