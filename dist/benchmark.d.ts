/**
 * Enhanced Memory MCP Server - Performance Benchmark Suite
 * Professional testing with autocannon and clinic.js integration
 * Created by: malu
 */
declare class PerformanceBenchmark {
    private httpServer;
    private readonly port;
    private readonly baseUrl;
    runFullSuite(): Promise<void>;
    private startTestServer;
    private waitForServer;
    private stopTestServer;
    private benchmarkMemoryStorage;
    private benchmarkMemorySearch;
    private benchmarkMixedOperations;
    private benchmarkMemoryRetrieval;
    private benchmarkStatsEndpoint;
    private benchmarkDataExport;
    private runAutocannon;
    private populateTestData;
    private calculateGrade;
    private generateRecommendations;
    private generateReport;
}
export { PerformanceBenchmark };
//# sourceMappingURL=benchmark.d.ts.map