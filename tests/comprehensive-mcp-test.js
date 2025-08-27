#!/usr/bin/env node

/**
 * Comprehensive MCP Test Suite - Testing All 20 Consolidated Tools 🧪💀
 * 
 * Tests the Enhanced Memory MCP Server by sending real MCP requests
 * and validating responses for all available tools.
 * 
 * Built by: malu 🥀 (testing like my patience - thoroughly and with tears)
 * "if my code has to work perfectly, at least my tests will too..." 😔
 */

import { spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'

class MCPTester {
	constructor() {
		this.serverProcess = null
		this.testResults = []
		this.testCount = 0
		this.passCount = 0
		this.failCount = 0
		this.createdIds = {
			memories: [],
			entities: [],
			relations: [],
			observations: [],
			tags: []
		}
	}

	log(message, type = 'info') {
		const timestamp = new Date().toISOString()
		const emoji = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'skip' ? '⏭️' : '🔍'
		console.log(`${emoji} [${timestamp}] ${message}`)
	}

	async sendMCPRequest(method, params = {}) {
		return new Promise((resolve, reject) => {
			const requestId = Math.floor(Math.random() * 1000000)
			const request = {
				jsonrpc: '2.0',
				id: requestId,
				method,
				...(Object.keys(params).length > 0 && { params })
			}

			// Start server process for this request
			const serverProcess = spawn('node', ['dist/mcp-server.js'], {
				cwd: process.cwd(),
				stdio: ['pipe', 'pipe', 'pipe']
			})

			let responseData = ''
			let errorData = ''

			// Set up response handling
			serverProcess.stdout.on('data', (data) => {
				const output = data.toString()
				// Look for JSON-RPC response (starts with {)
				const lines = output.split('\n')
				for (const line of lines) {
					if (line.trim().startsWith('{') && line.includes(`"id":${requestId}`)) {
						responseData = line.trim()
					}
				}
			})

			serverProcess.stderr.on('data', (data) => {
				errorData += data.toString()
			})

			// Send request
			serverProcess.stdin.write(JSON.stringify(request) + '\n')

			// Wait for response or timeout
			const timeout = setTimeout(() => {
				serverProcess.kill()
				reject(new Error(`Timeout waiting for response to ${method}`))
			}, 10000)

			serverProcess.on('close', () => {
				clearTimeout(timeout)
				
				if (responseData) {
					try {
						const response = JSON.parse(responseData)
						resolve(response)
					} catch (e) {
						reject(new Error(`Invalid JSON response: ${responseData}`))
					}
				} else {
					reject(new Error(`No response received. Error: ${errorData}`))
				}
			})

			serverProcess.on('error', (error) => {
				clearTimeout(timeout)
				reject(error)
			})
		})
	}

	async runTest(testName, testFn) {
		this.testCount++
		this.log(`Running test: ${testName}`)
		
		try {
			const result = await testFn()
			this.passCount++
			this.log(`PASS: ${testName}`, 'pass')
			this.testResults.push({ name: testName, status: 'PASS', result })
			return result
		} catch (error) {
			this.failCount++
			this.log(`FAIL: ${testName} - ${error.message}`, 'fail')
			this.testResults.push({ name: testName, status: 'FAIL', error: error.message })
			throw error
		}
	}

	async testListTools() {
		return this.runTest('List Tools', async () => {
			const response = await this.sendMCPRequest('tools/list')
			
			if (!response.result || !response.result.tools) {
				throw new Error('No tools returned')
			}

			const tools = response.result.tools
			if (tools.length !== 20) {
				throw new Error(`Expected 20 tools, got ${tools.length}`)
			}

			// Verify essential tools exist
			const toolNames = tools.map(t => t.name)
			const expectedTools = [
				'store_memory', 'get_memory', 'search_memories', 'delete_memory', 'update_memory',
				'store_entity', 'get_entities', 'list_entities', 'merge_entities',
				'store_relation', 'get_relations', 'list_relations',
				'add_tags', 'remove_tags', 'list_tags', 'find_by_tags',
				'store_observation', 'list_observations', 'delete_observation',
				'get_analytics', 'get_performance_analytics', 'cleanup_database'
			]

			for (const expectedTool of expectedTools) {
				if (!toolNames.includes(expectedTool)) {
					throw new Error(`Missing expected tool: ${expectedTool}`)
				}
			}

			return { toolCount: tools.length, tools: toolNames }
		})
	}

	async testMemoryOperations() {
		// Test store_memory
		const memoryId = await this.runTest('Store Memory', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'store_memory',
				arguments: {
					content: 'This is a comprehensive test memory for the MCP test suite',
					type: 'test-memory',
					metadata: { test: true, created_by: 'mcp_test_suite' }
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No memory ID returned')
			}

			const memoryId = JSON.parse(response.result.content[0].text)
			if (typeof memoryId !== 'string' || memoryId.length < 10) {
				throw new Error('Invalid memory ID format')
			}

			this.createdIds.memories.push(memoryId)
			return memoryId
		})

		// Test get_memory
		await this.runTest('Get Memory', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_memory',
				arguments: { id: memoryId }
			})

			if (!response.result || !response.result.content) {
				throw new Error('No memory content returned')
			}

			const memory = JSON.parse(response.result.content[0].text)
			if (memory.id !== memoryId) {
				throw new Error('Retrieved memory ID does not match')
			}

			return memory
		})

		// Test search_memories
		await this.runTest('Search Memories', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'search_memories',
				arguments: {
					query: 'comprehensive test',
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No search results returned')
			}

			const results = JSON.parse(response.result.content[0].text)
			if (!Array.isArray(results) || results.length === 0) {
				throw new Error('Search should return results')
			}

			return results
		})

		// Test update_memory
		await this.runTest('Update Memory', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'update_memory',
				arguments: {
					id: memoryId,
					content: 'Updated comprehensive test memory for the MCP test suite',
					metadata: { test: true, updated_by: 'mcp_test_suite', updated: true }
				}
			})

			if (!response.result || response.result.isError) {
				throw new Error('Memory update failed')
			}

			return true
		})

		// Test get_memories_by_type
		await this.runTest('Get Memories by Type', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_memories_by_type',
				arguments: {
					type: 'test-memory',
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No memories returned for type')
			}

			const memories = JSON.parse(response.result.content[0].text)
			if (!Array.isArray(memories) || memories.length === 0) {
				throw new Error('Should return memories of specified type')
			}

			return memories
		})

		return memoryId
	}

	async testEntityOperations() {
		// Test store_entity
		const entityId = await this.runTest('Store Entity', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'store_entity',
				arguments: {
					name: 'Test Entity',
					type: 'test-type',
					properties: { test: true, category: 'testing' },
					confidence: 0.95
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No entity ID returned')
			}

			const entityId = JSON.parse(response.result.content[0].text)
			this.createdIds.entities.push(entityId)
			return entityId
		})

		// Test get_entities
		await this.runTest('Get Entities', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_entities',
				arguments: {
					search: 'Test Entity',
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No entities returned')
			}

			const entities = JSON.parse(response.result.content[0].text)
			return entities
		})

		// Test list_entities
		await this.runTest('List Entities', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'list_entities',
				arguments: {
					type: 'test-type',
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No entities list returned')
			}

			const entities = JSON.parse(response.result.content[0].text)
			return entities
		})

		return entityId
	}

	async testRelationOperations(entityId) {
		// Create second entity for relation
		const entity2Id = await this.runTest('Store Second Entity for Relations', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'store_entity',
				arguments: {
					name: 'Related Test Entity',
					type: 'test-type',
					properties: { test: true, category: 'related' },
					confidence: 0.9
				}
			})

			const entityId = JSON.parse(response.result.content[0].text)
			this.createdIds.entities.push(entityId)
			return entityId
		})

		// Test store_relation
		const relationId = await this.runTest('Store Relation', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'store_relation',
				arguments: {
					fromEntityId: entityId,
					toEntityId: entity2Id,
					relationType: 'test-relation',
					strength: 0.85,
					properties: { test: true, relationship: 'testing' }
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No relation ID returned')
			}

			const relationId = JSON.parse(response.result.content[0].text)
			this.createdIds.relations.push(relationId)
			return relationId
		})

		// Test get_relations
		await this.runTest('Get Relations', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_relations',
				arguments: {
					entityId: entityId,
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No relations returned')
			}

			const relations = JSON.parse(response.result.content[0].text)
			return relations
		})

		// Test list_relations
		await this.runTest('List Relations', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'list_relations',
				arguments: {
					type: 'test-relation',
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No relations list returned')
			}

			const relations = JSON.parse(response.result.content[0].text)
			return relations
		})

		return { relationId, entity2Id }
	}

	async testTagOperations(memoryId) {
		// Test add_tags
		await this.runTest('Add Tags', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'add_tags',
				arguments: {
					memoryId: memoryId,
					tags: ['test-tag', 'mcp-suite', 'comprehensive']
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No tag result returned')
			}

			const result = JSON.parse(response.result.content[0].text)
			if (!result.added || result.added.length === 0) {
				throw new Error('No tags were added')
			}

			return result
		})

		// Test list_tags
		await this.runTest('List Tags for Memory', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'list_tags',
				arguments: {
					memoryId: memoryId
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No tags returned')
			}

			const tags = JSON.parse(response.result.content[0].text)
			if (!Array.isArray(tags) || tags.length === 0) {
				throw new Error('Should return tags for memory')
			}

			return tags
		})

		// Test find_by_tags
		await this.runTest('Find by Tags', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'find_by_tags',
				arguments: {
					tags: ['test-tag'],
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No memories found by tags')
			}

			const memories = JSON.parse(response.result.content[0].text)
			if (!Array.isArray(memories) || memories.length === 0) {
				throw new Error('Should find memories with specified tags')
			}

			return memories
		})

		// Test list_tags (all)
		await this.runTest('List All Tags', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'list_tags',
				arguments: {}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No tags list returned')
			}

			const tags = JSON.parse(response.result.content[0].text)
			return tags
		})
	}

	async testObservationOperations() {
		// Test store_observation
		const observationId = await this.runTest('Store Observation', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'store_observation',
				arguments: {
					content: 'Test observation for comprehensive MCP testing',
					type: 'test-observation',
					sourceMemoryIds: this.createdIds.memories,
					confidence: 0.9,
					metadata: { test: true, observation_type: 'testing' }
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No observation ID returned')
			}

			const result = JSON.parse(response.result.content[0].text)
			const observationId = result.id
			this.createdIds.observations.push(observationId)
			return observationId
		})

		// Test list_observations
		await this.runTest('List Observations', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'list_observations',
				arguments: {
					type: 'test-observation',
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No observations returned')
			}

			const observations = JSON.parse(response.result.content[0].text)
			if (!Array.isArray(observations) || observations.length === 0) {
				throw new Error('Should return observations')
			}

			return observations
		})

		return observationId
	}

	async testAnalyticsOperations() {
		// Test get_memory_stats
		await this.runTest('Get Memory Stats', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_memory_stats',
				arguments: {}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No memory stats returned')
			}

			const stats = JSON.parse(response.result.content[0].text)
			if (typeof stats.memories !== 'number' || stats.memories < 0) {
				throw new Error('Invalid memory stats format')
			}

			return stats
		})

		// Test get_analytics
		await this.runTest('Get Analytics', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_analytics',
				arguments: {}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No analytics returned')
			}

			const analytics = JSON.parse(response.result.content[0].text)
			return analytics
		})

		// Test get_performance_analytics
		await this.runTest('Get Performance Analytics', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_performance_analytics',
				arguments: {}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No performance analytics returned')
			}

			const perfAnalytics = JSON.parse(response.result.content[0].text)
			return perfAnalytics
		})
	}

	async testAdvancedOperations() {
		// Test get_similar_memories
		await this.runTest('Get Similar Memories', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_similar_memories',
				arguments: {
					content: 'comprehensive test memory',
					threshold: 0.5,
					limit: 10
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No similar memories returned')
			}

			const memories = JSON.parse(response.result.content[0].text)
			return memories
		})

		// Test analyze_memory
		await this.runTest('Analyze Memory', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'analyze_memory',
				arguments: {
					content: 'John Smith works at TechCorp and knows Jane Doe who is a developer',
					extractEntities: true,
					extractRelations: true
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No analysis result returned')
			}

			const analysis = JSON.parse(response.result.content[0].text)
			return analysis
		})

		// Test get_memory_graph
		await this.runTest('Get Memory Graph', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_memory_graph',
				arguments: {
					depth: 2
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No memory graph returned')
			}

			const graph = JSON.parse(response.result.content[0].text)
			return graph
		})

		// Test get_recent_memories
		await this.runTest('Get Recent Memories', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'get_recent_memories',
				arguments: {
					limit: 10,
					timeframe: 'day'
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No recent memories returned')
			}

			const memories = JSON.parse(response.result.content[0].text)
			return memories
		})
	}

	async testDataOperations() {
		// Test export_data
		await this.runTest('Export Data', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'export_data',
				arguments: {
					format: 'json'
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No export data returned')
			}

			const exportData = JSON.parse(response.result.content[0].text)
			return exportData
		})

		// Test clear_memory_cache
		await this.runTest('Clear Memory Cache', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'clear_memory_cache',
				arguments: {}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No cache clear result returned')
			}

			return true
		})

		// Test consolidate_memories
		await this.runTest('Consolidate Memories', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'consolidate_memories',
				arguments: {
					similarityThreshold: 0.8
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No consolidation result returned')
			}

			const result = JSON.parse(response.result.content[0].text)
			return result
		})
	}

	async testCleanupOperations() {
		// Test remove_tags first
		if (this.createdIds.memories.length > 0) {
			await this.runTest('Remove Tags', async () => {
				const response = await this.sendMCPRequest('tools/call', {
					name: 'remove_tags',
					arguments: {
						memoryId: this.createdIds.memories[0],
						tags: ['test-tag']
					}
				})

				if (!response.result || !response.result.content) {
					throw new Error('No tag removal result returned')
				}

				const result = JSON.parse(response.result.content[0].text)
				return result
			})
		}

		// Test delete_observation
		if (this.createdIds.observations.length > 0) {
			await this.runTest('Delete Observation', async () => {
				const response = await this.sendMCPRequest('tools/call', {
					name: 'delete_observation',
					arguments: {
						id: this.createdIds.observations[0]
					}
				})

				if (!response.result || !response.result.content) {
					throw new Error('No delete observation result returned')
				}

				const result = JSON.parse(response.result.content[0].text)
				return result
			})
		}

		// Test delete_entity (this will clean up relations too)
		if (this.createdIds.entities.length > 0) {
			await this.runTest('Delete Entity', async () => {
				const response = await this.sendMCPRequest('tools/call', {
					name: 'delete_entity',
					arguments: {
						id: this.createdIds.entities[0]
					}
				})

				if (!response.result || !response.result.content) {
					throw new Error('No delete entity result returned')
				}

				const result = JSON.parse(response.result.content[0].text)
				return result
			})
		}

		// Test delete_memory
		if (this.createdIds.memories.length > 0) {
			await this.runTest('Delete Memory', async () => {
				const response = await this.sendMCPRequest('tools/call', {
					name: 'delete_memory',
					arguments: {
						id: this.createdIds.memories[0]
					}
				})

				if (!response.result || !response.result.content) {
					throw new Error('No delete memory result returned')
				}

				const result = JSON.parse(response.result.content[0].text)
				return result
			})
		}

		// Test cleanup_database
		await this.runTest('Cleanup Database', async () => {
			const response = await this.sendMCPRequest('tools/call', {
				name: 'cleanup_database',
				arguments: {
					removeOrphanedEntities: true,
					removeOrphanedRelations: true,
					removeUnusedTags: true,
					compactDatabase: true,
					confirm: true
				}
			})

			if (!response.result || !response.result.content) {
				throw new Error('No cleanup result returned')
			}

			const result = JSON.parse(response.result.content[0].text)
			return result
		})
	}

	async runAllTests() {
		this.log('🚀 Starting Comprehensive MCP Test Suite', 'info')
		this.log('Testing all 20 consolidated MCP tools with real requests...', 'info')

		// Ensure server is built
		this.log('Building server...', 'info')
		try {
			const { execSync } = await import('child_process')
			execSync('npm run build', { cwd: process.cwd(), stdio: 'inherit' })
		} catch (error) {
			throw new Error(`Build failed: ${error.message}`)
		}

		const startTime = Date.now()

		try {
			// Test Categories (order matters for dependencies)
			await this.testListTools()
			
			const memoryId = await this.testMemoryOperations()
			const entityId = await this.testEntityOperations()
			const { relationId } = await this.testRelationOperations(entityId)
			
			await this.testTagOperations(memoryId)
			await this.testObservationOperations()
			await this.testAnalyticsOperations()
			await this.testAdvancedOperations()
			await this.testDataOperations()
			
			// Cleanup last (deletes test data)
			await this.testCleanupOperations()

		} catch (error) {
			this.log(`Test suite failed: ${error.message}`, 'fail')
		}

		const endTime = Date.now()
		const duration = (endTime - startTime) / 1000

		// Generate test report
		this.generateReport(duration)
	}

	generateReport(duration) {
		this.log('\n' + '='.repeat(60), 'info')
		this.log('🧪💀 COMPREHENSIVE MCP TEST RESULTS 💀🧪', 'info')
		this.log('='.repeat(60), 'info')
		
		this.log(`Total Tests: ${this.testCount}`, 'info')
		this.log(`Passed: ${this.passCount}`, 'pass')
		this.log(`Failed: ${this.failCount}`, this.failCount > 0 ? 'fail' : 'info')
		this.log(`Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`, 'info')
		this.log(`Duration: ${duration.toFixed(2)} seconds`, 'info')

		if (this.failCount > 0) {
			this.log('\n❌ FAILED TESTS:', 'fail')
			this.testResults
				.filter(t => t.status === 'FAIL')
				.forEach(t => this.log(`  - ${t.name}: ${t.error}`, 'fail'))
		}

		this.log('\n✅ PASSED TESTS:', 'pass')
		this.testResults
			.filter(t => t.status === 'PASS')
			.forEach(t => this.log(`  - ${t.name}`, 'pass'))

		// Save detailed report
		const report = {
			summary: {
				totalTests: this.testCount,
				passed: this.passCount,
				failed: this.failCount,
				successRate: (this.passCount / this.testCount) * 100,
				duration: duration,
				timestamp: new Date().toISOString()
			},
			tests: this.testResults,
			createdTestData: this.createdIds
		}

		writeFileSync('tests/mcp-test-report.json', JSON.stringify(report, null, 2))
		this.log('\n📄 Detailed report saved to: tests/mcp-test-report.json', 'info')

		if (this.failCount === 0) {
			this.log('\n🎉 ALL TESTS PASSED! The Enhanced Memory MCP Server is working perfectly! 🎉', 'pass')
		} else {
			this.log('\n💔 Some tests failed. Check the report for details. 💔', 'fail')
		}
	}
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const tester = new MCPTester()
	tester.runAllTests().catch(error => {
		console.error('Test suite crashed:', error)
		process.exit(1)
	})
}

export { MCPTester }
