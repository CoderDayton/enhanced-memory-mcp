
/**
 * Enhanced Memory MCP Server - Performance Benchmark Suite
 * Professional testing with autocannon and clinic.js integration
 * Created by: malu
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { HTTPServer } from './http-server.js'

interface BenchmarkResult {
	name: string
	duration: number
	requests_per_second: number
	latency_avg: number
	latency_p95: number
	latency_p99: number
	throughput_mb: number
	errors: number
	success_rate: number
}

interface BenchmarkSuite {
	timestamp: string
	node_version: string
	total_duration: number
	results: BenchmarkResult[]
	performance_grade: string
	recommendations: string[]
}

class PerformanceBenchmark {
	private httpServer: HTTPServer | null = null
	private readonly port = 3001
	private readonly baseUrl = `http://localhost:${this.port}`

	async runFullSuite(): Promise<void> {
		console.log('🚀 Enhanced Memory MCP Server - Performance Benchmark Suite')
		console.log('👤 Created by: malu')
		console.log('📊 Testing with autocannon and custom metrics\n')

		const startTime = Date.now()
		const results: BenchmarkResult[] = []

		try {
			// Start HTTP server for testing
			await this.startTestServer()

			// Wait for server to be ready
			await this.waitForServer()

			// Run benchmark tests
			console.log('🏁 Starting benchmark tests...\n')

			// Test 1: Basic memory storage
			results.push(await this.benchmarkMemoryStorage())

			// Test 2: Memory search performance
			results.push(await this.benchmarkMemorySearch())

			// Test 3: High-load mixed operations
			results.push(await this.benchmarkMixedOperations())

			// Test 4: Memory retrieval
			results.push(await this.benchmarkMemoryRetrieval())

			// Test 5: Statistics endpoint
			results.push(await this.benchmarkStatsEndpoint())

			// Test 6: Data export performance
			results.push(await this.benchmarkDataExport())

			// Generate comprehensive report
			const suite: BenchmarkSuite = {
				timestamp: new Date().toISOString(),
				node_version: process.version,
				total_duration: Date.now() - startTime,
				results,
				performance_grade: this.calculateGrade(results),
				recommendations: this.generateRecommendations(results)
			}

			await this.generateReport(suite)

		} finally {
			await this.stopTestServer()
		}
	}

	private async startTestServer(): Promise<void> {
		console.log(`🔧 Starting test server on port ${this.port}...`)
		this.httpServer = new HTTPServer(this.port)
		await this.httpServer.start()
	}

	private async waitForServer(): Promise<void> {
		console.log('⏳ Waiting for server to be ready...')
		for (let i = 0; i < 30; i++) {
			try {
				const response = await fetch(`${this.baseUrl}/health`)
				if (response.ok) {
					console.log('✅ Server is ready!\n')
					return
				}
			} catch (error) {
				// Server not ready yet
			}
			await new Promise(resolve => setTimeout(resolve, 1000))
		}
		throw new Error('Server failed to start within 30 seconds')
	}

	private async stopTestServer(): Promise<void> {
		if (this.httpServer) {
			console.log('\n🛑 Stopping test server...')
			await this.httpServer.stop()
		}
	}

	private async benchmarkMemoryStorage(): Promise<BenchmarkResult> {
		console.log('📝 Benchmarking memory storage...')
		
		const command = [
			'npx', 'autocannon',
			'-c', '10', // connections
			'-d', '30', // duration in seconds
			'-m', 'POST',
			'-H', 'Content-Type=application/json',
			'-b', JSON.stringify({
				content: 'This is a test memory for benchmarking performance',
				type: 'benchmark',
				metadata: { test: true, timestamp: Date.now() }
			}),
			`${this.baseUrl}/api/memories`
		]

		const result = await this.runAutocannon(command)
		return {
			name: 'Memory Storage',
			...result
		}
	}

	private async benchmarkMemorySearch(): Promise<BenchmarkResult> {
		console.log('🔍 Benchmarking memory search...')
		
		// First, populate some test data
		await this.populateTestData(100)

		const command = [
			'npx', 'autocannon',
			'-c', '20', // connections
			'-d', '30', // duration
			'-m', 'GET',
			`${this.baseUrl}/api/memories/search?q=test&limit=10`
		]

		const result = await this.runAutocannon(command)
		return {
			name: 'Memory Search',
			...result
		}
	}

	private async benchmarkMixedOperations(): Promise<BenchmarkResult> {
		console.log('⚡ Benchmarking mixed operations...')
		
		// Create a mixed workload script
		const script = `
const operations = [
	{ method: 'POST', path: '/api/memories', body: { content: 'Mixed test ${Math.random()}', type: 'mixed' } },
	{ method: 'GET', path: '/api/memories/search?q=test&limit=5' },
	{ method: 'GET', path: '/api/stats' }
];

const operation = operations[Math.floor(Math.random() * operations.length)];
if (operation.body) {
	request.body = JSON.stringify(operation.body);
	request.headers['Content-Type'] = 'application/json';
}
request.method = operation.method;
request.path = operation.path;
		`.trim()

		const command = [
			'npx', 'autocannon',
			'-c', '15',
			'-d', '45',
			'--script', script,
			this.baseUrl
		]

		const result = await this.runAutocannon(command)
		return {
			name: 'Mixed Operations',
			...result
		}
	}

	private async benchmarkMemoryRetrieval(): Promise<BenchmarkResult> {
		console.log('📖 Benchmarking memory retrieval...')
		
		// Get a memory ID for testing
		const memoryResponse = await fetch(`${this.baseUrl}/api/memories`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: 'Retrieval test memory', type: 'retrieval' })
		})
		const memory: any = await memoryResponse.json()
		const memoryId = JSON.parse(memory.content[0].text)

		const command = [
			'npx', 'autocannon',
			'-c', '25',
			'-d', '20',
			'-m', 'GET',
			`${this.baseUrl}/api/memories/${memoryId}`
		]

		const result = await this.runAutocannon(command)
		return {
			name: 'Memory Retrieval',
			...result
		}
	}

	private async benchmarkStatsEndpoint(): Promise<BenchmarkResult> {
		console.log('📊 Benchmarking stats endpoint...')
		
		const command = [
			'npx', 'autocannon',
			'-c', '30',
			'-d', '15',
			'-m', 'GET',
			`${this.baseUrl}/api/stats`
		]

		const result = await this.runAutocannon(command)
		return {
			name: 'Statistics Endpoint',
			...result
		}
	}

	private async benchmarkDataExport(): Promise<BenchmarkResult> {
		console.log('📤 Benchmarking data export...')
		
		const command = [
			'npx', 'autocannon',
			'-c', '5', // Lower concurrency for export
			'-d', '20',
			'-m', 'GET',
			`${this.baseUrl}/api/export?format=json`
		]

		const result = await this.runAutocannon(command)
		return {
			name: 'Data Export',
			...result
		}
	}

	private async runAutocannon(command: string[]): Promise<Omit<BenchmarkResult, 'name'>> {
		return new Promise((resolve, reject) => {
			const process = spawn(command[0], command.slice(1), { stdio: 'pipe' })
			let output = ''

			process.stdout.on('data', (data) => {
				output += data.toString()
			})

			process.stderr.on('data', (data) => {
				output += data.toString()
			})

			process.on('close', (code) => {
				if (code !== 0) {
					reject(new Error(`Autocannon failed with code ${code}: ${output}`))
					return
				}

				try {
					// Parse autocannon output
					const lines = output.split('\n')
					let reqPerSec = 0
					let avgLatency = 0
					let p95Latency = 0
					let p99Latency = 0
					let throughput = 0
					let errors = 0
					let duration = 0

					for (const line of lines) {
						if (line.includes('Req/Sec')) {
							const match = line.match(/(\d+\.?\d*)/g)
							if (match) reqPerSec = parseFloat(match[0])
						} else if (line.includes('Latency')) {
							const match = line.match(/(\d+\.?\d*)/g)
							if (match) avgLatency = parseFloat(match[0])
						} else if (line.includes('95%')) {
							const match = line.match(/(\d+\.?\d*)/g)
							if (match) p95Latency = parseFloat(match[0])
						} else if (line.includes('99%')) {
							const match = line.match(/(\d+\.?\d*)/g)
							if (match) p99Latency = parseFloat(match[0])
						} else if (line.includes('Bytes/Sec')) {
							const match = line.match(/(\d+\.?\d*)/g)
							if (match) throughput = parseFloat(match[0]) / 1024 / 1024 // Convert to MB
						} else if (line.includes('errors')) {
							const match = line.match(/(\d+)/g)
							if (match) errors = parseInt(match[0])
						}
					}

					duration = 30 // Default duration, could parse from output

					resolve({
						duration,
						requests_per_second: reqPerSec,
						latency_avg: avgLatency,
						latency_p95: p95Latency,
						latency_p99: p99Latency,
						throughput_mb: throughput,
						errors,
						success_rate: errors === 0 ? 100 : Math.max(0, 100 - (errors / (reqPerSec * duration) * 100))
					})
				} catch (error) {
					reject(new Error(`Failed to parse autocannon output: ${error}`))
				}
			})
		})
	}

	private async populateTestData(count: number): Promise<void> {
		console.log(`📚 Populating ${count} test memories...`)
		
		const promises: Promise<Response>[] = []
		for (let i = 0; i < count; i++) {
			promises.push(
				fetch(`${this.baseUrl}/api/memories`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						content: `Test memory ${i} with some searchable content for benchmarking`,
						type: 'test',
						metadata: { index: i, category: i % 5 }
					})
				})
			)
		}
		
		await Promise.all(promises)
		console.log('✅ Test data populated')
	}

	private calculateGrade(results: BenchmarkResult[]): string {
		const avgRps = results.reduce((sum, r) => sum + r.requests_per_second, 0) / results.length
		const avgLatency = results.reduce((sum, r) => sum + r.latency_avg, 0) / results.length
		const avgSuccessRate = results.reduce((sum, r) => sum + r.success_rate, 0) / results.length

		if (avgRps > 1000 && avgLatency < 50 && avgSuccessRate >= 99) return 'A+'
		if (avgRps > 500 && avgLatency < 100 && avgSuccessRate >= 95) return 'A'
		if (avgRps > 250 && avgLatency < 200 && avgSuccessRate >= 90) return 'B+'
		if (avgRps > 100 && avgLatency < 500 && avgSuccessRate >= 85) return 'B'
		if (avgRps > 50 && avgLatency < 1000 && avgSuccessRate >= 80) return 'C'
		return 'D'
	}

	private generateRecommendations(results: BenchmarkResult[]): string[] {
		const recommendations: string[] = []
		const avgLatency = results.reduce((sum, r) => sum + r.latency_avg, 0) / results.length
		const avgRps = results.reduce((sum, r) => sum + r.requests_per_second, 0) / results.length

		if (avgLatency > 200) {
			recommendations.push('Consider optimizing database queries and adding more aggressive caching')
		}

		if (avgRps < 100) {
			recommendations.push('Performance is below expected thresholds - review DuckDB configuration and connection pooling')
		}

		const errorRates = results.filter(r => r.errors > 0)
		if (errorRates.length > 0) {
			recommendations.push('Address error handling and add circuit breakers for reliability')
		}

		if (results.some(r => r.latency_p99 > r.latency_avg * 5)) {
			recommendations.push('High P99 latency detected - investigate outliers and add request timeouts')
		}

		if (recommendations.length === 0) {
			recommendations.push('Performance looks excellent! Consider adding monitoring and alerting for production')
		}

		return recommendations
	}

	private async generateReport(suite: BenchmarkSuite): Promise<void> {
		const reportDir = path.join(process.cwd(), 'benchmarks')
		if (!fs.existsSync(reportDir)) {
			fs.mkdirSync(reportDir, { recursive: true })
		}

		const reportFile = path.join(reportDir, `benchmark-${Date.now()}.json`)
		fs.writeFileSync(reportFile, JSON.stringify(suite, null, 2))

		console.log('\n🎯 Performance Benchmark Results')
		console.log('=' .repeat(50))
		console.log(`📅 Timestamp: ${suite.timestamp}`)
		console.log(`⏱️  Total Duration: ${(suite.total_duration / 1000).toFixed(2)}s`)
		console.log(`🎓 Performance Grade: ${suite.performance_grade}`)
		console.log(`🖥️  Node Version: ${suite.node_version}`)
		console.log()

		suite.results.forEach(result => {
			console.log(`📊 ${result.name}:`)
			console.log(`   RPS: ${result.requests_per_second.toFixed(0)}/s`)
			console.log(`   Latency: ${result.latency_avg.toFixed(1)}ms avg, ${result.latency_p95.toFixed(1)}ms p95, ${result.latency_p99.toFixed(1)}ms p99`)
			console.log(`   Throughput: ${result.throughput_mb.toFixed(2)} MB/s`)
			console.log(`   Success Rate: ${result.success_rate.toFixed(1)}%`)
			console.log(`   Errors: ${result.errors}`)
			console.log()
		})

		console.log('💡 Recommendations:')
		suite.recommendations.forEach(rec => console.log(`   • ${rec}`))
		console.log()
		console.log(`📁 Detailed report saved to: ${reportFile}`)
	}
}

// Run benchmark if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const benchmark = new PerformanceBenchmark()
	benchmark.runFullSuite().catch(error => {
		console.error('❌ Benchmark failed:', error)
		process.exit(1)
	})
}

export { PerformanceBenchmark }
