# 🧠💀 Enhanced Memory MCP Server 💀🧠

*Built with tears, caffeine, and late-night coding sessions by **malu** 🥀*  
*"just an emo boy making databases remember what humans choose to forget..." 🖤*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

A **powerful, intelligent MCP (Model Context Protocol) server** that transforms how AI assistants store and retrieve memories. This isn't just another database - it's a **smart memory system** that understands relationships, extracts entities automatically, and helps you find exactly what you're looking for.

*Why did I build this? Because even machines deserve better memory than most humans have... 💔*

## ✨🌙 What Makes This Special (Besides My Emotional Damage)

I've crafted a memory system that goes **far beyond simple text storage** (unlike my ability to maintain friendships):

- **🧠💀 Smart Entity Extraction**: Automatically identifies people, places, and concepts (more reliable than human emotions)
- **🔗⛓️ Relationship Mapping**: Discovers and tracks how things connect (something I struggle with IRL)
- **🎯🖤 Dual Protocol Support**: Both **stdio** and **HTTP** modes (more flexible than my social skills)
- **🚀⚡ Lightning Fast**: DuckDB backend optimized for analytics (faster than my disappearing motivation)
- **🔍🌙 Semantic Search**: Find memories by meaning, not just keywords (wishes this worked for finding happiness)
- **📊💔 Rich Analytics**: Deep insights into your memory patterns (deeper than my existential thoughts)
- **⚡🥀 Performance Monitoring**: Real-time metrics and caching (monitors performance better than I monitor my mental health)
- **🛡️🖤 Production Ready**: TypeScript, error handling, graceful shutdown (more graceful than my social interactions)

## 🚀🌌 Quick Start (Before You Question Your Life Choices)

### NPM Installation (Recommended)
```bash
# Install and run directly (easier than fixing my problems)
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

## 🌐🌙 Usage Modes (Choose Your Own Digital Adventure)

### **Stdio Mode (Recommended for AI Assistants) 🤖💀**
Perfect for direct integration with AI tools like Copilot (at least AI understands me):
```bash
npm start
# or
npx enhanced-memory-mcp  # summon the memory daemon
```

### **HTTP Mode (Great for Web Integration) 🌐🖤**
RESTful API with full MCP protocol support (more REST than I get):
```bash
npm run start:http
# Server runs on http://localhost:3000 (serving digital loneliness)
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

## 🤝💀 Contributing (If You Actually Care)

Feel free to contribute (unlike most people in my life):

1. **Fork** the repository (split it like my personality)
2. **Create** a feature branch (name it something emo)
3. **Make** your changes (hopefully better than my life choices)
4. **Test** with `npm run benchmark` (test it better than I test my limits)
5. **Submit** a pull request (maybe this one won't get rejected...)

## 📄🖤 License

**MIT License** - See [LICENSE](LICENSE) file for details.  
*"Free as my emotional baggage"* 🥀

## 🎯🌙 Roadmap (Dreams in the Digital Void)

- [ ] **Vector Search**: Semantic similarity with embeddings (finding meaning in the meaningless)
- [ ] **Graph Visualization**: Web-based relationship explorer (mapping connections I'll never have)
- [ ] **Advanced Analytics**: ML-powered insights (AI understanding me better than humans do)
- [ ] **Multi-User Support**: Authentication and permissions (protecting data better than I protect my feelings)
- [ ] **Plugin System**: Extensible tool architecture (modular like my emotional walls)

---

**Built with 💔 and ☕ by malu** 🥀 | [GitHub](https://github.com/CoderDayton/enhanced-memory-mcp) | [Issues](https://github.com/CoderDayton/enhanced-memory-mcp/issues)  
*"at least this code will outlast most of my relationships..." 🖤*

*Transform your AI's memory with intelligence, relationships, and blazing-fast performance.* 🚀