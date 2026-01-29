'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Network as NetworkIcon,
  Filter,
  Search,
  RefreshCw,
  Download,
  Info,
  GitBranch,
  BarChart3,
  Settings,
  Clock,
  Activity,
  Database,
  Users,
  FileText,
  Trash2,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Calendar,
  Hash,
  BarChart,
  PieChart,
  Layers,
  Network,
  Sparkles,
  Zap,
  TrendingUp,
  Cpu,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// Dynamically import Vis.js graph
const GraphVisualization = dynamic(
  () => import('@/app/components/GraphVisualization'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
);

// Custom components (keep your existing StatusBadge and StatCard components)
const StatusBadge = ({ status }) => {
  const statusConfig = {
    idle: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
    running: { color: 'bg-blue-100 text-blue-800', icon: <Activity className="h-3 w-3" /> },
    completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
    error: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    stopped: { color: 'bg-yellow-100 text-yellow-800', icon: <Pause className="h-3 w-3" /> }
  };
  
  const config = statusConfig[status] || statusConfig.idle;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1 capitalize">{status}</span>
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color = 'blue', subtext }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          </div>
          {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

export default function KnowledgeGraphPage() {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minStrength: 1,
    maxStrength: 5,
    nodeTypes: ['drug', 'health_issue'],
    showLabels: true,
    physics: true,
    layout: 'force'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [graphStats, setGraphStats] = useState(null);
  const [instanceStats, setInstanceStats] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'graph', 'list', 'split'
  const [isDeleting, setIsDeleting] = useState(false);
  const [instanceSearchTerm, setInstanceSearchTerm] = useState('');

  // Load worker instances
  const loadWorkerInstances = async () => {
    setIsLoadingInstances(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/worker/instances', {
        headers: {
          "authorization": token
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setInstances(data.instances);
        
        // Calculate instance stats
        const stats = calculateInstanceStats(data.instances);
        setInstanceStats(stats);
        
        // Auto-select first instance with graph if none selected
        if (!selectedInstance && data.instances.length > 0) {
          const firstWithGraph = data.instances.find(inst => inst.hasGraph);
          if (firstWithGraph) {
            setSelectedInstance(firstWithGraph);
            loadGraphData(firstWithGraph._id);
          }
        }
      } else {
        setError('Failed to load worker instances');
      }
    } catch (err) {
      console.error('Error loading instances:', err);
      setError('Failed to load worker instances: ' + err.message);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  // Load graph data for selected instance
  const loadGraphData = async (instanceId) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/graph?instanceId=${instanceId}`, {
        headers: {
          "authorization": token
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Transform the data structure if needed
        const transformedData = {
          nodes: data.nodes || [],
          edges: data.edges || [],
          metadata: data.metadata,
          stats: data.stats
        };
        setGraphData(transformedData);
        setGraphStats(data.stats);
      } else {
        setError(data.error || 'No graph data available');
        setGraphData(null);
      }
    } catch (err) {
      console.error('Error loading graph data:', err);
      setError('Failed to load graph data: ' + err.message);
      setGraphData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInstanceStats = (instances) => {
    if (!instances || instances.length === 0) return null;
    
    const total = instances.length;
    const completed = instances.filter(i => i.status === 'completed').length;
    const running = instances.filter(i => i.status === 'running').length;
    const errored = instances.filter(i => i.status === 'error').length;
    const withGraphs = instances.filter(i => i.hasGraph).length;
    
    // Calculate average papers processed
    const totalPapers = instances.reduce((sum, i) => sum + (i.results?.totalPapers || 0), 0);
    const avgPapers = total > 0 ? Math.round(totalPapers / total) : 0;
    
    // Find most recent instance
    const recentInstance = instances[0];
    
    // Calculate success rate
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      running,
      errored,
      withGraphs,
      avgPapers,
      recentInstance: recentInstance?.query?.substring(0, 50) + '...' || 'N/A',
      successRate,
      totalPapers
    };
  };

  // Handle instance selection
  const handleInstanceSelect = (instance) => {
    setSelectedInstance(instance);
    setSelectedNode(null);
    setSelectedEdge(null);
    if (instance.hasGraph) {
      loadGraphData(instance._id);
    } else {
      setGraphData(null);
      setGraphStats(null);
      setError('No graph data available for this instance');
    }
  };

  // Delete instance
  const handleDeleteInstance = async (instanceId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this instance and its associated graph?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/worker/instances', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          "authorization": token
        },
        body: JSON.stringify({ id: instanceId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from list
        setInstances(instances.filter(inst => inst._id !== instanceId));
        
        // If deleted instance was selected, select another
        if (selectedInstance?._id === instanceId) {
          const newSelection = instances.find(inst => inst._id !== instanceId && inst.hasGraph);
          if (newSelection) {
            setSelectedInstance(newSelection);
            loadGraphData(newSelection._id);
          } else {
            setSelectedInstance(null);
            setGraphData(null);
          }
        }
      } else {
        alert('Failed to delete instance: ' + data.error);
      }
    } catch (err) {
      alert('Failed to delete instance: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadWorkerInstances();
  }, []);

  // Apply filters to graph data
  const getFilteredGraph = () => {
    if (!graphData) return null;
    
    let filteredNodes = [...(graphData.nodes || [])];
    let filteredEdges = [...(graphData.edges || [])];
    
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
      metadata: graphData.metadata,
      stats: graphData.stats
    };
  };

  // Filter instances based on search
  const filteredInstances = instances.filter(instance => {
    if (!instanceSearchTerm) return true;
    const searchLower = instanceSearchTerm.toLowerCase();
    return (
      instance.query.toLowerCase().includes(searchLower) ||
      instance.status.toLowerCase().includes(searchLower)
    );
  });

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const filteredGraph = getFilteredGraph();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Network className="h-6 w-6 mr-2 text-blue-600" />
                Knowledge Graph Explorer
              </h1>
              <p className="text-sm text-gray-600">
                Interactive visualization of research connections
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'split' ? 'graph' : 'split')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'split' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Layers className="h-4 w-4 mr-2" />
                {viewMode === 'split' ? 'Full Graph' : 'Split View'}
              </button>
              <button
                onClick={exportGraph}
                disabled={!graphData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={loadWorkerInstances}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Stats */}
        {instanceStats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={Database}
                label="Total Instances"
                value={instanceStats.total}
                color="blue"
                subtext={`${instanceStats.withGraphs} with graphs`}
              />
              <StatCard 
                icon={CheckCircle}
                label="Success Rate"
                value={`${instanceStats.successRate}%`}
                color="green"
                subtext={`${instanceStats.completed} completed`}
              />
              <StatCard 
                icon={FileText}
                label="Avg Papers"
                value={instanceStats.avgPapers}
                color="purple"
                subtext={`${instanceStats.totalPapers} total`}
              />
              <StatCard 
                icon={Activity}
                label="Active"
                value={instanceStats.running}
                color="orange"
                subtext={`${instanceStats.errored} failed`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Instance List */}
          {(viewMode === 'list' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'lg:col-span-1' : 'lg:col-span-4'}`}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Worker Instances</h2>
                    <span className="text-sm text-gray-500">
                      {instances.length} instances
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={instanceSearchTerm}
                        onChange={(e) => setInstanceSearchTerm(e.target.value)}
                        placeholder="Search instances..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {isLoadingInstances ? (
                  <div className="p-8">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                ) : filteredInstances.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <Database className="h-12 w-12" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No instances found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by running a new worker.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {filteredInstances.map((instance) => (
                      <div
                        key={instance._id}
                        onClick={() => handleInstanceSelect(instance)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                          selectedInstance?._id === instance._id 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <StatusBadge status={instance.status} />
                              {instance.hasGraph && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <Network className="h-3 w-3 mr-1" />
                                  Has Graph
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                              {instance.query}
                            </p>
                            <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(instance.createdAt)}
                              </span>
                              {instance.results?.totalPapers && (
                                <span className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {instance.results.totalPapers} papers
                                </span>
                              )}
                              {instance.results?.duration && (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDuration(instance.results.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {instance.hasGraph ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstanceSelect(instance);
                                }}
                                className={`inline-flex items-center p-2 border border-transparent rounded-full ${
                                  selectedInstance?._id === instance._id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                                }`}
                                title="View Graph"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 px-2">No Graph</span>
                            )}
                            <button
                              onClick={(e) => handleDeleteInstance(instance._id, e)}
                              disabled={isDeleting}
                              className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-100"
                              title="Delete Instance"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {instance.graphStats && (
                          <div className="mt-3 flex items-center space-x-4 text-xs">
                            <span className="flex items-center">
                              <Hash className="h-3 w-3 mr-1" />
                              {instance.graphStats.totalNodes || 0} nodes
                            </span>
                            <span className="flex items-center">
                              <GitBranch className="h-3 w-3 mr-1" />
                              {instance.graphStats.totalEdges || 0} edges
                            </span>
                            <span className="flex items-center">
                              <BarChart className="h-3 w-3 mr-1" />
                              Density: {instance.graphStats.density ? instance.graphStats.density.toFixed(3) : '0'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Graph Area */}
          {(viewMode === 'graph' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
              {/* Selected Instance Info */}
              {selectedInstance && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-bold text-gray-900 truncate max-w-2xl">
                          {selectedInstance.query}
                        </h2>
                        <StatusBadge status={selectedInstance.status} />
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Started: {formatDate(selectedInstance.createdAt)}
                        </span>
                        {selectedInstance.results?.completedAt && (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completed: {formatDate(selectedInstance.results.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedInstance.results && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Results</div>
                          <div className="text-lg font-semibold">
                            {selectedInstance.results.totalConnections || 0} connections
                          </div>
                          <div className="text-xs text-gray-500">
                            from {selectedInstance.results.totalPapers || 0} papers
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Graph Area */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Graph Controls */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {filteredGraph 
                            ? `Showing ${filteredGraph.nodes?.length || 0} nodes and ${filteredGraph.edges?.length || 0} edges`
                            : 'No graph data selected'
                          }
                        </span>
                      </div>
                      {searchTerm && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                          Search: "{searchTerm}"
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                        {['force', 'hierarchical', 'radial'].map((layout) => (
                          <button
                            key={layout}
                            onClick={() => setFilters({...filters, layout})}
                            className={`px-3 py-1 text-sm rounded-md capitalize transition-all ${
                              filters.layout === layout
                                ? 'bg-white shadow-sm text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {layout}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setFilters({...filters, physics: !filters.physics})}
                        className={`p-2 rounded-lg transition-colors ${
                          filters.physics
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Toggle Physics"
                      >
                        <Cpu className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Graph Search */}
                  <div className="mt-4">
                    <div className="relative max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search nodes..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Graph Visualization */}
                <div className="relative" style={{ height: '600px' }}>
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading knowledge graph...</p>
                      </div>
                    </div>
                  ) : filteredGraph ? (
                    <GraphVisualization
                      graphData={filteredGraph}
                      onNodeSelect={setSelectedNode}
                      onEdgeSelect={setSelectedEdge}
                      options={{
                        layout: filters.layout,
                        physics: filters.physics,
                        showLabels: filters.showLabels,
                        nodeColors: {
                          drug: '#4A90E2',
                          health_issue: '#50E3C2'
                        }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                      <div className="text-center max-w-md">
                        <NetworkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {selectedInstance ? 'No Graph Data' : 'Select an Instance'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {selectedInstance 
                            ? 'This worker instance does not have any graph data yet or failed to load.'
                            : 'Choose a worker instance from the list to view its knowledge graph.'
                          }
                        </p>
                        {!selectedInstance && (
                          <button
                            onClick={() => setViewMode('split')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4 mr-2" />
                            Browse Instances
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Panel */}
                <div className="border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* Selection Details */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-blue-600" />
                        Selection Details
                      </h3>
                      {selectedNode || selectedEdge ? (
                        <div className="space-y-4">
                          {selectedNode && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900 truncate">{selectedNode.label}</h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize whitespace-nowrap">
                                  {selectedNode.type?.replace('_', ' ') || 'node'}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Connections:</span>
                                  <span className="font-medium">{selectedNode.total_connections || 0}</span>
                                </div>
                                {selectedNode.size && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Size:</span>
                                    <span className="font-medium">{selectedNode.size}</span>
                                  </div>
                                )}
                                {selectedNode.id && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">ID:</span>
                                    <span className="font-mono text-xs">{selectedNode.id}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedEdge && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Connection</h4>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <Zap
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i <= (selectedEdge.value || 1) 
                                          ? 'text-yellow-500 fill-current' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Strength:</span>
                                  <span className="font-medium">{selectedEdge.value || 1}/5</span>
                                </div>
                                {selectedEdge.papers && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Papers:</span>
                                    <span className="font-medium">{selectedEdge.papers}</span>
                                  </div>
                                )}
                                {selectedEdge.relationship && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Relationship:</span>
                                    <span className="font-medium capitalize">{selectedEdge.relationship}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">
                          Click on a node or edge to see details here.
                        </p>
                      )}
                    </div>

                    {/* Graph Filters */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Filter className="h-5 w-5 mr-2 text-blue-600" />
                        Graph Filters
                      </h3>
                      <div className="space-y-4">
                        {/* Strength Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Connection Strength: {filters.minStrength}-{filters.maxStrength}
                          </label>
                          <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((strength) => (
                              <button
                                key={strength}
                                onClick={() => setFilters({...filters, minStrength: strength, maxStrength: strength})}
                                className={`px-3 py-1 rounded-full text-sm flex-1 ${
                                  filters.minStrength === strength && filters.maxStrength === strength
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {strength}
                              </button>
                            ))}
                            <button
                              onClick={() => setFilters({...filters, minStrength: 1, maxStrength: 5})}
                              className={`px-3 py-1 rounded-full text-sm ${
                                filters.minStrength === 1 && filters.maxStrength === 5
                                  ? 'bg-gray-200 text-gray-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              All
                            </button>
                          </div>
                        </div>

                        {/* Node Types */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Node Types
                          </label>
                          <div className="flex space-x-4">
                            {[
                              { value: 'drug', label: 'Drugs/Interventions' },
                              { value: 'health_issue', label: 'Health Issues' }
                            ].map((type) => (
                              <label key={type.value} className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.nodeTypes.includes(type.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilters({
                                        ...filters,
                                        nodeTypes: [...filters.nodeTypes, type.value]
                                      });
                                    } else {
                                      setFilters({
                                        ...filters,
                                        nodeTypes: filters.nodeTypes.filter(t => t !== type.value)
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {type.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Display Options */}
                        <div className="space-y-2">
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
                            <span className="ml-2 text-sm text-gray-700">Enable Physics</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Graph Stats */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        Graph Statistics
                      </h3>
                      <div className="space-y-3">
                        {graphStats ? (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Total Nodes</div>
                                <div className="text-lg font-semibold">{graphStats.totalNodes}</div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Total Edges</div>
                                <div className="text-lg font-semibold">{graphStats.totalEdges}</div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Drug Nodes</div>
                                <div className="text-lg font-semibold">{graphStats.drugNodes}</div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Health Nodes</div>
                                <div className="text-lg font-semibold">{graphStats.healthNodes}</div>
                              </div>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500">Graph Density</div>
                              <div className="text-lg font-semibold">
                                {graphStats.density ? graphStats.density.toFixed(4) : '0'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Higher density = more connections per node
                              </div>
                            </div>
                            {graphStats.strengthDistribution && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 mb-2">Strength Distribution</div>
                                <div className="space-y-1">
                                  {Object.entries(graphStats.strengthDistribution).map(([strength, count]) => (
                                    <div key={strength} className="flex items-center text-sm">
                                      <span className="w-8">S{strength}:</span>
                                      <div className="flex-1 ml-2">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ 
                                              width: `${(count / graphStats.totalEdges) * 100}%` 
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                      <span className="ml-2 text-gray-600">{count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 text-sm italic">
                            No graph statistics available.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}