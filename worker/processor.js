// worker/processor.js (Updated)
const fs = require('fs');
const path = require('path');
const PubMedFetcher = require('./pubmed');
const AIExtractor = require('./extractor');

class DataProcessor {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.connectionsFile = path.join(this.dataDir, 'connections.json');
        this.knowledgeGraphFile = path.join(this.dataDir, 'knowledge_graph.json');
        this.processedPapersFile = path.join(this.dataDir, 'processed_papers.json');
        this.processingHistoryFile = path.join(this.dataDir, 'processing_history.json');
        
        // Ensure data directory exists
        this.ensureDirectory(this.dataDir);
        
        this.pubmedFetcher = new PubMedFetcher();
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
            processed: true
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
            cache_stats: this.pubmedFetcher.getCacheStats()
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
            
            // Skip if already processed
            if (this.isPaperProcessed(paper.pmid)) {
                console.log(`Skipping already processed paper: ${paper.pmid}`);
                continue;
            }

            try {
                const hasFullText = paper.hasFullText || false;
                if (hasFullText) papersWithFullText++;
                
                const connections = await this.aiExtractor.extractConnections(paper);
                
                if (connections && connections.length > 0) {
                    allConnections.push(...connections);
                    
                    // Mark paper as processed
                    this.markPaperAsProcessed(paper, connections.length, hasFullText);
                }
                
                papersProcessed++;
                
                if (onProgress) {
                    const progress = 25 + Math.round(((i + 1) / papers.length) * 50); // 25-75%
                    onProgress(progress, `Extracted from ${papersProcessed}/${papers.length} papers (${papersWithFullText} with full text)`);
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
                last_updated: new Date().toISOString()
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
                relationships: [connection.relationship]
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
                total_health_issues: new Set(connections.map(c => c.health_issue)).size
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
                    total_connections: 1
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
                    total_connections: 1
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
                        has_full_text: conn.has_full_text_sources > 0
                    });
                }
            }
        });
        
        graph.edges = Array.from(edgeMap.values());
        
        this.saveJSON(this.knowledgeGraphFile, graph);
        return graph;
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
            cache: cacheStats
        };
    }
}

async function processPubMedPapers(query, maxPapers, callbacks = {}) {
    const { onProgress, onLog } = callbacks;
    const startTime = Date.now();
    const processor = new DataProcessor();
    
    try {
        if (onLog) onLog(`Starting PubMed search: ${query}`);
        if (onProgress) onProgress(5, 'Searching PubMed...');
        
        // Step 1: Search PubMed
        const searchResults = await processor.pubmedFetcher.search(query, maxPapers);
        
        if (onLog) onLog(`Found ${searchResults.total} papers, fetching ${searchResults.ids.length}`);
        if (onProgress) onProgress(10, `Found ${searchResults.total} papers`);
        
        // Get cached papers stats
        const cacheStats = processor.pubmedFetcher.getCacheStats();
        if (onLog) onLog(`Cache: ${cacheStats.total} papers (${cacheStats.withFullText} with full text)`);
        
        // Step 2: Fetch papers (skip already cached)
        const papers = await processor.pubmedFetcher.fetchMultiplePapers(
            searchResults.ids.slice(0, maxPapers),
            (progress, step) => {
                if (onProgress) onProgress(10 + progress * 0.25, step);
            },
            false // Don't force refresh
        );
        
        if (onLog) onLog(`Fetched ${papers.length} papers (${papers.filter(p => p.hasFullText).length} with full text)`);
        if (onProgress) onProgress(35, 'Processing papers...');
        
        // Step 3: Process papers (skip already processed)
        const newConnections = await processor.processPapers(papers, onProgress);
        
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
            query: query
        };
        
    } catch (error) {
        if (onLog) onLog(`Error: ${error.message}`, 'error');
        throw error;
    }
}

module.exports = { processPubMedPapers, DataProcessor };