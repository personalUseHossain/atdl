// app/dashboard/page.js - UPDATED VERSION
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  Network,
  FileText,
  Star,
  TrendingUp,
  Database,
  Cpu
} from 'lucide-react';

export default function Dashboard() {
  const [workerStatus, setWorkerStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('aging mitochondria');
  const [maxPapers, setMaxPapers] = useState(5);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const refreshIntervalRef = useRef(null);

  // Fetch worker status
  const fetchWorkerStatus = async () => {
    try {
      const response = await fetch('/api/worker/status');
      const data = await response.json();
      setWorkerStatus(data);
    } catch (error) {
      console.error('Error fetching worker status:', error);
    }
  };

  // Fetch results
  const fetchResults = async () => {
    try {
      const response = await fetch('/api/worker/results');
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  // Fetch cache stats
  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/cache');
      const data = await response.json();
      return data.cache || {};
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      return {};
    }
  };

  // Start worker
  const startWorker = async () => {
    setIsLoading(true);
    if(!searchQuery) return alert('Please enter a search query')
    try {
      const response = await fetch('/api/worker/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery || "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)",
          maxPapers: parseInt(maxPapers)
        }),
      });

      const data = await response.json();
      if (data.success) {
        setWorkerStatus(data.status);
        // Immediately refresh data after starting
        await refreshData();
        // Enable auto-refresh
        setAutoRefreshEnabled(true);
      }
    } catch (error) {
      console.error('Error starting worker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop worker
  const stopWorker = async () => {
    try {
      const response = await fetch('/api/worker/stop', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setWorkerStatus(data.status);
        // Refresh after stopping
        await refreshData();
      }
    } catch (error) {
      console.error('Error stopping worker:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    console.log('Refreshing data...');
    await Promise.all([
      fetchWorkerStatus(),
      fetchResults()
    ]);
  };

  // Set up auto-refresh based on worker status
  useEffect(() => {
    const setupAutoRefresh = () => {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // If worker is running and auto-refresh is enabled, set up polling
      if (workerStatus?.status === 'running' && autoRefreshEnabled) {
        console.log('Setting up auto-refresh (2s interval)');
        refreshIntervalRef.current = setInterval(async () => {
          console.log('Auto-refresh triggered');
          await refreshData();
        }, 2000); // Refresh every 2 seconds when running
      }
      // If worker is completed/error/stopped, refresh less frequently
      else if (workerStatus && autoRefreshEnabled) {
        console.log('Setting up slower refresh (10s interval)');
        refreshIntervalRef.current = setInterval(async () => {
          console.log('Slow refresh triggered');
          await refreshData();
        }, 10000); // Refresh every 10 seconds for other statuses
      }
    };

    setupAutoRefresh();

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [workerStatus?.status, autoRefreshEnabled]); // Re-run when status changes

  // Initial load
  useEffect(() => {
    refreshData();
    
    // Also set up a periodic refresh for all statuses (every 30 seconds)
    const generalRefresh = setInterval(() => {
      if (workerStatus?.status !== 'running') {
        refreshData();
      }
    }, 30000);

    return () => {
      clearInterval(generalRefresh);
    };
  }, []); // Run only once on mount

  // Helper function to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'stopped': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'error': return <AlertCircle className="h-5 w-5" />;
      case 'stopped': return <Square className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  // Cache Stats Component
  function CacheStats({ cacheStats }) {
    if (!cacheStats) return null;

    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cache & Processing Stats</h3>
          <button
            onClick={async () => {
              if (confirm('Clear all cached papers?')) {
                await fetch('/api/cache?type=all', { method: 'DELETE' });
                refreshData();
              }
            }}
            className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md font-medium transition-colors"
          >
            Clear Cache
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{cacheStats.papers_cached || 0}</div>
            <div className="text-sm text-blue-600">Papers Cached</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{cacheStats.full_text_cached || 0}</div>
            <div className="text-sm text-green-600">Full Texts Cached</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {cacheStats.papers_processed || 0}
            </div>
            <div className="text-sm text-purple-600">Papers Processed</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {workerStatus ? (
                <span className={`${getStatusColor(workerStatus.status).split(' ')[0]}`}>
                  {workerStatus.progress || 0}%
                </span>
              ) : '0%'}
            </div>
            <div className="text-sm text-gray-600">Current Progress</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor worker status and analyze drug-health connections
            {workerStatus?.status === 'running' && (
              <span className="ml-2 inline-flex items-center text-green-600">
                <span className="animate-pulse">●</span>
                <span className="ml-1">Live updating...</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              autoRefreshEnabled
                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            title={autoRefreshEnabled ? "Auto-refresh enabled" : "Auto-refresh disabled"}
          >
            {autoRefreshEnabled ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Auto-refresh ON
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                Auto-refresh OFF
              </>
            )}
          </button>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Worker Control Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Worker Control</h2>
          <div className="flex items-center space-x-2">
            {workerStatus && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workerStatus.status)}`}>
                {getStatusIcon(workerStatus.status)}
                <span className="ml-2 capitalize">{workerStatus.status}</span>
              </span>
            )}
            {workerStatus?.status === 'running' && (
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="PubMed search query"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="maxPapers" className="block text-sm font-medium text-gray-700 mb-2">
              Max Papers
            </label>
            <input
              type="number"
              id="maxPapers"
              value={maxPapers}
              onChange={(e) => setMaxPapers(e.target.value)}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end space-x-3">
            <button
              onClick={startWorker}
              disabled={isLoading || workerStatus?.status === 'running'}
              className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading || workerStatus?.status === 'running'
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Starting...' : 'Start Processing'}
            </button>
            <button
              onClick={stopWorker}
              disabled={workerStatus?.status !== 'running'}
              className={`inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                workerStatus?.status === 'running'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {workerStatus && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                {workerStatus.currentStep || 'Ready'}
                {workerStatus.status === 'running' && (
                  <span className="ml-2 inline-flex">
                    <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                  </span>
                )}
              </span>
              <span>{workerStatus.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  workerStatus.status === 'running' ? 'bg-blue-600' :
                  workerStatus.status === 'completed' ? 'bg-green-600' :
                  workerStatus.status === 'error' ? 'bg-red-600' :
                  'bg-gray-400'
                }`}
                style={{ width: `${workerStatus.progress || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Cache Stats */}
      <CacheStats cacheStats={results?.cache} />

      {/* Stats Grid */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Connections</dt>
                    <dd className="text-lg font-medium text-gray-900">{results.stats.totalConnections}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Cpu className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Unique Drugs</dt>
                    <dd className="text-lg font-medium text-gray-900">{results.stats.totalDrugs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Health Issues</dt>
                    <dd className="text-lg font-medium text-gray-900">{results.stats.totalHealthIssues}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Strength</dt>
                    <dd className="text-lg font-medium text-gray-900">{results.stats.averageStrength}/5</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Connections */}
      {results && results.connections.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Connections</h3>
              <span className="text-sm text-gray-500">
                Updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Papers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.connections.slice(0, 5).map((connection) => (
                  <tr key={connection.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{connection.drug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{connection.health_issue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < connection.strength ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{connection.strength}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {connection.total_papers || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        connection.relationship === 'positive'
                          ? 'bg-green-100 text-green-800'
                          : connection.relationship === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {connection.relationship || 'neutral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <a
              href="/connections"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all connections →
            </a>
          </div>
        </div>
      )}

      {/* Worker Logs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Worker Logs</h3>
            <span className="text-sm text-gray-500">
              {logs.length} log entries
            </span>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-2 max-h-96 overflow-y-auto" id="logs-container">
            {logs.length > 0 ? (
              logs.map((log, index) => {
                const parts = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);
                if (!parts) return null;

                const [, timestamp, level, message] = parts;
                const levelColor = level === 'ERROR' ? 'text-red-600' : level === 'WARN' ? 'text-yellow-600' : 'text-gray-600';

                return (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-400">{timestamp}</span>
                    <span className={`ml-2 ${levelColor}`}>[{level}]</span>
                    <span className="ml-2 text-gray-800">{message}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No logs available. Start the worker to see logs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}