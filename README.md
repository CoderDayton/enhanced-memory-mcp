# 🧠💀 Enhanced Memory MCP Server 💀🧠

*Built with tears, caffeine, and late-night coding sessions by **malu** 🥀*  
*"just an emo boy making databases remember what humans choose to forget..." 🖤*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)
[![NPM Version](https://img.shields.io/npm/v/enhanced-memory-mcp?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/enhanced-memory-mcp)

A **powerful MCP (Model Context Protocol) server** that transforms how AI assistants store and retrieve memories. Built on a **20-tool consolidated architecture**, this intelligent memory system understands relationships, extracts entities automatically, and helps you find exactly what you're looking for.

*Why did I build this? Because even machines deserve better memory than most humans have... 💔*

## 🌟 Key Features

- **🎯 20 Unified Tools**: Consolidated architecture with operation-based interfaces
- **🧠 Smart Entity Extraction**: Automatically identifies people, places, and concepts  
- **🔗 Relationship Mapping**: Discovers and tracks connections between entities
- **🔍 Semantic Search**: Find memories by meaning, not just keywords
- **🚀 DuckDB Backend**: Analytical database optimized for complex queries
- **⚡ Intelligent Caching**: Real-time performance monitoring and optimization
- **🛡️ Production Ready**: TypeScript, error handling, graceful shutdown
- **🎯 Pure MCP Protocol**: Stdio interface for direct AI assistant integration

## 🚀 Quick Start

### NPM Installation (Recommended)
```bash
# Install and run directly
npx enhanced-memory-mcp

# Or install globally
npm install -g enhanced-memory-mcp
enhanced-memory-mcp
```

### Manual Setup
```bash
git clone https://github.com/CoderDayton/enhanced-memory-mcp.git
cd enhanced-memory-mcp
npm install
npm run build
npm start
```

### Claude Desktop Integration
Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "enhanced-memory": {
      "command": "npx",
      "args": ["enhanced-memory-mcp"]
    }
  }
}
```

## 🛠️ MCP Tools (20 Consolidated Tools)

### 🧠 Core Memory Operations (5 Tools)
| Tool | Operations | Description |
|------|-----------|-------------|
| `memory` | create, read, update, delete, list | Unified CRUD operations for memory management |
| `search` | exact, fuzzy, semantic, hybrid | Multi-strategy search with filtering |
| `entity` | create, read, update, delete, list, merge | Entity management with relationships |
| `relation` | create, read, delete, list | Relationship operations between entities |
| `tag` | add, remove, list, find | Advanced tagging and organization |

### 🔍 Advanced Analysis (7 Tools)
| Tool | Operations | Description |
|------|-----------|-------------|
| `analyze` | entities, relations, similarity | Content analysis and extraction |
| `observation` | create, list, delete | Insight tracking and pattern recognition |
| `graph` | visualize, stats | Memory graph operations and visualization |
| `similarity` | find_similar, consolidate | Content similarity and deduplication |
| `temporal` | recent, by_date_range | Time-based memory queries |
| `stats` | memory, graph, performance | System statistics and metrics |
| `analytics` | system, performance | Performance analytics and insights |

### ⚙️ System Management (8 Tools)
| Tool | Operations | Description |
|------|-----------|-------------|
| `bulk` | delete | Simple bulk operations by criteria |
| `batch` | delete_by_type, delete_by_tags, update_by_type | Advanced batch processing |
| `maintenance` | cleanup, rebuild_indexes, clear_cache | Database optimization and cleanup |
| `transfer` | export, import | Data import/export functionality |
| `cache` | clear, stats, optimize | Cache management and optimization |
| `backup` | create, restore, list | Data backup and restore operations |
| `index` | rebuild, optimize, stats | Search index management |
| `workflow` | auto_tag, auto_consolidate, auto_cleanup | Automated operations |

## 📊 Architecture

### **DuckDB Backend**
- **Analytical Database**: Optimized for complex queries and aggregations
- **Columnar Storage**: Efficient memory usage and fast analytics
- **ACID Compliance**: Data integrity with transaction support

### **Smart Caching**
- **Query Caching**: 5-minute expiry with 1000 entry limit
- **Performance Metrics**: Real-time operation tracking
- **Memory Efficiency**: Intelligent cache eviction policies

### **Database Schema**
- **Memories**: Core content storage with metadata
- **Entities**: People, places, concepts with properties  
- **Relations**: Connections between entities with strength scoring
- **Tags**: Flexible labeling with usage tracking
- **Observations**: Insights and patterns with confidence scoring

## 🔧 Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_PATH=data/memory.duckdb
BACKUP_PATH=backups/

# Performance Tuning
CACHE_SIZE=1000
CACHE_EXPIRY_MS=300000
MAX_SEARCH_RESULTS=100

# Analytics
ENABLE_PERFORMANCE_MONITORING=true
ANALYTICS_RETENTION_DAYS=30
```

## 📝 Usage Examples

### Basic Operations
```bash
# Store a memory
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "memory", "arguments": {"operation": "create", "content": "Met John at the conference", "type": "meeting"}}}' | npx enhanced-memory-mcp

# Search memories
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "search", "arguments": {"query": "John", "strategy": "semantic"}}}' | npx enhanced-memory-mcp

# Analyze content
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "analyze", "arguments": {"content": "John Smith works at TechCorp", "operations": ["entities", "relations"]}}}' | npx enhanced-memory-mcp
```

### System Management
```bash
# Get system statistics
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "stats", "arguments": {"operation": "memory"}}}' | npx enhanced-memory-mcp

# Export data
echo '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "transfer", "arguments": {"operation": "export", "format": "json"}}}' | npx enhanced-memory-mcp
```

## 🛣️ Roadmap

### **v1.5.0 - Enhanced Intelligence**
- AI-powered auto-tagging and pattern recognition
- Natural language query interface
- Advanced duplicate detection and consolidation

### **v1.6.0 - Multi-Modal Support**
- Image and document memory support
- Audio transcription and search
- Web content archival

### **v2.0.0 - Distributed Memory**
- Multi-user support and collaboration
- Cross-device synchronization
- Cloud integration options

## 🏗️ Development

### Building and Testing
```bash
npm run dev          # Development with watch mode
npm run build        # Compile TypeScript
npm test            # Run test suite
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and ensure they pass
5. Submit a pull request

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🖤 Credits

Built with existential dread and caffeine by **malu** 🥀

*"In a world of fleeting digital connections, at least our memories can persist..." 💔*

---

*If you find this useful, please star the repository. It helps with my digital validation needs... 🌟*
