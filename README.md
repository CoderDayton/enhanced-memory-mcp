# 🧠 Enhanced Memory MCP Server

*Built with passion by **malu***

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

A **powerful, intelligent MCP (Model Context Protocol) server** that transforms how AI assistants store and retrieve memories. This isn't just another database - it's a **smart memory system** that understands relationships, extracts entities automatically, and helps you find exactly what you're looking for.

## ✨ What Makes This Special

I've crafted a memory system that goes **far beyond simple text storage**:

- **🧠 Smart Entity Extraction**: Automatically identifies people, places, and concepts
- **🔗 Relationship Mapping**: Discovers and tracks how things connect
- **🎯 Dual Protocol Support**: Both **stdio** and **HTTP** modes
- **🚀 Lightning Fast**: DuckDB backend optimized for analytics
- **🔍 Semantic Search**: Find memories by meaning, not just keywords
- **📊 Rich Analytics**: Deep insights into your memory patterns
- **⚡ Performance Monitoring**: Real-time metrics and caching
- **🛡️ Production Ready**: TypeScript, error handling, graceful shutdown

## 🚀 Quick Start

### NPM Installation (Recommended)
```bash
# Install and run directly
npx enhanced-memory-mcp --help
npx enhanced-memory-mcp --http          # HTTP mode
npx enhanced-memory-mcp                 # stdio mode
```

### Manual Setup
```bash
# Clone the repository
git clone https://github.com/CoderDayton/enhanced-memory-mcp.git
cd enhanced-memory-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start                # stdio mode (default)
npm run start:http       # HTTP mode
```

## 🛠️ Available Commands

### 🚀 **Core Server Commands**
- `npm run start` - Start server in stdio mode
- `npm run start:http` - Start HTTP server on port 3000
- `npm run dev:http` - Build and start HTTP server

### 🧪 **Testing & Performance**
- `npm run benchmark` - Run comprehensive performance tests
- `npm run test:perf` - Performance testing suite
- `npm run bench` - Quick HTTP load test

### 🔧 **Development**
- `npm run build` - Compile TypeScript to JavaScript
- `npm run lint` - Type checking
- `npm run clean` - Remove compiled files

## 🎯 MCP Tools (21 Available)

### **Core Memory Operations**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `add_memory` | Store memory with auto-extraction | `content`, `type`, `metadata` |
| `search_memories` | Smart semantic search | `query`, `limit`, `types` |
| `get_memory` | Retrieve specific memory | `node_id` |
| `delete_memory` | Remove memory safely | `node_id` |
| `get_memories_by_type` | Filter by type | `type`, `limit` |

### **Entity & Relationship Management**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `add_entity` | Create new entity | `label`, `type`, `properties` |
| `get_entities` | Search entities | `query`, `limit` |
| `delete_entity` | Remove entity | `entity_id` |
| `add_relation` | Create relationship | `source_id`, `target_id`, `type` |
| `get_relations` | Get relationships | `node_id` |
| `delete_relation` | Remove relationship | `relation_id` |

### **Advanced Features**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `add_tags` | Tag memories | `node_id`, `tags[]` |
| `list_tags` | List all tags | `node_id` |
| `remove_tags` | Remove tags | `node_id`, `tags[]` |
| `cleanup` | System maintenance | `confirm` |
| `get_analytics` | Performance insights | - |
| `get_performance_analytics` | Detailed metrics | - |
| `export_data` | Export all data | - |
| `import_data` | Import from file | - |

## 🌐 Usage Modes

### **Stdio Mode (Recommended for AI Assistants)**
Perfect for direct integration with AI tools like Copilot:
```bash
npm start
# or
npx enhanced-memory-mcp
```

### **HTTP Mode (Great for Web Integration)**
RESTful API with full MCP protocol support:
```bash
npm run start:http
# Server runs on http://localhost:3000
```

**Available Endpoints:**
- `GET /health` - Health check
- `POST /mcp` - MCP protocol endpoint
- `GET /api/memories` - List memories
- `POST /api/memories` - Create memory
- `GET /api/stats` - Server statistics

## 📊 Performance Features

### **DuckDB Backend**
- **Analytical Database**: Optimized for complex queries
- **Columnar Storage**: Efficient memory usage
- **ACID Compliance**: Data integrity guaranteed

### **Smart Caching**
- **Query Caching**: 5-minute expiry, 1000 entry limit
- **Performance Metrics**: Real-time operation tracking
- **Cache Hit Rates**: Monitored and optimized

### **Benchmarking Suite**
```bash
npm run benchmark
```
Includes tests for:
- Memory storage operations
- Search performance
- Mixed workload scenarios
- Performance grading with recommendations

## 🔧 Configuration

Copy `.env.example` to `.env` and customize:

```env
# Server Configuration
PORT=3000
HOST=localhost

# Database
DATABASE_PATH=data/memory.duckdb

# Performance
CACHE_SIZE=1000
CACHE_EXPIRY_MS=300000

# Security (HTTP mode)
CORS_ORIGIN=http://localhost:3000
API_KEY_REQUIRED=false
```

## 🏗️ Architecture

### **TypeScript + ES Modules**
- **Type Safety**: Full TypeScript coverage
- **Modern JavaScript**: ES2022 target
- **Clean Imports**: ESM with `.js` extensions

### **Dual Protocol Design**
- **Shared Core**: Same logic for both modes
- **Protocol Handlers**: Separate stdio/HTTP handlers
- **Graceful Shutdown**: Proper cleanup on exit

### **Performance Monitoring**
- **Operation Tracking**: Latency and count metrics
- **Cache Analytics**: Hit rates and efficiency
- **Resource Usage**: Memory and database stats

## 📈 Example Usage

### **Add Memory with Auto-Extraction**
```javascript
// Automatically extracts entities and relationships
await addMemory({
  content: "The UserService class implements JWT authentication",
  type: "code-insight",
  metadata: { project: "auth-service" }
})
```

### **Smart Search**
```javascript
// Semantic search across all memories
const results = await searchMemories({
  query: "authentication security patterns",
  limit: 10,
  types: ["code-insight", "documentation"]
})
```

### **Relationship Discovery**
```javascript
// Find connections between entities
const relations = await getRelations("user-service-entity-id")
// Returns: UserService -> IMPLEMENTS -> JWT, etc.
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** with `npm run benchmark`
5. **Submit** a pull request

## 📄 License

**MIT License** - See [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] **Vector Search**: Semantic similarity with embeddings
- [ ] **Graph Visualization**: Web-based relationship explorer
- [ ] **Advanced Analytics**: ML-powered insights
- [ ] **Multi-User Support**: Authentication and permissions
- [ ] **Plugin System**: Extensible tool architecture

---

**Built with ❤️ by malu** | [GitHub](https://github.com/CoderDayton/enhanced-memory-mcp) | [Issues](https://github.com/CoderDayton/enhanced-memory-mcp/issues)

*Transform your AI's memory with intelligence, relationships, and blazing-fast performance.* 🚀