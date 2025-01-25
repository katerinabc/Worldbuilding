export const EMBEDDER_CONFIG = {
    // Primary embedder choice
    active: 'gaia' as 'chroma' | 'gaia',
    
    // Configuration for each embedder
    settings: {
        gaia: {
            baseUrl: 'https://llama8b.gaia.domains/v1',
            model: 'nomic-embed-text-v1.5',
            maxBatchSize: 1,
            timeout: 30000
        },
        chroma: {
            // any chroma-specific settings
        }
    },

    // Track performance and errors
    metrics: {
        lastUsed: null as string | null,
        errors: 0,
        averageResponseTime: 0,
        errorLog: [] as {timestamp: string, error: string}[]
    },

    // Helper function to log errors
    logError(error: Error) {
        this.metrics.errors++;
        this.metrics.errorLog.push({
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}; 