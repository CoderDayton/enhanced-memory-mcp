# MCP Memory Server Enhanced - Changelog

## v1.1.0 (Enhanced) - Current

### 🚀 Major New Features
- **Automatic Entity Extraction**: Identifies key entities from text automatically
- **Relation Mining**: Extracts relationships between entities and concepts  
- **Observation Capture**: Identifies insights, conclusions, and important notes
- **Advanced Tagging System**: Full tag lifecycle with search and management
- **Smart Deletion**: Type-aware deletion with cascade and merge options
- **Graph Traversal**: Navigate relationships and find connected information

### 🛠️ New Tools (14 added)
- `delete_entity`, `delete_relation`, `delete_observation` - Type-specific deletion
- `delete_by_type`, `delete_by_tags` - Bulk deletion operations
- `list_entities`, `list_relations`, `list_observations` - Browse extracted data
- `merge_entities` - Combine duplicate entities intelligently
- `list_tags`, `add_tags`, `remove_tags`, `find_by_tags` - Tag management
- `cleanup` - Intelligent maintenance and pruning
- Enhanced `stats` and `health` - Detailed analytics

### 📊 Enhanced Capabilities
- **5 Node Types**: Memory, Entity, Relation, Observation, Tag
- **Confidence & Strength Tracking**: Quality-based filtering and ranking
- **Access Count Tracking**: Usage-based importance scoring
- **Soft Deletion with Recovery**: Safe deletion with rollback capability
- **Comprehensive Analytics**: Detailed breakdowns by type, usage, etc.
- **Performance Optimizations**: Better indexing and query performance

### 💾 Database Enhancements
- New node types with dedicated handling
- Enhanced indexes for performance
- Tag relationship tracking
- Comprehensive metadata storage
- Migration support for backward compatibility

### 📈 Performance Improvements
- Faster search with type filtering
- Optimized entity extraction algorithms
- Better memory management
- Enhanced caching strategies

## v1.0.0 (Original) - Previous

### Basic Features
- Simple memory storage and retrieval
- Basic search functionality
- Simple tagging
- REST API with 6 tools
- SQLite storage
- Basic graph relationships

---

**Upgrade Path**: v1.0.0 → v1.1.0 is seamless with automatic migration
