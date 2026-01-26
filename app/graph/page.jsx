// app/graph/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Network as NetworkIcon,
  Filter,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Info,
  GitBranch,
  Circle,
  Hexagon,
  Star,
  BarChart3,
  Settings
} from 'lucide-react';

// Dynamically import Vis.js to avoid SSR issues
const GraphVisualization = dynamic(
  () => import('@/app/components/GraphVisualization'),
  { ssr: false }
);

export default function KnowledgeGraphPage() {
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minStrength: 1,
    maxStrength: 5,
    nodeTypes: ['drug', 'health_issue'],
    showLabels: true,
    physics: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [graphStats, setGraphStats] = useState(null);
  const [layout, setLayout] = useState('force'); // force, hierarchical, radial

  // Load graph data
  const loadGraphData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/worker/results');
      const data = await response.json();
      
      if (data.success && data.results.knowledgeGraph) {
        setGraphData(data.results.knowledgeGraph);
        
        // Calculate stats
        const stats = calculateGraphStats(data.results.knowledgeGraph);
        setGraphStats(stats);
      } else {
        setError('No graph data available. Please run the worker first.');
      }
    } catch (err) {
      setError('Failed to load graph data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGraphStats = (graph) => {
    if (!graph || !graph.nodes) return null;
    
    const nodes = graph.nodes;
    const edges = graph.edges;
    
    // Count by type
    const drugNodes = nodes.filter(n => n.type === 'drug').length;
    const healthNodes = nodes.filter(n => n.type === 'health_issue').length;
    
    // Calculate average connections per node
    const connectionsPerNode = nodes.map(node => {
      const connectedEdges = edges.filter(e => 
        e.source === node.id || e.target === node.id
      ).length;
      return connectedEdges;
    });
    
    const avgConnections = connectionsPerNode.length > 0 
      ? (connectionsPerNode.reduce((a, b) => a + b, 0) / connectionsPerNode.length).toFixed(2)
      : 0;
    
    // Find most connected nodes
    const topNodes = nodes
      .map(node => ({
        ...node,
        connections: edges.filter(e => 
          e.source === node.id || e.target === node.id
        ).length
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);
    
    // Edge strength distribution
    const strengthDistribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    edges.forEach(edge => {
      const strength = edge.value || 1;
      strengthDistribution[strength] = (strengthDistribution[strength] || 0) + 1;
    });
    
    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      drugNodes,
      healthNodes,
      avgConnections,
      topNodes,
      strengthDistribution,
      density: edges.length / (nodes.length * (nodes.length - 1) / 2) * 100
    };
  };

  // Initial load
  useEffect(() => {
    loadGraphData();
  }, []);

  // Handle node selection
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    
    // If this node has connections, highlight them
    if (graphData) {
      const connectedEdges = graphData.edges.filter(e => 
        e.source === node.id || e.target === node.id
      );
      console.log('Connected edges:', connectedEdges);
    }
  };

  // Handle edge selection
  const handleEdgeSelect = (edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    
    // Find source and target nodes
    if (graphData) {
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      console.log('Edge connects:', sourceNode?.label, '→', targetNode?.label);
    }
  };

  // Apply filters to graph data
  const getFilteredGraph = () => {
    if (!graphData) return null;
    
    let filteredNodes = [...graphData.nodes];
    let filteredEdges = [...graphData.edges];
    
    // Filter by node type
    filteredNodes = filteredNodes.filter(node => 
      filters.nodeTypes.includes(node.type)
    );
    
    // Filter edges by strength
    filteredEdges = filteredEdges.filter(edge => {
      const strength = edge.value || 1;
      return strength >= filters.minStrength && strength <= filters.maxStrength;
    });
    
    // Only keep edges where both nodes are in filteredNodes
    const validNodeIds = new Set(filteredNodes.map(n => n.id));
    filteredEdges = filteredEdges.filter(edge => 
      validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
    );
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.label.toLowerCase().includes(searchLower)
      );
      
      const searchedNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(edge => 
        searchedNodeIds.has(edge.source) && searchedNodeIds.has(edge.target)
      );
    }
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: graphData.metadata
    };
  };

  // Export graph as JSON
  const exportGraph = () => {
    if (!graphData) return;
    
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `knowledge-graph-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      minStrength: 1,
      maxStrength: 5,
      nodeTypes: ['drug', 'health_issue'],
      showLabels: true,
      physics: true
    });
    setSearchTerm('');
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <NetworkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Graph Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadGraphData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredGraph = getFilteredGraph();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
              <p className="text-sm text-gray-600">
                Interactive visualization of drug-health connections
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportGraph}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={loadGraphData}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Search</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search nodes..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Reset
                </button>
              </div>
              
              {/* Strength Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Strength: {filters.minStrength}-{filters.maxStrength}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={filters.minStrength}
                    onChange={(e) => setFilters({...filters, minStrength: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={filters.maxStrength}
                    onChange={(e) => setFilters({...filters, maxStrength: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
              </div>

              {/* Node Types */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Types
                </label>
                <div className="space-y-2">
                  {['drug', 'health_issue'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.nodeTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({
                              ...filters,
                              nodeTypes: [...filters.nodeTypes, type]
                            });
                          } else {
                            setFilters({
                              ...filters,
                              nodeTypes: filters.nodeTypes.filter(t => t !== type)
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {type.replace('_', ' ')}s
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showLabels}
                    onChange={(e) => setFilters({...filters, showLabels: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Labels</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.physics}
                    onChange={(e) => setFilters({...filters, physics: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Physics Simulation</span>
                </label>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Legend</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Drug/Compound</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-700">Health Issue</span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Edge Strength:</div>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(strength => (
                      <div key={strength} className="flex items-center">
                        <div 
                          className="h-1 rounded"
                          style={{
                            width: `${strength * 4}px`,
                            backgroundColor: strength >= 4 ? '#10b981' : 
                                           strength >= 3 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                        <Star className="h-3 w-3 text-yellow-500 ml-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {graphStats && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Graph Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Nodes:</span>
                    <span className="text-sm font-medium">{graphStats.totalNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Edges:</span>
                    <span className="text-sm font-medium">{graphStats.totalEdges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Drug Nodes:</span>
                    <span className="text-sm font-medium">{graphStats.drugNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Health Nodes:</span>
                    <span className="text-sm font-medium">{graphStats.healthNodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Connections:</span>
                    <span className="text-sm font-medium">{graphStats.avgConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Graph Density:</span>
                    <span className="text-sm font-medium">{graphStats.density.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Graph Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Graph Controls */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                      Showing {filteredGraph?.nodes?.length || 0} nodes and {filteredGraph?.edges?.length || 0} edges
                    </div>
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Search: "{searchTerm}"
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value)}
                      className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="force">Force Layout</option>
                      <option value="hierarchical">Hierarchical</option>
                      <option value="radial">Radial Layout</option>
                    </select>
                    <button
                      onClick={() => setFilters({...filters, physics: !filters.physics})}
                      className={`p-2 rounded ${filters.physics ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                      title="Toggle Physics"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Graph Visualization */}
              <div className="relative" style={{ height: '600px' }}>
                {filteredGraph ? (
                  <GraphVisualization
                    graphData={filteredGraph}
                    onNodeSelect={handleNodeSelect}
                    onEdgeSelect={handleEdgeSelect}
                    options={{
                      layout: layout,
                      physics: filters.physics,
                      showLabels: filters.showLabels,
                      nodeColors: {
                        drug: '#4A90E2',
                        health_issue: '#50E3C2'
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <NetworkIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No data to display</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selection Details */}
              {(selectedNode || selectedEdge) && (
                <div className="border-t border-gray-200">
                  <div className="px-4 py-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedNode ? 'Selected Node' : 'Selected Connection'}
                    </h3>
                    
                    {selectedNode && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">Label</div>
                          <div className="text-lg font-medium">{selectedNode.label}</div>
                        </div>
                        <div className="flex space-x-4">
                          <div>
                            <div className="text-sm text-gray-500">Type</div>
                            <div className="text-sm font-medium capitalize">
                              {selectedNode.type.replace('_', ' ')}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Connections</div>
                            <div className="text-sm font-medium">{selectedNode.total_connections || 0}</div>
                          </div>
                        </div>
                        {selectedNode.size && (
                          <div>
                            <div className="text-sm text-gray-500">Node Size</div>
                            <div className="text-sm font-medium">{selectedNode.size}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedEdge && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Strength</div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (selectedEdge.value || 1) 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium">
                                {selectedEdge.value || 1}/5
                              </span>
                            </div>
                          </div>
                          {selectedEdge.papers && (
                            <div>
                              <div className="text-sm text-gray-500">Supporting Papers</div>
                              <div className="text-sm font-medium">{selectedEdge.papers}</div>
                            </div>
                          )}
                        </div>
                        {selectedEdge.relationship && (
                          <div>
                            <div className="text-sm text-gray-500">Relationship</div>
                            <div className="text-sm font-medium capitalize">{selectedEdge.relationship}</div>
                          </div>
                        )}
                        {selectedEdge.has_full_text && (
                          <div className="text-sm text-green-600">
                            ✓ Has full text evidence
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Graph Info Footer */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Tip:</span> Click and drag to move nodes. Scroll to zoom.
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Drag: Move</span>
                    <span>Scroll: Zoom</span>
                    <span>Double-click: Focus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Connected Nodes */}
            {graphStats?.topNodes && graphStats.topNodes.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Connected Nodes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {graphStats.topNodes.map((node, index) => (
                    <div key={node.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: node.type === 'drug' ? '#4A90E2' : '#50E3C2'
                            }}
                          ></div>
                          <span className="font-medium">{node.label}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="text-sm text-gray-600 capitalize mb-1">
                        {node.type.replace('_', ' ')}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Connections:</span>
                        <span className="font-medium">{node.connections}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}