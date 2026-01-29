// worker/worker.js (CORRECTED)
const fs = require('fs');
const path = require('path');
const { processPubMedPapers } = require('./processor');

class WorkerManager {
    constructor() {
        this.worker = null;
        this.status = 'idle';
        this.progress = 0;
        this.currentStep = '';
        this.results = null;
        this.error = null;
        this.dataDir = path.join(process.cwd(), 'temp');
        this.logsDir = path.join(this.dataDir, 'logs');
        
        // Ensure directories exist
        if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
        if (!fs.existsSync(this.logsDir)) fs.mkdirSync(this.logsDir, { recursive: true });
        
        // Load existing status
        this.loadStatus();
    }

    loadStatus() {
        const statusFile = path.join(this.dataDir, 'status.json');
        if (fs.existsSync(statusFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
                this.status = data.status || 'idle';
                this.progress = data.progress || 0;
                this.currentStep = data.currentStep || '';
                this.results = data.results || null;
                this.error = data.error || null;
            } catch (e) {
                console.error('Error loading status:', e);
            }
        }
    }

    saveStatus() {
        const statusFile = path.join(this.dataDir, 'status.json');
        const statusData = {
            status: this.status,
            progress: this.progress,
            currentStep: this.currentStep,
            results: this.results,
            error: this.error,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
    }

    log(message, type = 'info') {
        const logFile = path.join(this.logsDir, `${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = `[${new Date().toISOString()}] [${type.toUpperCase()}] ${message}\n`;
        
        // Console log
        console.log(`[Worker] ${message}`);
        
        // File log
        fs.appendFileSync(logFile, logEntry, 'utf8');
    }

    async startProcessing(query = null, maxPapers = 30) {
        if (this.status === 'running') {
            throw new Error('Worker is already running');
        }

        this.status = 'running';
        this.progress = 0;
        this.currentStep = 'Initializing...';
        this.results = null;
        this.error = null;
        this.saveStatus();

        try {
            this.log('Starting PubMed processing...');
            
            // Run processing in background
            this.worker = await processPubMedPapers(
                query || "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)",
                maxPapers,
                {
                    onProgress: (progress, step) => {
                        this.progress = progress;
                        this.currentStep = step;
                        this.saveStatus();
                        this.log(`Progress: ${progress}% - ${step}`);
                    },
                    onLog: (message) => {
                        this.log(message);
                    }
                }
            );

            this.status = 'completed';
            this.progress = 100;
            this.currentStep = 'Processing completed';
            this.results = {
                processedAt: new Date().toISOString(),
                totalConnections: this.worker.connections ? this.worker.connections.length : 0,
                totalPapers: this.worker.totalPapers || 0
            };
            this.saveStatus();
            
            this.log('Processing completed successfully');
            return true;

        } catch (error) {
            this.status = 'error';
            this.error = error.message;
            this.currentStep = `Error: ${error.message}`;
            this.saveStatus();
            
            this.log(`Processing failed: ${error.message}`, 'error');
            throw error;
        }
    }

    stopProcessing() {
        if (this.status === 'running') {
            this.status = 'stopped';
            this.currentStep = 'Processing stopped by user';
            this.saveStatus();
            this.log('Processing stopped by user');
        }
    }

    getStatus() {
        this.loadStatus()
        return {
            status: this.status,
            progress: this.progress,
            currentStep: this.currentStep,
            results: this.results,
            error: this.error,
            lastUpdated: new Date().toISOString()
        };
    }

    // Helper methods to load data from files
    loadConnections() {
        try {
            const connectionsFile = path.join(this.dataDir, 'connections.json');
            if (fs.existsSync(connectionsFile)) {
                return JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading connections:', e);
        }
        return [];
    }

    loadKnowledgeGraph() {
        try {
            const knowledgeGraphFile = path.join(this.dataDir, 'knowledge_graph.json');
            if (fs.existsSync(knowledgeGraphFile)) {
                return JSON.parse(fs.readFileSync(knowledgeGraphFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading knowledge graph:', e);
        }
        return { nodes: [], edges: [] };
    }

    loadProcessedPapers() {
        try {
            const processedFile = path.join(this.dataDir, 'processed_papers.json');
            if (fs.existsSync(processedFile)) {
                return JSON.parse(fs.readFileSync(processedFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading processed papers:', e);
        }
        return [];
    }

    getCacheStats() {
        const papersCacheDir = path.join(this.dataDir, 'papers_cache');
        const pmcCacheDir = path.join(this.dataDir, 'pmc_cache');
        
        let paperCacheCount = 0;
        let pmcCacheCount = 0;
        
        if (fs.existsSync(papersCacheDir)) {
            const files = fs.readdirSync(papersCacheDir).filter(f => f.endsWith('.json'));
            paperCacheCount = files.length;
        }
        
        if (fs.existsSync(pmcCacheDir)) {
            const files = fs.readdirSync(pmcCacheDir).filter(f => f.endsWith('.json'));
            pmcCacheCount = files.length;
        }
        
        // Count processed papers
        const processedPapers = this.loadProcessedPapers();
        const processedCount = processedPapers.filter(p => p.processed).length;
        const withFullTextCount = processedPapers.filter(p => p.has_full_text).length;
        
        return {
            papers_cached: paperCacheCount,
            full_text_cached: pmcCacheCount,
            papers_processed: processedCount,
            papers_with_full_text: withFullTextCount
        };
    }

    getProcessingHistory() {
        try {
            const historyFile = path.join(this.dataDir, 'processing_history.json');
            if (fs.existsSync(historyFile)) {
                return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading history:', e);
        }
        return [];
    }

    clearCache(type = 'all') {
        const papersCacheDir = path.join(this.dataDir, 'papers_cache');
        const pmcCacheDir = path.join(this.dataDir, 'pmc_cache');
        
        try {
            if (type === 'all' || type === 'papers') {
                if (fs.existsSync(papersCacheDir)) {
                    fs.readdirSync(papersCacheDir).forEach(file => {
                        fs.unlinkSync(path.join(papersCacheDir, file));
                    });
                }
            }
            
            if (type === 'all' || type === 'pmc') {
                if (fs.existsSync(pmcCacheDir)) {
                    fs.readdirSync(pmcCacheDir).forEach(file => {
                        fs.unlinkSync(path.join(pmcCacheDir, file));
                    });
                }
            }
            
            if (type === 'all') {
                // Also clear processed papers list
                fs.writeFileSync(path.join(this.dataDir, 'processed_papers.json'), JSON.stringify([], null, 2));
                // Clear status
                this.status = 'idle';
                this.progress = 0;
                this.currentStep = '';
                this.saveStatus();
            }
            
            this.log(`Cache cleared: ${type}`);
            return true;
        } catch (error) {
            this.log(`Error clearing cache: ${error.message}`, 'error');
            return false;
        }
    }

    getResults() {
        const connections = this.loadConnections();
        const knowledgeGraph = this.loadKnowledgeGraph();
        const cacheStats = this.getCacheStats();
        const processedPapers = this.loadProcessedPapers();
        const history = this.getProcessingHistory();
        
        const totalDrugs = new Set(connections.map(c => c.drug)).size;
        const totalHealthIssues = new Set(connections.map(c => c.health_issue)).size;
        const connectionsWithFullText = connections.filter(c => c.has_full_text_sources > 0).length;
        
        return {
            connections,
            knowledgeGraph,
            stats: {
                totalConnections: connections.length,
                totalDrugs,
                totalHealthIssues,
                connectionsWithFullText,
                averageStrength: connections.length > 0 ? 
                    (connections.reduce((sum, c) => sum + (c.strength || 1), 0) / connections.length).toFixed(2) : 0
            },
            cache: cacheStats,
            processing: {
                totalPapersProcessed: processedPapers.filter(p => p.processed).length,
                papersWithFullText: processedPapers.filter(p => p.has_full_text).length,
                history: history.slice(0, 10) // Last 10 runs
            }
        };
    }

    getLogs(limit = 100) {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logsDir, `${today}.log`);
        
        if (fs.existsSync(logFile)) {
            try {
                const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(line => line.trim());
                return logs.slice(-limit).reverse();
            } catch (e) {
                console.error('Error reading logs:', e);
            }
        }
        
        return [];
    }
}

// Create singleton instance
const workerManager = new WorkerManager();

module.exports = workerManager;