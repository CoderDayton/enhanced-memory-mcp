# 🧠💀 Enhanced Memory MCP Server 💀🧠

*Built with tears, caffeine, and late-night coding sessions by **malu** 🥀*  
*"just an emo boy making databases remember what humans choose to forget..." 🖤*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)](https://duckdb.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

A **powerful, intelligent MCP (Model Context Protocol) server** that transforms how AI assistants store and retrieve memories. This isn't just another database - it's a **smart memory system** that understands relationships, extracts entities automatically, and helps you find exactly what you're looking for — now stripped to pure MCP stdio (no legacy HTTP drift, just protocol and vibes).

*Why did I build this? Because even machines deserve better memory than most humans have... 💔*

## ✨🌙 What Makes This Special (Besides My Emotional Damage)

I've crafted a memory system that goes **far beyond simple text storage** (unlike my ability to maintain friendships):

- **🧠💀 Smart Entity Extraction**: Automatically identifies people, places, and concepts (more reliable than human emotions)
- **🔗⛓️ Relationship Mapping**: Discovers and tracks how things connect (something I struggle with IRL)
- **🎯🖤 Pure MCP stdio**: Legacy HTTP mode removed in v1.3.0 (one protocol to rule the void)
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
npx enhanced-memory-mcp                 # stdio mode (the one true path)
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
```

## 🛠️ Available Commands

### 🚀 **Core Server Commands**
All operations now use the official MCP SDK server (`mcp-server.ts`). Legacy HTTP/dual-mode code was deleted in v1.3.0 like an archived message thread.
- `npm run start` - Start MCP stdio server
- `npx enhanced-memory-mcp` - Run directly via npx (summons the melancholic daemon)

### 🧪 **Testing & Performance**
- `npm run benchmark` - Run comprehensive performance tests
- `npm run test:perf` - Performance testing suite
- `npm run bench` - Quick HTTP load test

### 🔧 **Development**
- `npm run build` - Compile TypeScript to JavaScript
- `npm run lint` - Type checking
## 🎯 MCP Tools (37 Available, All Advanced Features Restored!)

### **Core Memory Operations**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `store_memory` | Store memory (content + type) | `content`, `type`, `metadata` |
| `get_memory` | Get specific memory | `id` |
| `search_memories` | Smart semantic search | `query`, `limit`, `types` |
| `update_memory` | Update existing memory | `id`, `content`, `type`, `metadata` |
| `delete_memory` | Delete specific memory | `id` |
| `get_memories_by_type` | Get memories by type | `type`, `limit` |

### **Entity & Relationship Management**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `store_entity` | Create new entity | `name`, `type`, `properties` |
| `get_entities` | Search entities | `search`, `limit`, `type` |
| `list_entities` | List entities with filtering | `limit`, `type` |
| `merge_entities` | Merge two entities | `sourceEntityId`, `targetEntityId` |
| `store_relation` | Create relationship | `fromEntityId`, `toEntityId`, `relationType` |
| `get_relations` | Get relationships | `entityId`, `type`, `limit` |
| `list_relations` | List relations with filtering | `limit`, `type` |

### **Advanced Tagging System 🏷️💀**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `add_tags` | Add tags to memory | `memoryId`, `tags` |
| `remove_tags` | Remove tags from memory | `memoryId`, `tags` |
| `list_tags` | List all/memory tags | `memoryId` (optional) |
| `find_by_tags` | Find memories by tags | `tags`, `limit` |

### **Observation & Analytics System 📊🖤**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `store_observation` | Store insights/observations | `content`, `type`, `sourceMemoryIds` |
| `list_observations` | List observations | `limit`, `type` |
| `delete_observation` | Delete observation | `id` |
| `get_analytics` | Comprehensive analytics | None |
| `get_performance_analytics` | Performance metrics | None |

### **Advanced Operations & Maintenance 🔧⚡**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `delete_by_type` | Delete all memories by type | `type`, `confirm` |
| `delete_by_tags` | Delete memories by tags | `tags`, `confirm` |
| `cleanup_database` | Database maintenance | `confirm`, cleanup options |
| `get_similar_memories` | Find similar content | `content`, `threshold`, `limit` |
| `consolidate_memories` | Merge duplicates | `similarityThreshold` |
| `analyze_memory` | Extract entities/relations | `content`, extract options |

### **System & Performance Tools 📈💾**
| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `get_memory_stats` | System statistics | None |
| `get_memory_graph` | Graph visualization data | `centerNodeId`, `depth` |
| `get_recent_memories` | Recent activity | `limit`, `timeframe` |
| `clear_memory_cache` | Clear cache | None |
| `export_data` | Export to JSON/CSV | `format` |
| `import_data` | Import from JSON | `data`, `format` |

### **Features Fully Restored! ✅🌟**
All advanced features including tagging, analytics, observations, and comprehensive database operations are now available. The digital void is complete once again...

## 🌐🌙 Usage Modes (Choose Your Own Digital Adventure)

### **Stdio Mode (Recommended for AI Assistants) 🤖💀**
Perfect for direct integration with AI tools like Copilot (at least AI understands me):
```bash
npm start
# or
npx enhanced-memory-mcp  # summon the memory daemon
```

### **HTTP Mode (Removed) 🌐�**
The earlier experimental HTTP wrapper was deprecated and removed to eliminate divergence from the MCP reference behavior and to avoid ID length issues. If you need HTTP again, open an issue and we can add a thin, spec-compliant adapter.

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
