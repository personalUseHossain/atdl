const fs = require('fs');
const path = require('path');
const { processPubMedPapers } = require('./processor');
const WorkerInstance = require('@/models/WorkerInstance');
const Connection = require('@/models/Connection');
const ProcessedPaper = require('@/models/ProcessedPaper');
const KnowledgeGraph = require('@/models/KnowledgeGraph');
const ProcessingHistory = require('@/models/ProcessingHistory');
const User = require('@/models/User');

class MultiUserWorkerManager {
  constructor() {
    this.activeWorkers = new Map(); // sessionId -> worker data
    this.saveQueue = new Map(); // sessionId -> save queue
    this.isSaving = new Map(); // sessionId -> boolean flag
  }

  generateSessionId(userId) {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createWorkerInstance(userId, query, maxPapers, metadata = {}) {
    const sessionId = this.generateSessionId(userId);
    
    const workerInstance = new WorkerInstance({
      user: userId,
      sessionId,
      query,
      maxPapers,
      status: 'idle',
      progress: 0,
      currentStep: 'Initializing...',
      metadata: {
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        startedAt: new Date(),
        lastHeartbeat: new Date()
      },
      logs: [] // Initialize empty logs array
    });

    await workerInstance.save();
    
    // Create user-specific data directory
    const userDataDir = path.join(process.cwd(), 'temp', 'users', userId.toString());
    const instanceDir = path.join(userDataDir, 'instances', sessionId);
    
    fs.mkdirSync(instanceDir, { recursive: true });
    
    workerInstance.dataFiles = {
      connectionsFile: path.join(instanceDir, 'connections.json'),
      knowledgeGraphFile: path.join(instanceDir, 'knowledge_graph.json'),
      processedPapersFile: path.join(instanceDir, 'processed_papers.json'),
      processingHistoryFile: path.join(instanceDir, 'processing_history.json'),
      cacheDir: path.join(instanceDir, 'cache')
    };
    
    await workerInstance.save();
    
    return workerInstance;
  }

  async startProcessing(userId, query, maxPapers, metadata = {}) {
    try {
      // Create new worker instance
      const workerInstance = await this.createWorkerInstance(userId, query, maxPapers, metadata);
      
      // Start processing in background (don't await)
      this.processInBackground(workerInstance).catch(error => {
        console.error('Background processing error:', error);
      });
      
      return {
        success: true,
        sessionId: workerInstance.sessionId,
        message: 'Worker started successfully'
      };
    } catch (error) {
      console.error('Error starting worker:', error);
      throw error;
    }
  }

  // Debounced save function to prevent parallel saves
  async debouncedSave(workerInstance, updateFn) {
    const sessionId = workerInstance.sessionId;
    
    // Apply the update function
    if (updateFn) {
      updateFn(workerInstance);
    }
    
    // Initialize queue for this session
    if (!this.saveQueue.has(sessionId)) {
      this.saveQueue.set(sessionId, []);
      this.isSaving.set(sessionId, false);
    }
    
    // Add to queue
    this.saveQueue.get(sessionId).push({ workerInstance });
    
    // Start saving if not already saving
    if (!this.isSaving.get(sessionId)) {
      this.processSaveQueue(sessionId);
    }
  }

  async processSaveQueue(sessionId) {
    if (this.isSaving.get(sessionId)) return;
    
    this.isSaving.set(sessionId, true);
    
    while (this.saveQueue.get(sessionId)?.length > 0) {
      const item = this.saveQueue.get(sessionId).shift();
      
      try {
        // Save the document
        await item.workerInstance.save();
      } catch (error) {
        console.error(`Error saving worker instance ${sessionId}:`, error);
        
        // If it's a parallel save error, retry once
        if (error.name === 'ParallelSaveError') {
          try {
            // Reload the document and retry
            const freshInstance = await WorkerInstance.findById(item.workerInstance._id);
            if (freshInstance) {
              // Merge changes
              Object.assign(freshInstance, item.workerInstance.toObject ? item.workerInstance.toObject() : item.workerInstance);
              await freshInstance.save();
            }
          } catch (retryError) {
            console.error(`Retry save failed for ${sessionId}:`, retryError);
          }
        }
      }
      
      // Small delay between saves
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isSaving.set(sessionId, false);
  }

  async processInBackground(workerInstance) {
    const sessionId = workerInstance.sessionId;
    
    try {
      // Update status
      await this.debouncedSave(workerInstance, (wi) => {
        wi.status = 'running';
        wi.currentStep = 'Starting PubMed search...';
      });
      
      // Add to active workers
      this.activeWorkers.set(sessionId, {
        instance: workerInstance,
        user: workerInstance.user
      });
      
      // Custom processor that saves to MongoDB
      const customProcessor = async (papers, onProgress = null) => {
        const userConnections = [];
        let papersWithFullText = 0;
        let papersProcessed = 0;
        
        // Load AI Extractor
        const AIExtractor = require('./extractor');
        const aiExtractor = new AIExtractor();
        
        for (let i = 0; i < papers.length; i++) {
          const paper = papers[i];
          
          // Check if paper already processed by this user
          const existingPaper = await ProcessedPaper.findOne({
            user: workerInstance.user,
            pmid: paper.pmid,
            processed: true
          });
          
          if (existingPaper) {
            console.log(`Skipping already processed paper: ${paper.pmid}`);
            continue;
          }
          
          try {
            const hasFullText = paper.hasFullText || false;
            if (hasFullText) papersWithFullText++;
            
            const connections = await aiExtractor.extractConnections(paper);
            
            if (connections && connections.length > 0) {
              // Save connections to database
              for (const conn of connections) {
                await this.saveConnection(workerInstance.user, workerInstance._id, conn);
              }
              
              userConnections.push(...connections);
              
              // Mark paper as processed in database
              await this.markPaperAsProcessed(
                workerInstance.user,
                paper,
                connections.length,
                hasFullText
              );
            }
            
            papersProcessed++;
            
            if (onProgress) {
              const progress = 25 + Math.round(((i + 1) / papers.length) * 50);
              onProgress(progress, `Extracted from ${papersProcessed}/${papers.length} papers`);
            }
            
          } catch (error) {
            console.error(`Error processing paper ${paper.pmid}:`, error.message);
            
            // Mark as failed in database
            await this.markPaperAsProcessed(
              workerInstance.user,
              {
                ...paper,
                processed: false,
                error: error.message
              },
              0,
              paper.hasFullText || false
            );
          }
        }
        
        return userConnections;
      };
      
      // Run the processing
      const results = await processPubMedPapers(
        workerInstance.query,
        workerInstance.maxPapers,
        {
          onProgress: async (progress, step) => {
            // Use debounced save for progress updates
            await this.debouncedSave(workerInstance, (wi) => {
              wi.progress = progress;
              wi.currentStep = step;
              wi.metadata.lastHeartbeat = new Date();
            });
            
            // Add log (also debounced)
            await this.debouncedSave(workerInstance, (wi) => {
              if (wi.logs.length > 1000) {
                wi.logs = wi.logs.slice(-1000);
              }
              wi.logs.push({
                timestamp: new Date(),
                message: `Progress: ${progress}% - ${step}`,
                type: 'info'
              });
            });
          },
          onLog: async (message, type = 'info') => {
            // Use debounced save for logs
            await this.debouncedSave(workerInstance, (wi) => {
              if (wi.logs.length > 1000) {
                wi.logs = wi.logs.slice(-1000);
              }
              wi.logs.push({
                timestamp: new Date(),
                message,
                type
              });
            });
          }
        },
        customProcessor,
        workerInstance.user.toString(),
        sessionId
      );
      
      // Process and rank connections from database
      const rankedConnections = await this.processAndRankConnections(workerInstance.user);
      
      // Build knowledge graph
      const knowledgeGraph = await this.buildKnowledgeGraph(workerInstance.user, rankedConnections);
      
      // Save knowledge graph to database
      await this.saveKnowledgeGraph(workerInstance.user, workerInstance._id, knowledgeGraph);
      
      // Add to processing history
      await this.addToProcessingHistory(
        workerInstance.user,
        workerInstance._id,
        workerInstance.query,
        results.totalPapers,
        results.totalConnections,
        rankedConnections.length,
        results.duration
      );
      
      // Update worker instance with results
      await this.debouncedSave(workerInstance, (wi) => {
        wi.status = 'completed';
        wi.progress = 100;
        wi.currentStep = 'Processing completed';
        wi.results = {
          totalPapers: results.totalPapers,
          totalConnections: results.totalConnections,
          uniqueConnections: rankedConnections.length,
          duration: results.duration,
          startedAt: wi.metadata.startedAt,
          completedAt: new Date()
        };
      });
      
      // Update user stats
      await User.findByIdAndUpdate(workerInstance.user, {
        $inc: {
          'stats.totalSearches': 1,
          'stats.totalPapersProcessed': results.totalPapers,
          'stats.totalConnectionsFound': results.totalConnections
        },
        'stats.lastActive': new Date()
      });
      
      console.log(`Worker ${sessionId} completed successfully`);
      
    } catch (error) {
      console.error('Worker processing error:', error);
      
      // Update worker instance with error
      await this.debouncedSave(workerInstance, (wi) => {
        wi.status = 'error';
        wi.error = error.message;
        wi.currentStep = `Error: ${error.message}`;
        
        wi.logs.push({
          timestamp: new Date(),
          message: `Processing failed: ${error.message}`,
          type: 'error'
        });
      });
    } finally {
      // Remove from active workers
      this.activeWorkers.delete(sessionId);
      this.saveQueue.delete(sessionId);
      this.isSaving.delete(sessionId);
    }
  }

async saveConnection(userId, workerInstanceId, connection) {
  try {
    // Check if connection already exists for this user
    const existingConnection = await Connection.findOne({
      user: userId,
      drug: connection.drug,
      health_issue: connection.health_issue
    });
    
    if (existingConnection) {
      // Update existing connection
      const supportingPapers = new Set([...existingConnection.supporting_papers, connection.paper_id]);
      
      existingConnection.supporting_papers = Array.from(supportingPapers);
      existingConnection.total_papers = supportingPapers.size;
      
      // Update relationships
      if (connection.relationship && !existingConnection.relationships.includes(connection.relationship)) {
        existingConnection.relationships.push(connection.relationship);
      }
      
      // Update extraction sources
      if (connection.extraction_source && 
          !existingConnection.extraction_sources.includes(connection.extraction_source)) {
        existingConnection.extraction_sources.push(connection.extraction_source);
      }
      
      // Update full text count
      if (connection.has_full_text) {
        existingConnection.has_full_text_sources += 1;
      }
      
      // Update years
      if (connection.paper_year) {
        if (!existingConnection.first_paper_year || connection.paper_year < existingConnection.first_paper_year) {
          existingConnection.first_paper_year = connection.paper_year;
        }
        if (!existingConnection.latest_paper_year || connection.paper_year > existingConnection.latest_paper_year) {
          existingConnection.latest_paper_year = connection.paper_year;
        }
      }
      
      // Recalculate strength
      existingConnection.strength = this.calculateConnectionStrength(existingConnection);
      existingConnection.last_updated = new Date();
      
      await existingConnection.save();
      return existingConnection;
    } else {
      // Clean up paper_authors - ensure it's an array of objects
      let paperAuthors = [];
      if (connection.paper_authors) {
        if (typeof connection.paper_authors === 'string') {
          try {
            // Try to parse if it's a JSON string
            paperAuthors = JSON.parse(connection.paper_authors);
          } catch (e) {
            // If parsing fails, create a simple array
            paperAuthors = [{ name: connection.paper_authors }];
          }
        } else if (Array.isArray(connection.paper_authors)) {
          paperAuthors = connection.paper_authors.map(author => {
            if (typeof author === 'string') {
              return { name: author };
            }
            return author;
          });
        }
      }
      
      // Clean up paper_authors array to ensure proper format
      const cleanPaperAuthors = paperAuthors.map(author => ({
        lastName: author.lastName || author.lastname || '',
        foreName: author.foreName || author.forename || author.firstName || '',
        initials: author.initials || '',
        affiliation: author.affiliation || ''
      }));
      
      // Create new connection
      const newConnection = new Connection({
        user: userId,
        workerInstance: workerInstanceId,
        ...connection,
        paper_authors: cleanPaperAuthors, // Use cleaned authors
        supporting_papers: [connection.paper_id],
        total_papers: 1,
        first_paper_year: connection.paper_year,
        latest_paper_year: connection.paper_year,
        extraction_sources: connection.extraction_source ? [connection.extraction_source] : [],
        has_full_text_sources: connection.has_full_text ? 1 : 0,
        relationships: connection.relationship ? [connection.relationship] : ['neutral'],
        strength: this.calculateConnectionStrength({
          ...connection,
          total_papers: 1,
          has_full_text_sources: connection.has_full_text ? 1 : 0
        })
      });
      
      await newConnection.save();
      return newConnection;
    }
  } catch (error) {
    console.error('Error saving connection:', error);
    
    // Log the problematic data for debugging
    console.error('Problematic connection data:', {
      drug: connection.drug,
      health_issue: connection.health_issue,
      paper_authors: connection.paper_authors,
      paper_authors_type: typeof connection.paper_authors,
      paper_authors_is_array: Array.isArray(connection.paper_authors)
    });
    
    throw error;
  }
}

  calculateConnectionStrength(connection) {
  let strength = 1;
  
  // Factor 1: Number of supporting papers (MOST IMPORTANT - 40% weight)
  const totalPapers = connection.total_papers || 1;
  let paperFactor = 1;
  if (totalPapers >= 10) paperFactor = 5;
  else if (totalPapers >= 7) paperFactor = 4;
  else if (totalPapers >= 4) paperFactor = 3;
  else if (totalPapers >= 2) paperFactor = 2;
  
  // Factor 2: Confidence adjustment (30% weight)
  let confidenceFactor = 1;
  if (connection.confidence === 'High') {
    confidenceFactor = 5;
  } else if (connection.confidence === 'Medium') {
    confidenceFactor = 3;
  } else if (connection.confidence === 'Low') {
    confidenceFactor = 1;
  }
  
  // Factor 3: Evidence score from individual papers (20% weight)
  const evidenceScore = connection.evidence_score || 
                       (connection.confidence === 'High' ? 5 : 
                        connection.confidence === 'Medium' ? 3 : 1);
  
  // Factor 4: Full text sources boost (5% weight)
  const fullTextFactor = connection.has_full_text_sources > 0 ? 1.5 : 1;
  
  // Factor 5: Study quality - clinical trials get boost (5% weight)
  const studyTypeFactor = connection.study_type && 
                         connection.study_type.toLowerCase().includes('clinical') ? 1.5 : 1;
  
  // Factor 6: Statistical significance (5% weight)
  const statsFactor = connection.statistical_significance ? 1.5 : 1;
  
  // Factor 7: Recency boost for recent papers (last 3 years) (5% weight)
  const currentYear = new Date().getFullYear();
  const recencyFactor = connection.latest_paper_year && 
                       (currentYear - connection.latest_paper_year) <= 3 ? 1.5 : 1;
  
  // Factor 8: Multiple session verification (5% weight)
  const verificationFactor = connection.session_ids && 
                           connection.session_ids.length > 1 ? 1.5 : 1;
  
  // Factor 9: Sample size boost for large studies (5% weight)
  let sampleSizeFactor = 1;
  if (connection.sample_size) {
    const sampleMatch = connection.sample_size.match(/n\s*=\s*(\d+)/i);
    if (sampleMatch) {
      const sampleSize = parseInt(sampleMatch[1]);
      if (sampleSize >= 100) sampleSizeFactor = 1.5;
      else if (sampleSize >= 50) sampleSizeFactor = 1.25;
    }
  }
  
  // Factor 10: Relationship clarity - clear positive/negative gets slight boost (5% weight)
  const relationshipFactor = (connection.relationship === 'positive' || 
                            connection.relationship === 'negative') ? 1.25 : 1;
  
  // Calculate weighted strength (weights sum to 100%)
  strength = (
    (paperFactor * 0.40) +        // 40% - Paper count
    (confidenceFactor * 0.30) +   // 30% - Confidence level
    (evidenceScore * 0.20) +      // 20% - Evidence score
    (fullTextFactor * 0.05) +     // 5% - Full text
    (studyTypeFactor * 0.05) +    // 5% - Study type
    (statsFactor * 0.05) +        // 5% - Statistical significance
    (recencyFactor * 0.05) +      // 5% - Recency
    (verificationFactor * 0.05) + // 5% - Verification
    (sampleSizeFactor * 0.05) +   // 5% - Sample size
    (relationshipFactor * 0.05)   // 5% - Relationship clarity
  );
  
  // Apply consistency rules - confidence should align with strength
  let finalStrength = Math.round(strength);
  
  // Enforce minimum strength based on confidence
  if (connection.confidence === 'High' && finalStrength < 3) {
    finalStrength = 3; // High confidence connections should be at least 3 stars
  }
  
  if (connection.confidence === 'Low' && finalStrength > 3) {
    finalStrength = 2; // Low confidence connections shouldn't be more than 2 stars
  }
  
  // Ensure confidence matches strength range
  if (finalStrength >= 4 && connection.confidence === 'Low') {
    // If we somehow got 4+ stars with Low confidence, upgrade confidence
    connection.confidence = 'Medium';
  }
  
  if (finalStrength <= 2 && connection.confidence === 'High') {
    // If we somehow got 1-2 stars with High confidence, downgrade confidence
    connection.confidence = 'Medium';
  }
  
  return Math.max(1, Math.min(5, finalStrength));
}

  async markPaperAsProcessed(userId, paper, connectionsFound, hasFullText) {
  try {
    // First, check if paper already exists
    const existingPaper = await ProcessedPaper.findOne({
      user: userId,
      pmid: paper.pmid
    });
    
    if (existingPaper) {
      // Update existing paper
      existingPaper.connections_found = connectionsFound;
      existingPaper.processed = connectionsFound > 0 || paper.processed === true;
      existingPaper.has_full_text = hasFullText;
      existingPaper.error = paper.error;
      existingPaper.processed_at = new Date();
      
      if (paper.title) existingPaper.title = paper.title;
      if (paper.journal) existingPaper.journal = paper.journal;
      if (paper.year) existingPaper.year = paper.year;
      
      // Update paper data if provided
      if (paper.abstract || paper.authors || paper.keywords || paper.doi || paper.pmcId || paper.meshTerms) {
        existingPaper.paper_data = {
          abstract: paper.abstract || existingPaper.paper_data?.abstract,
          authors: this.cleanAuthors(paper.authors) || existingPaper.paper_data?.authors,
          keywords: paper.keywords || existingPaper.paper_data?.keywords,
          doi: paper.doi || existingPaper.paper_data?.doi,
          pmcId: paper.pmcId || existingPaper.paper_data?.pmcId,
          meshTerms: paper.meshTerms || existingPaper.paper_data?.meshTerms
        };
      }
      
      await existingPaper.save();
      return existingPaper;
    } else {
      // Clean authors data
      const cleanAuthors = this.cleanAuthors(paper.authors);
      
      // Create new processed paper
      const processedPaper = new ProcessedPaper({
        user: userId,
        pmid: paper.pmid,
        title: paper.title,
        journal: paper.journal,
        year: paper.year,
        has_full_text: hasFullText,
        connections_found: connectionsFound,
        processed: connectionsFound > 0 || paper.processed === true,
        error: paper.error,
        paper_data: {
          abstract: paper.abstract,
          authors: cleanAuthors,
          keywords: paper.keywords,
          doi: paper.doi,
          pmcId: paper.pmcId,
          meshTerms: paper.meshTerms
        }
      });
      
      await processedPaper.save();
      return processedPaper;
    }
  } catch (error) {
    console.error('Error marking paper as processed:', error);
    
    // If it's a duplicate key error, that's okay - paper was already processed
    if (error.code === 11000 || error.name === 'MongoServerError') {
      console.log(`Paper ${paper.pmid} already processed for user ${userId}`);
      return null;
    }
    
    throw error;
  }
}

// Helper method to clean authors data
cleanAuthors(authors) {
  if (!authors) return [];
  
  if (typeof authors === 'string') {
    try {
      authors = JSON.parse(authors);
    } catch (e) {
      return [{ name: authors }];
    }
  }
  
  if (!Array.isArray(authors)) {
    return [];
  }
  
  return authors.map(author => {
    if (typeof author === 'string') {
      return { name: author };
    }
    
    // Handle different author object formats
    return {
      lastName: author.lastName || author.lastname || '',
      foreName: author.foreName || author.forename || author.firstName || '',
      initials: author.initials || '',
      affiliation: author.affiliation || ''
    };
  });
}

  async processAndRankConnections(userId) {
    // Get all connections for user and sort by strength
    const connections = await Connection.find({ user: userId })
      .sort({ strength: -1, total_papers: -1 })
      .lean();
    
    return connections;
  }

  async buildKnowledgeGraph(userId, connections) {
    const graph = {
      nodes: [],
      edges: [],
      metadata: {
        generated_at: new Date(),
        total_connections: connections.length,
        total_drugs: new Set(connections.map(c => c.drug)).size,
        total_health_issues: new Set(connections.map(c => c.health_issue)).size,
        user_id: userId
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
          user_id: userId
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
          user_id: userId
        });
      } else {
        nodeMap.get(conn.health_issue).total_connections++;
      }
    });
    
    graph.nodes = Array.from(nodeMap.values());
    
    // Add edges with unique IDs
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
            user_id: userId
          });
        }
      }
    });
    
    graph.edges = Array.from(edgeMap.values());
    
    // Calculate statistics
    graph.stats = this.calculateGraphStats(graph);
    
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

  async saveKnowledgeGraph(userId, workerInstanceId, graph) {
    try {
      const knowledgeGraph = new KnowledgeGraph({
        user: userId,
        workerInstance: workerInstanceId,
        ...graph
      });
      
      await knowledgeGraph.save();
      return knowledgeGraph;
    } catch (error) {
      console.error('Error saving knowledge graph:', error);
      throw error;
    }
  }

  async addToProcessingHistory(userId, workerInstanceId, query, totalPapers, newConnections, uniqueConnections, duration) {
    try {
      const historyEntry = new ProcessingHistory({
        user: userId,
        workerInstance: workerInstanceId,
        query: query,
        stats: {
          total_papers_processed: totalPapers,
          new_connections_found: newConnections,
          unique_connections_total: uniqueConnections,
          duration_seconds: duration
        },
        cache_stats: {
          papers_cached: 0,
          full_text_cached: 0,
          papers_processed: totalPapers,
          papers_with_full_text: 0
        },
        status: 'completed'
      });
      
      await historyEntry.save();
    } catch (error) {
      console.error('Error adding to processing history:', error);
    }
  }

  async stopProcessing(sessionId) {
    try {
      const workerInstance = await WorkerInstance.findOne({ sessionId });
      
      if (workerInstance && workerInstance.status === 'running') {
        await this.debouncedSave(workerInstance, (wi) => {
          wi.status = 'stopped';
          wi.currentStep = 'Processing stopped by user';
          
          wi.logs.push({
            timestamp: new Date(),
            message: 'Processing stopped by user',
            type: 'info'
          });
        });
        
        // Remove from active workers
        this.activeWorkers.delete(sessionId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error stopping worker:', error);
      throw error;
    }
  }

  async getWorkerStatus(sessionId) {
    try {
      const workerInstance = await WorkerInstance.findOne({ sessionId });
      
      if (!workerInstance) {
        return null;
      }
      
      return {
        status: workerInstance.status,
        progress: workerInstance.progress,
        currentStep: workerInstance.currentStep,
        results: workerInstance.results,
        error: workerInstance.error,
        logs: workerInstance.logs.slice(-20),
        metadata: workerInstance.metadata,
        createdAt: workerInstance.createdAt,
        updatedAt: workerInstance.updatedAt
      };
    } catch (error) {
      console.error('Error getting worker status:', error);
      throw error;
    }
  }

  async getUserWorkers(userId, limit = 10) {
    try {
      const workers = await WorkerInstance.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      
      return workers;
    } catch (error) {
      console.error('Error getting user workers:', error);
      throw error;
    }
  }

  async getActiveWorkers() {
    return Array.from(this.activeWorkers.values()).map(w => ({
      sessionId: w.instance.sessionId,
      userId: w.user,
      status: w.instance.status,
      progress: w.instance.progress,
      query: w.instance.query
    }));
  }

  // Clean up old data
  async cleanupOldWorkers(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await WorkerInstance.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['completed', 'error', 'stopped'] }
      });
      
      console.log(`Cleaned up ${result.deletedCount} old worker instances`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old workers:', error);
      return 0;
    }
  }
}

// Create singleton instance
const workerManager = new MultiUserWorkerManager();

module.exports = workerManager;