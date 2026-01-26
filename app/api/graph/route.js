// app/api/graph/route.js
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full';
    
    const dataDir = path.join(process.cwd(), 'data');
    const graphFile = path.join(dataDir, 'knowledge_graph.json');
    
    if (!fs.existsSync(graphFile)) {
      return Response.json({
        success: false,
        error: 'No graph data available. Please run the worker first.'
      }, { status: 404 });
    }
    
    const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
    
    // Return different formats based on type
    switch (type) {
      case 'nodes':
        return Response.json({
          success: true,
          nodes: graphData.nodes || [],
          total: graphData.nodes?.length || 0
        });
        
      case 'edges':
        return Response.json({
          success: true,
          edges: graphData.edges || [],
          total: graphData.edges?.length || 0
        });
        
      case 'stats':
        const stats = calculateGraphStats(graphData);
        return Response.json({
          success: true,
          stats: stats
        });
        
      default:
        return Response.json({
          success: true,
          ...graphData
        });
    }
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function calculateGraphStats(graph) {
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