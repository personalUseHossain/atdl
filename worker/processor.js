// worker/processor.js (Updated for Multi-User)
const fs = require('fs');
const path = require('path');
const PubMedFetcher = require('./pubmed');
const AIExtractor = require('./extractor');

class DataProcessor {
    constructor(userId, sessionId = null) {
        this.userId = userId;
        this.sessionId = sessionId || `session_${Date.now()}`;
        
        // User-specific data directories
        this.dataDir = path.join(process.cwd(), 'temp', 'users', userId.toString());
        if (sessionId) {
            this.dataDir = path.join(this.dataDir, 'instances', sessionId);
        }
        
        this.connectionsFile = path.join(this.dataDir, 'connections.json');
        this.knowledgeGraphFile = path.join(this.dataDir, 'knowledge_graph.json');
        this.processedPapersFile = path.join(this.dataDir, 'processed_papers.json');
        this.processingHistoryFile = path.join(this.dataDir, 'processing_history.json');
        this.cacheDir = path.join(this.dataDir, 'cache');
        
        // Ensure data directories exist
        this.ensureDirectory(this.dataDir);
        this.ensureDirectory(this.cacheDir);
        
        // Initialize with user-specific PubMed fetcher
        this.pubmedFetcher = new PubMedFetcher(this.cacheDir);
        this.aiExtractor = new AIExtractor();
        
        // Load existing data
        this.connections = this.loadJSON(this.connectionsFile, []);
        this.processedPapers = this.loadJSON(this.processedPapersFile, []);
        this.processingHistory = this.loadJSON(this.processingHistoryFile, []);
    }

    ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    loadJSON(filePath, defaultValue = []) {
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                console.error(`Error loading ${filePath}:`, e);
            }
        }
        return defaultValue;
    }

    saveJSON(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error(`Error saving ${filePath}:`, e);
        }
    }

    isPaperProcessed(pmid) {
        return this.processedPapers.some(p => p.pmid === pmid && p.processed === true);
    }

    markPaperAsProcessed(paper, connectionsFound, hasFullText) {
        const processedPaper = {
            pmid: paper.pmid,
            title: paper.title,
            journal: paper.journal,
            year: paper.year,
            has_full_text: hasFullText,
            connections_found: connectionsFound,
            processed_at: new Date().toISOString(),
            processed: true,
            user_id: this.userId,
            session_id: this.sessionId
        };

        // Update or add to processed papers
        const existingIndex = this.processedPapers.findIndex(p => p.pmid === paper.pmid);
        if (existingIndex >= 0) {
            this.processedPapers[existingIndex] = processedPaper;
        } else {
            this.processedPapers.push(processedPaper);
        }

        this.saveJSON(this.processedPapersFile, this.processedPapers);
    }

    addToHistory(query, totalPapers, newConnections, uniqueConnections, duration) {
        const historyEntry = {
            id: `run_${Date.now()}`,
            query: query,
            timestamp: new Date().toISOString(),
            stats: {
                total_papers_processed: totalPapers,
                new_connections_found: newConnections,
                unique_connections_total: uniqueConnections,
                duration_seconds: duration
            },
            cache_stats: this.pubmedFetcher.getCacheStats(),
            user_id: this.userId,
            session_id: this.sessionId
        };

        this.processingHistory.unshift(historyEntry); // Add to beginning
        if (this.processingHistory.length > 50) { // Keep last 50 runs
            this.processingHistory = this.processingHistory.slice(0, 50);
        }

        this.saveJSON(this.processingHistoryFile, this.processingHistory);
    }

    async processPapers(papers, onProgress = null) {
        const allConnections = [];
        let papersWithFullText = 0;
        let papersProcessed = 0;
        
        for (let i = 0; i < papers.length; i++) {
            const paper = papers[i];
            
            // Skip if already processed in this session
            if (this.isPaperProcessed(paper.pmid)) {
                console.log(`Skipping already processed paper: ${paper.pmid}`);
                continue;
            }

            try {
                const hasFullText = paper.hasFullText || false;
                if (hasFullText) papersWithFullText++;
                
                const connections = await this.aiExtractor.extractConnections(paper);
                
                if (connections && connections.length > 0) {
                    // Add user and session metadata to each connection
                    const enrichedConnections = connections.map(conn => ({
                        ...conn,
                        user_id: this.userId,
                        session_id: this.sessionId,
                        processed_at: new Date().toISOString()
                    }));
                    
                    allConnections.push(...enrichedConnections);
                    
                    // Mark paper as processed
                    this.markPaperAsProcessed(paper, connections.length, hasFullText);
                }
                
                papersProcessed++;
                
                if (onProgress) {
                    const progress = 25 + Math.round(((i + 1) / papers.length) * 50); // 25-75%
                    onProgress(progress, `Extracted from ${papersProcessed}/${papers.length} papers `);
                }
                
            } catch (error) {
                console.error(`Error processing paper ${paper.pmid}:`, error.message);
                
                // Mark as failed
                this.markPaperAsProcessed({
                    ...paper,
                    processed: false,
                    error: error.message
                }, 0, paper.hasFullText || false);
            }
        }
        
        console.log(`Processed ${papersProcessed} papers, ${papersWithFullText} had full text`);
        return allConnections;
    }

    processAndRankConnections(newConnections) {
        const connectionMap = new Map();
        
        // Add existing connections
        this.connections.forEach(conn => {
            const key = `${conn.drug.toLowerCase().trim()}|${conn.health_issue.toLowerCase().trim()}`;
            this.addToConnectionMap(connectionMap, key, conn);
        });
        
        // Add new connections
        newConnections.forEach(conn => {
            const key = `${conn.drug.toLowerCase().trim()}|${conn.health_issue.toLowerCase().trim()}`;
            this.addToConnectionMap(connectionMap, key, conn);
        });
        
        // Calculate strength and convert to array
        const allConnections = Array.from(connectionMap.values()).map(conn => {
            const strength = this.calculateStrength(conn);
            
            return {
                ...conn,
                strength: strength,
                id: conn.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                last_updated: new Date().toISOString(),
                user_id: this.userId,
                session_id: this.sessionId
            };
        });
        
        // Sort by strength and paper count
        this.connections = allConnections.sort((a, b) => {
            if (b.strength !== a.strength) return b.strength - a.strength;
            return b.total_papers - a.total_papers;
        });
        
        this.saveJSON(this.connectionsFile, this.connections);
        
        return this.connections;
    }

    addToConnectionMap(map, key, connection) {
        if (!map.has(key)) {
            map.set(key, {
                ...connection,
                supporting_papers: [connection.paper_id],
                total_papers: 1,
                first_paper_year: connection.paper_year,
                latest_paper_year: connection.paper_year,
                extraction_sources: [connection.extraction_source || 'unknown'],
                has_full_text_sources: connection.has_full_text ? 1 : 0,
                relationships: [connection.relationship],
                user_id: this.userId,
                session_ids: [this.sessionId]
            });
        } else {
            const existing = map.get(key);
            
            // Add paper if not already in supporting papers
            if (!existing.supporting_papers.includes(connection.paper_id)) {
                existing.supporting_papers.push(connection.paper_id);
                existing.total_papers++;
                existing.relationships.push(connection.relationship);
                
                if (connection.extraction_source) {
                    if (!existing.extraction_sources.includes(connection.extraction_source)) {
                        existing.extraction_sources.push(connection.extraction_source);
                    }
                }
                
                if (connection.has_full_text) {
                    existing.has_full_text_sources++;
                }
                
                // Add session ID if not already present
                if (!existing.session_ids.includes(this.sessionId)) {
                    existing.session_ids.push(this.sessionId);
                }
                
                // Update year range
                if (connection.paper_year < existing.first_paper_year) {
                    existing.first_paper_year = connection.paper_year;
                }
                if (connection.paper_year > existing.latest_paper_year) {
                    existing.latest_paper_year = connection.paper_year;
                }
            }
        }
    }

    calculateStrength(connection) {
        let strength = 1;
        
        // Factor 1: Number of supporting papers
        if (connection.total_papers >= 10) strength = 5;
        else if (connection.total_papers >= 7) strength = 4;
        else if (connection.total_papers >= 4) strength = 3;
        else if (connection.total_papers >= 2) strength = 2;
        
        // Factor 2: Full text sources boost
        if (connection.has_full_text_sources > 0) {
            strength = Math.min(strength + 1, 5);
        }
        
        // Factor 3: Confidence from individual extractions
        if (connection.confidence === 'High') {
            strength = Math.min(strength + 1, 5);
        }
        
        // Factor 4: Study quality (clinical trials)
        if (connection.study_type && connection.study_type.toLowerCase().includes('clinical')) {
            strength = Math.min(strength + 1, 5);
        }
        
        // Factor 5: Statistical significance mentioned
        if (connection.statistical_significance) {
            strength = Math.min(strength + 1, 5);
        }
        
        // Factor 6: Recency (last 3 years)
        const currentYear = new Date().getFullYear();
        if (connection.latest_paper_year && (currentYear - connection.latest_paper_year) <= 3) {
            strength = Math.min(strength + 1, 5);
        }
        
        // Factor 7: Multiple session verification
        if (connection.session_ids && connection.session_ids.length > 1) {
            strength = Math.min(strength + 1, 5);
        }
        
        return Math.max(1, Math.min(5, strength));
    }

    buildKnowledgeGraph(connections) {
        const graph = {
            nodes: [],
            edges: [],
            metadata: {
                generated_at: new Date().toISOString(),
                total_connections: connections.length,
                total_drugs: new Set(connections.map(c => c.drug)).size,
                total_health_issues: new Set(connections.map(c => c.health_issue)).size,
                user_id: this.userId,
                session_id: this.sessionId
            }
        };
        
        const nodeMap = new Map();
        let nodeId = 1;
        
        // Add nodes
        connections.forEach(conn => {
            // Drug node
            if (!nodeMap.has(conn.drug)) {
                nodeMap.set(conn.drug, {
                    id: `drug_${nodeId++}`,
                    label: conn.drug,
                    type: 'drug',
                    size: Math.min(30 + (conn.total_papers * 5), 100),
                    color: '#4A90E2',
                    total_connections: 1,
                    user_id: this.userId
                });
            } else {
                nodeMap.get(conn.drug).total_connections++;
            }
            
            // Health issue node
            if (!nodeMap.has(conn.health_issue)) {
                nodeMap.set(conn.health_issue, {
                    id: `health_${nodeId++}`,
                    label: conn.health_issue,
                    type: 'health_issue',
                    size: Math.min(20 + (conn.total_papers * 3), 80),
                    color: '#50E3C2',
                    total_connections: 1,
                    user_id: this.userId
                });
            } else {
                nodeMap.get(conn.health_issue).total_connections++;
            }
        });
        
        graph.nodes = Array.from(nodeMap.values());
        
        // Add edges with unique IDs to avoid duplicates
        const edgeMap = new Map();
        
        connections.forEach((conn, index) => {
            const sourceNode = nodeMap.get(conn.drug);
            const targetNode = nodeMap.get(conn.health_issue);
            
            if (sourceNode && targetNode) {
                const edgeKey = `${sourceNode.id}-${targetNode.id}`;
                
                if (!edgeMap.has(edgeKey)) {
                    edgeMap.set(edgeKey, {
                        id: `edge_${index}`,
                        source: sourceNode.id,
                        target: targetNode.id,
                        label: `Strength: ${conn.strength}`,
                        value: conn.strength,
                        papers: conn.total_papers || 1,
                        relationship: conn.relationship,
                        width: Math.min(conn.strength * 2, 10),
                        has_full_text: conn.has_full_text_sources > 0,
                        user_id: this.userId,
                        session_id: this.sessionId
                    });
                }
            }
        });
        
        graph.edges = Array.from(edgeMap.values());
        
        // Calculate graph statistics
        graph.stats = this.calculateGraphStats(graph);
        
        this.saveJSON(this.knowledgeGraphFile, graph);
        return graph;
    }

    calculateGraphStats(graph) {
        if (!graph || !graph.nodes) return null;
        
        const nodes = graph.nodes;
        const edges = graph.edges || [];
        
        const drugNodes = nodes.filter(n => n.type === 'drug').length;
        const healthNodes = nodes.filter(n => n.type === 'health_issue').length;
        
        // Calculate degree distribution
        const degrees = nodes.map(node => {
            return edges.filter(e => e.source === node.id || e.target === node.id).length;
        });
        
        const maxDegree = Math.max(...degrees);
        const avgDegree = degrees.length > 0 
            ? (degrees.reduce((a, b) => a + b, 0) / degrees.length).toFixed(2)
            : 0;
            
        // Edge strength distribution
        const strengthDist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        edges.forEach(edge => {
            const strength = edge.value || 1;
            strengthDist[strength] = (strengthDist[strength] || 0) + 1;
        });
        
        return {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            drugNodes,
            healthNodes,
            maxDegree,
            avgDegree,
            strengthDistribution: strengthDist,
            density: edges.length / Math.max(1, (nodes.length * (nodes.length - 1) / 2))
        };
    }

    getStats() {
        const cacheStats = this.pubmedFetcher.getCacheStats();
        
        return {
            connections: {
                total: this.connections.length,
                with_full_text: this.connections.filter(c => c.has_full_text_sources > 0).length,
                average_strength: this.connections.length > 0 
                    ? (this.connections.reduce((sum, c) => sum + c.strength, 0) / this.connections.length).toFixed(2)
                    : 0
            },
            papers: {
                total_processed: this.processedPapers.filter(p => p.processed).length,
                with_full_text: this.processedPapers.filter(p => p.has_full_text).length,
                total_in_cache: cacheStats.total
            },
            cache: cacheStats,
            user_id: this.userId,
            session_id: this.sessionId
        };
    }

    // Export data for database storage
    exportData() {
        return {
            connections: this.connections,
            processedPapers: this.processedPapers,
            processingHistory: this.processingHistory,
            knowledgeGraph: this.loadJSON(this.knowledgeGraphFile, {}),
            stats: this.getStats()
        };
    }

    // Import data from database
    importData(data) {
        if (data.connections) {
            this.connections = data.connections;
            this.saveJSON(this.connectionsFile, this.connections);
        }
        
        if (data.processedPapers) {
            this.processedPapers = data.processedPapers;
            this.saveJSON(this.processedPapersFile, this.processedPapers);
        }
        
        if (data.processingHistory) {
            this.processingHistory = data.processingHistory;
            this.saveJSON(this.processingHistoryFile, this.processingHistory);
        }
        
        if (data.knowledgeGraph) {
            this.saveJSON(this.knowledgeGraphFile, data.knowledgeGraph);
        }
    }

    // Clear session-specific data
    clearSessionData() {
        this.connections = [];
        this.processedPapers = [];
        this.processingHistory = [];
        
        this.saveJSON(this.connectionsFile, []);
        this.saveJSON(this.processedPapersFile, []);
        this.saveJSON(this.processingHistoryFile, []);
        
        // Keep knowledge graph for reference
    }
}

async function processPubMedPapers(query, maxPapers, callbacks = {}, customProcessor = null, userId = 'anonymous', sessionId = null) {
    const { onProgress, onLog } = callbacks;
    const startTime = Date.now();
    const processor = new DataProcessor(userId, sessionId);
    
    try {
        if (onLog) onLog(`Starting PubMed search for user ${userId}: ${query}`);
        if (onProgress) onProgress(5, 'Searching PubMed...');
        
        // Step 1: Search PubMed
        const searchResults = await processor.pubmedFetcher.search(query, maxPapers);
        
        if (onLog) onLog(`Found ${searchResults.total} papers, fetching ${searchResults.ids.length}`);
        if (onProgress) onProgress(10, `Found ${searchResults.total} papers`);
        
        // Get cached papers stats
        const cacheStats = processor.pubmedFetcher.getCacheStats();
        if (onLog) onLog(`Cache: ${cacheStats.total} papers`);
        
        // Step 2: Fetch papers (skip already cached)
        const papers = await processor.pubmedFetcher.fetchMultiplePapers(
            searchResults.ids.slice(0, maxPapers),
            (progress, step) => {
                if (onProgress) onProgress(10 + progress * 0.25, step);
            },
            false // Don't force refresh
        );
        
        if (onLog) onLog(`Fetched ${papers.length} papers`);
        if (onProgress) onProgress(35, 'Processing papers...');
        
        // Step 3: Process papers (use custom processor if provided)
        const newConnections = customProcessor 
            ? await customProcessor(papers, onProgress)
            : await processor.processPapers(papers, onProgress);
        
        if (onLog) onLog(`Extracted ${newConnections.length} new connections`);
        if (onProgress) onProgress(80, 'Ranking connections...');
        
        // Step 4: Process and rank connections
        const rankedConnections = processor.processAndRankConnections(newConnections);
        
        if (onLog) onLog(`Now have ${rankedConnections.length} total connections`);
        if (onProgress) onProgress(90, 'Building knowledge graph...');
        
        // Step 5: Build knowledge graph
        const knowledgeGraph = processor.buildKnowledgeGraph(rankedConnections);
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        if (onLog) onLog(`Built graph with ${knowledgeGraph.nodes.length} nodes and ${knowledgeGraph.edges.length} edges in ${duration}s`);
        if (onProgress) onProgress(100, 'Processing complete!');
        
        // Add to history
        processor.addToHistory(
            query, 
            papers.length, 
            newConnections.length, 
            rankedConnections.length,
            duration
        );
        
        const stats = processor.getStats();
        
        return {
            totalPapers: papers.length,
            totalConnections: newConnections.length,
            uniqueConnections: rankedConnections.length,
            connections: rankedConnections,
            knowledgeGraph: knowledgeGraph,
            stats: stats,
            duration: duration,
            query: query,
            userId: userId,
            sessionId: sessionId || processor.sessionId,
            exportedData: processor.exportData()
        };
        
    } catch (error) {
        if (onLog) onLog(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// Helper function to load user's previous data
async function loadUserData(userId, sessionId = null) {
    const processor = new DataProcessor(userId, sessionId);
    return processor.exportData();
}

// Helper function to merge data from multiple sessions
async function mergeUserSessions(userId) {
    const userDir = path.join(process.cwd(), 'temp', 'users', userId.toString());
    if (!fs.existsSync(userDir)) {
        return null;
    }
    
    const instancesDir = path.join(userDir, 'instances');
    if (!fs.existsSync(instancesDir)) {
        return null;
    }
    
    const instanceDirs = fs.readdirSync(instancesDir).filter(dir => {
        return fs.statSync(path.join(instancesDir, dir)).isDirectory();
    });
    
    let allConnections = [];
    let allProcessedPapers = [];
    let allProcessingHistory = [];
    
    for (const instanceDir of instanceDirs) {
        const instancePath = path.join(instancesDir, instanceDir);
        
        // Load connections
        const connectionsFile = path.join(instancePath, 'connections.json');
        if (fs.existsSync(connectionsFile)) {
            try {
                const connections = JSON.parse(fs.readFileSync(connectionsFile, 'utf8'));
                allConnections.push(...connections);
            } catch (e) {
                console.error(`Error loading connections from ${instanceDir}:`, e);
            }
        }
        
        // Load processed papers
        const processedPapersFile = path.join(instancePath, 'processed_papers.json');
        if (fs.existsSync(processedPapersFile)) {
            try {
                const papers = JSON.parse(fs.readFileSync(processedPapersFile, 'utf8'));
                allProcessedPapers.push(...papers);
            } catch (e) {
                console.error(`Error loading papers from ${instanceDir}:`, e);
            }
        }
        
        // Load history
        const historyFile = path.join(instancePath, 'processing_history.json');
        if (fs.existsSync(historyFile)) {
            try {
                const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                allProcessingHistory.push(...history);
            } catch (e) {
                console.error(`Error loading history from ${instanceDir}:`, e);
            }
        }
    }
    
    // Create merged processor
    const mergedProcessor = new DataProcessor(userId, 'merged');
    
    // Process and rank all connections
    const rankedConnections = mergedProcessor.processAndRankConnections(allConnections);
    
    // Build merged knowledge graph
    const knowledgeGraph = mergedProcessor.buildKnowledgeGraph(rankedConnections);
    
    // Save merged data
    mergedProcessor.saveJSON(path.join(userDir, 'merged_connections.json'), rankedConnections);
    mergedProcessor.saveJSON(path.join(userDir, 'merged_knowledge_graph.json'), knowledgeGraph);
    mergedProcessor.saveJSON(path.join(userDir, 'merged_processed_papers.json'), allProcessedPapers);
    mergedProcessor.saveJSON(path.join(userDir, 'merged_processing_history.json'), allProcessingHistory);
    
    return {
        connections: rankedConnections,
        processedPapers: allProcessedPapers,
        processingHistory: allProcessingHistory,
        knowledgeGraph: knowledgeGraph,
        stats: mergedProcessor.getStats()
    };
}

module.exports = { 
    processPubMedPapers, 
    DataProcessor,
    loadUserData,
    mergeUserSessions 
};