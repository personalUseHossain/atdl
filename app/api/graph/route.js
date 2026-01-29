import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import KnowledgeGraph from '@/models/KnowledgeGraph';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await new Promise((resolve, reject) => {
      authenticate(request, {
        json: (data) => reject(data),
        status: (code) => ({
          json: (data) => reject(data)
        })
      }, (err) => {
        if (err) reject(err);
        else resolve(request.user);
      });
    });
    
    const user = authResult;
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get('instanceId');
    const graphId = searchParams.get('graphId');
    const type = searchParams.get('type') || 'full';
    const limit = parseInt(searchParams.get('limit') || '1');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Get graph data based on parameters
    let knowledgeGraph;
    let query = { user: user._id };
    
    if (graphId) {
      // Get specific graph by ID
      knowledgeGraph = await KnowledgeGraph.findOne({
        _id: graphId,
        user: user._id
      });
    } else if (instanceId) {
      // Get graph for specific worker instance
      knowledgeGraph = await KnowledgeGraph.findOne({
        user: user._id,
        workerInstance: instanceId
      }).sort({ createdAt: -1 });
    } else {
      // Get latest graph
      knowledgeGraph = await KnowledgeGraph.findOne({ user: user._id })
        .sort({ createdAt: -1 });
    }
    
    if (!knowledgeGraph) {
      return Response.json({
        success: false,
        error: 'No graph data available'
      }, { status: 404 });
    }
    
    // Return different formats based on type
    switch (type) {
      case 'nodes':
        return Response.json({
          success: true,
          nodes: knowledgeGraph.nodes || [],
          total: knowledgeGraph.nodes?.length || 0,
          metadata: knowledgeGraph.metadata,
          stats: knowledgeGraph.stats,
          graphId: knowledgeGraph._id
        });
        
      case 'edges':
        return Response.json({
          success: true,
          edges: knowledgeGraph.edges || [],
          total: knowledgeGraph.edges?.length || 0,
          metadata: knowledgeGraph.metadata,
          stats: knowledgeGraph.stats,
          graphId: knowledgeGraph._id
        });
        
      case 'stats':
        return Response.json({
          success: true,
          stats: knowledgeGraph.stats || calculateGraphStats(knowledgeGraph),
          metadata: knowledgeGraph.metadata,
          graphId: knowledgeGraph._id,
          instanceId: knowledgeGraph.workerInstance,
          createdAt: knowledgeGraph.createdAt
        });
        
      case 'summary':
        const summary = {
          id: knowledgeGraph._id,
          instanceId: knowledgeGraph.workerInstance,
          createdAt: knowledgeGraph.createdAt,
          stats: knowledgeGraph.stats || calculateGraphStats(knowledgeGraph),
          metadata: knowledgeGraph.metadata,
          topNodes: getTopNodes(knowledgeGraph, 5),
          topEdges: getTopEdges(knowledgeGraph, 5)
        };
        return Response.json({
          success: true,
          ...summary
        });
        
      case 'history':
        // Get graph history for the user
        const historyQuery = { user: user._id };
        if (instanceId) {
          historyQuery.workerInstance = instanceId;
        }
        
        const graphs = await KnowledgeGraph.find(historyQuery)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select('_id workerInstance createdAt metadata stats nodes edges')
          .lean();
        
        const totalGraphs = await KnowledgeGraph.countDocuments(historyQuery);
        
        const formattedGraphs = graphs.map(g => ({
          id: g._id,
          instanceId: g.workerInstance,
          createdAt: g.createdAt,
          stats: g.stats || calculateGraphStats(g),
          metadata: g.metadata,
          hasData: !!(g.nodes && g.nodes.length > 0)
        }));
        
        return Response.json({
          success: true,
          graphs: formattedGraphs,
          total: totalGraphs,
          page,
          limit,
          pages: Math.ceil(totalGraphs / limit)
        });
        
      case 'export':
        // Return full graph data for export
        return Response.json({
          success: true,
          ...knowledgeGraph.toObject()
        });
        
      default:
        // Return full graph
        return Response.json({
          success: true,
          ...knowledgeGraph.toObject()
        });
    }
    
  } catch (error) {
    console.error('Get graph error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await new Promise((resolve, reject) => {
      authenticate(request, {
        json: (data) => reject(data),
        status: (code) => ({
          json: (data) => reject(data)
        })
      }, (err) => {
        if (err) reject(err);
        else resolve(request.user);
      });
    });
    
    const user = authResult;
    const data = await request.json();
    
    // Validate required fields
    if (!data.nodes || !Array.isArray(data.nodes)) {
      return Response.json({
        success: false,
        error: 'Nodes array is required'
      }, { status: 400 });
    }
    
    if (!data.edges || !Array.isArray(data.edges)) {
      return Response.json({
        success: false,
        error: 'Edges array is required'
      }, { status: 400 });
    }
    
    // Create new graph
    const knowledgeGraph = new KnowledgeGraph({
      user: user._id,
      workerInstance: data.workerInstance,
      nodes: data.nodes,
      edges: data.edges,
      metadata: data.metadata || {
        generated_at: new Date(),
        total_connections: data.edges.length,
        total_drugs: data.nodes.filter(n => n.type === 'drug').length,
        total_health_issues: data.nodes.filter(n => n.type === 'health_issue').length
      },
      stats: data.stats || calculateGraphStats({
        nodes: data.nodes,
        edges: data.edges
      }),
      version: data.version || 1
    });
    
    await knowledgeGraph.save();
    
    return Response.json({
      success: true,
      graphId: knowledgeGraph._id,
      message: 'Graph saved successfully'
    });
    
  } catch (error) {
    console.error('Save graph error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await new Promise((resolve, reject) => {
      authenticate(request, {
        json: (data) => reject(data),
        status: (code) => ({
          json: (data) => reject(data)
        })
      }, (err) => {
        if (err) reject(err);
        else resolve(request.user);
      });
    });
    
    const user = authResult;
    const { searchParams } = new URL(request.url);
    const graphId = searchParams.get('graphId');
    
    if (!graphId) {
      return Response.json({
        success: false,
        error: 'Graph ID is required'
      }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Find and update graph
    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: graphId,
      user: user._id
    });
    
    if (!knowledgeGraph) {
      return Response.json({
        success: false,
        error: 'Graph not found'
      }, { status: 404 });
    }
    
    // Update fields
    if (data.nodes) knowledgeGraph.nodes = data.nodes;
    if (data.edges) knowledgeGraph.edges = data.edges;
    if (data.metadata) knowledgeGraph.metadata = data.metadata;
    if (data.stats) knowledgeGraph.stats = data.stats;
    
    // Recalculate stats if nodes or edges changed
    if (data.nodes || data.edges) {
      knowledgeGraph.stats = calculateGraphStats(knowledgeGraph);
    }
    
    knowledgeGraph.updatedAt = new Date();
    await knowledgeGraph.save();
    
    return Response.json({
      success: true,
      message: 'Graph updated successfully'
    });
    
  } catch (error) {
    console.error('Update graph error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await new Promise((resolve, reject) => {
      authenticate(request, {
        json: (data) => reject(data),
        status: (code) => ({
          json: (data) => reject(data)
        })
      }, (err) => {
        if (err) reject(err);
        else resolve(request.user);
      });
    });
    
    const user = authResult;
    const { searchParams } = new URL(request.url);
    const graphId = searchParams.get('graphId');
    const instanceId = searchParams.get('instanceId');
    
    if (!graphId && !instanceId) {
      return Response.json({
        success: false,
        error: 'Either graphId or instanceId is required'
      }, { status: 400 });
    }
    
    let query;
    if (graphId) {
      query = { _id: graphId, user: user._id };
    } else {
      query = { workerInstance: instanceId, user: user._id };
    }
    
    const result = await KnowledgeGraph.deleteMany(query);
    
    return Response.json({
      success: true,
      message: `Deleted ${result.deletedCount} graph(s) successfully`
    });
    
  } catch (error) {
    console.error('Delete graph error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper functions
function calculateGraphStats(graph) {
  if (!graph || !graph.nodes) return null;
  
  const nodes = graph.nodes;
  const edges = graph.edges || [];
  
  // Count by type
  const drugNodes = nodes.filter(n => n.type === 'drug').length;
  const healthNodes = nodes.filter(n => n.type === 'health_issue').length;
  
  // Calculate degree distribution
  const degrees = nodes.map(node => {
    return edges.filter(e => e.source === node.id || e.target === node.id).length;
  });
  
  const maxDegree = Math.max(...degrees, 0);
  const minDegree = Math.min(...degrees, 0);
  const avgDegree = degrees.length > 0 
    ? parseFloat((degrees.reduce((a, b) => a + b, 0) / degrees.length).toFixed(2))
    : 0;
    
  // Edge strength distribution
  const strengthDist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
  edges.forEach(edge => {
    const strength = edge.value || 1;
    strengthDist[strength] = (strengthDist[strength] || 0) + 1;
  });
  
  // Node size distribution
  const sizes = nodes.map(n => n.size || 0);
  const avgSize = sizes.length > 0 
    ? parseFloat((sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(2))
    : 0;
  
  // Calculate graph density
  const n = nodes.length;
  const possibleEdges = n * (n - 1) / 2;
  const density = possibleEdges > 0 ? edges.length / possibleEdges : 0;
  
  // Find connected components
  const visited = new Set();
  const components = [];
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component = [];
      const stack = [node.id];
      
      while (stack.length > 0) {
        const current = stack.pop();
        if (!visited.has(current)) {
          visited.add(current);
          component.push(current);
          
          // Find connected nodes
          const connectedEdges = edges.filter(e => e.source === current || e.target === current);
          connectedEdges.forEach(edge => {
            const neighbor = edge.source === current ? edge.target : edge.source;
            if (!visited.has(neighbor)) {
              stack.push(neighbor);
            }
          });
        }
      }
      
      if (component.length > 0) {
        components.push(component);
      }
    }
  });
  
  const largestComponent = components.length > 0 
    ? Math.max(...components.map(c => c.length))
    : 0;
  
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    drugNodes,
    healthNodes,
    maxDegree,
    minDegree,
    avgDegree,
    avgNodeSize: avgSize,
    strengthDistribution: strengthDist,
    density: parseFloat(density.toFixed(4)),
    connectedComponents: components.length,
    largestComponentSize: largestComponent,
    connectivityRatio: largestComponent / Math.max(nodes.length, 1)
  };
}

function getTopNodes(graph, limit = 5) {
  if (!graph || !graph.nodes || !graph.edges) return [];
  
  const nodesWithConnections = graph.nodes.map(node => {
    const connections = graph.edges.filter(e => 
      e.source === node.id || e.target === node.id
    ).length;
    
    return {
      id: node.id,
      label: node.label,
      type: node.type,
      connections,
      size: node.size || 0
    };
  });
  
  return nodesWithConnections
    .sort((a, b) => b.connections - a.connections)
    .slice(0, limit);
}

function getTopEdges(graph, limit = 5) {
  if (!graph || !graph.edges) return [];
  
  // Get node labels for display
  const nodeMap = {};
  if (graph.nodes) {
    graph.nodes.forEach(node => {
      nodeMap[node.id] = node.label;
    });
  }
  
  const edgesWithInfo = graph.edges.map(edge => ({
    id: edge.id,
    source: nodeMap[edge.source] || edge.source,
    target: nodeMap[edge.target] || edge.target,
    strength: edge.value || 1,
    relationship: edge.relationship,
    papers: edge.papers,
    hasFullText: edge.has_full_text
  }));
  
  return edgesWithInfo
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit);
}

// Additional endpoint for graph analysis
export async function GET_ANALYSIS(request) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const authResult = await new Promise((resolve, reject) => {
      authenticate(request, {
        json: (data) => reject(data),
        status: (code) => ({
          json: (data) => reject(data)
        })
      }, (err) => {
        if (err) reject(err);
        else resolve(request.user);
      });
    });
    
    const user = authResult;
    const { searchParams } = new URL(request.url);
    const graphId = searchParams.get('graphId');
    const analysisType = searchParams.get('type') || 'centrality';
    
    // Find graph
    const knowledgeGraph = await KnowledgeGraph.findOne({
      _id: graphId,
      user: user._id
    });
    
    if (!knowledgeGraph) {
      return Response.json({
        success: false,
        error: 'Graph not found'
      }, { status: 404 });
    }
    
    const { nodes, edges } = knowledgeGraph;
    
    switch (analysisType) {
      case 'centrality':
        // Calculate degree centrality
        const centrality = nodes.map(node => {
          const degree = edges.filter(e => 
            e.source === node.id || e.target === node.id
          ).length;
          
          return {
            id: node.id,
            label: node.label,
            type: node.type,
            degree,
            normalizedDegree: degree / Math.max(nodes.length - 1, 1)
          };
        }).sort((a, b) => b.degree - a.degree);
        
        return Response.json({
          success: true,
          type: 'centrality',
          centrality,
          topCentralNodes: centrality.slice(0, 10)
        });
        
      case 'clustering':
        // Calculate basic clustering metrics
        const nodeConnections = {};
        nodes.forEach(node => {
          const connectedEdges = edges.filter(e => 
            e.source === node.id || e.target === node.id
          );
          const connectedNodes = connectedEdges.map(e => 
            e.source === node.id ? e.target : e.source
          );
          nodeConnections[node.id] = connectedNodes;
        });
        
        const clustering = nodes.map(node => {
          const neighbors = nodeConnections[node.id] || [];
          if (neighbors.length < 2) return 0;
          
          let triangles = 0;
          for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
              if (nodeConnections[neighbors[i]]?.includes(neighbors[j])) {
                triangles++;
              }
            }
          }
          
          const possibleTriangles = neighbors.length * (neighbors.length - 1) / 2;
          return possibleTriangles > 0 ? triangles / possibleTriangles : 0;
        });
        
        const avgClustering = clustering.length > 0 
          ? clustering.reduce((a, b) => a + b, 0) / clustering.length
          : 0;
          
        return Response.json({
          success: true,
          type: 'clustering',
          avgClustering: parseFloat(avgClustering.toFixed(4)),
          nodeClustering: clustering
        });
        
      case 'community':
        // Simple community detection (connected components)
        const visited = new Set();
        const communities = [];
        
        nodes.forEach(node => {
          if (!visited.has(node.id)) {
            const community = [];
            const stack = [node.id];
            
            while (stack.length > 0) {
              const current = stack.pop();
              if (!visited.has(current)) {
                visited.add(current);
                community.push(current);
                
                const connectedEdges = edges.filter(e => e.source === current || e.target === current);
                connectedEdges.forEach(edge => {
                  const neighbor = edge.source === current ? edge.target : edge.source;
                  if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                  }
                });
              }
            }
            
            if (community.length > 0) {
              communities.push({
                id: communities.length + 1,
                size: community.length,
                nodes: community,
                density: 0 // Could calculate intra-community density
              });
            }
          }
        });
        
        return Response.json({
          success: true,
          type: 'community',
          communities,
          totalCommunities: communities.length,
          largestCommunity: Math.max(...communities.map(c => c.size), 0)
        });
        
      default:
        return Response.json({
          success: false,
          error: 'Invalid analysis type'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Graph analysis error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}