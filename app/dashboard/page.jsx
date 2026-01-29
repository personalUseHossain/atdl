// app/dashboard/page.js - UPDATED FOR MULTI-USER
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Cpu,
  User,
  Briefcase,
  History,
  Activity
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Dashboard() {
  const { user } = useAuth();
  const [workerStatus, setWorkerStatus] = useState(null);
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('aging mitochondria');
  const [maxPapers, setMaxPapers] = useState(50);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const refreshIntervalRef = useRef(null);

  // Fetch worker status for selected worker
  const fetchWorkerStatus = async (sessionId = null) => {
    try {
      if (!sessionId && selectedWorker) {
        sessionId = selectedWorker;
      }
      
      if (!sessionId) {
        // Get latest worker
        const response = await fetch('/api/worker/my-workers?limit=1', {
          headers: {
            'authorization': "Bearer " + localStorage.getItem("token")
          }
        });
        const data = await response.json();
        if (data.success && data.workers.length > 0) {
          sessionId = data.workers[0].sessionId;
        }
      }
      
      if (sessionId) {
        const response = await fetch(`/api/worker/status/${sessionId}`, {
          headers: {
            'authorization': "Bearer " + localStorage.getItem("token")
          }
        });
        const data = await response.json();
        if (data.success) {
          setWorkerStatus(data);
          setSelectedWorker(sessionId);
        }
      }
    } catch (error) {
      console.error('Error fetching worker status:', error);
    }
  };

  // Fetch user's active workers
  const fetchActiveWorkers = async () => {
    try {
      const response = await fetch('/api/worker/my-workers?status=running&limit=10', {
        headers: {
            'authorization': "Bearer " + localStorage.getItem("token")
          }
      });
      const data = await response.json();
      if (data.success) {
        setActiveWorkers(data.workers);
      }
    } catch (error) {
      console.error('Error fetching active workers:', error);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
            'authorization': "Bearer " + localStorage.getItem("token")
          }
      });
      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch recent logs for selected worker
  const fetchLogs = async (sessionId = null) => {
    try {
      if (!sessionId && selectedWorker) {
        sessionId = selectedWorker;
      }
      
      if (sessionId) {
        const response = await fetch(`/api/worker/status/${sessionId}`, {
          headers: {
            'authorization': "Bearer " + localStorage.getItem("token")
          }
        });
        const data = await response.json();
        if (data.success) {
          setLogs(data.logs || []);
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Start worker
  const startWorker = async () => {
    if (!user) return;
    
    setIsLoading(true);
    if(!searchQuery) return alert('Please enter a search query');
    
    try {
      const response = await fetch('/api/worker/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: searchQuery || user.preferences?.defaultSearchQuery || "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)",
          maxPapers: parseInt(maxPapers) || user.preferences?.defaultMaxPapers || 5
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh data
        await refreshData();
        // Enable auto-refresh
        setAutoRefreshEnabled(true);
        // Set as selected worker
        setSelectedWorker(data.sessionId);
      }
    } catch (error) {
      console.error('Error starting worker:', error);
      alert('Failed to start worker: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop worker
  const stopWorker = async (sessionId = null) => {
    try {
      if (!sessionId && selectedWorker) {
        sessionId = selectedWorker;
      }
      
      if (sessionId) {
        const response = await fetch(`/api/worker/stop/${sessionId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        if (data.success) {
          // Refresh data
          await refreshData();
        }
      }
    } catch (error) {
      console.error('Error stopping worker:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    console.log('Refreshing data...');
    await Promise.all([
      fetchActiveWorkers(),
      fetchUserStats(),
      selectedWorker && fetchWorkerStatus(selectedWorker),
      selectedWorker && fetchLogs(selectedWorker)
    ]);
  };

  // Clear cache
  const clearCache = async (type = 'all') => {
    if (confirm(`Clear ${type} cache?`)) {
      try {
        const response = await fetch(`/api/cache?type=${type}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          alert('Cache cleared successfully');
          refreshData();
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
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
  }, [workerStatus?.status, autoRefreshEnabled]);

  // Initial load
  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

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

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header with User Info */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.name}! {user?.workspace?.name && `Workspace: ${user.workspace.name}`}
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

        {/* User Stats Grid */}
        {/* {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Searches</dt>
                      <dd className="text-lg font-medium text-gray-900">{userStats.stats?.totalSearches || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Papers Processed</dt>
                      <dd className="text-lg font-medium text-gray-900">{userStats.papers?.total || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Connections</dt>
                      <dd className="text-lg font-medium text-gray-900">{userStats.connections?.total || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Workers</dt>
                      <dd className="text-lg font-medium text-gray-900">{activeWorkers.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Worker Control Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Start New Analysis</h2>
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
                disabled={isLoading || (workerStatus?.status === 'running' && selectedWorker)}
                className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || (workerStatus?.status === 'running' && selectedWorker)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting...' : 'Start Processing'}
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

          {/* Active Workers List */}
          {activeWorkers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Active Workers</h3>
              <div className="space-y-3">
                {activeWorkers.map((worker) => (
                  <div
                    key={worker.sessionId}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      worker.sessionId === selectedWorker
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setSelectedWorker(worker.sessionId);
                          fetchWorkerStatus(worker.sessionId);
                        }}
                        className="text-left"
                      >
                        <div className="flex items-center">
                          {getStatusIcon(worker.status)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {worker.query.length > 50 ? worker.query.substring(0, 50) + '...' : worker.query}
                            </p>
                            <p className="text-xs text-gray-500">
                              Started: {new Date(worker.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(worker.status)}`}>
                        {worker.progress || 0}%
                      </span>
                      {/* <button
                        onClick={() => stopWorker(worker.sessionId)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Stop
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cache Stats & Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Cache & Data Management</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => clearCache('papers')}
                className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md font-medium transition-colors"
              >
                Clear Papers Cache
              </button>
              <button
                onClick={() => clearCache('pmc')}
                className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-md font-medium transition-colors"
              >
                Clear Full Text Cache
              </button>
              <button
                onClick={() => clearCache('all')}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-medium transition-colors"
              >
                Clear All Cache
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{userStats?.cache?.papers_cached || 0}</div>
              <div className="text-sm text-blue-600">Papers Cached</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{userStats?.cache?.full_text_cached || 0}</div>
              <div className="text-sm text-green-600">Full Texts Cached</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {userStats?.papers?.total || 0}
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

        {/* Recent Activity */}
        {userStats?.recentActivity && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Last Worker Run</h4>
                {userStats.recentActivity.lastWorker ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900">
                      Query: {userStats.recentActivity.lastWorker.query}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(userStats.recentActivity.lastWorker.status)}`}>
                        {userStats.recentActivity.lastWorker.status}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Started: {new Date(userStats.recentActivity.lastWorker.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent worker runs</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Last Connection Found</h4>
                {userStats.recentActivity.lastConnection ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900">
                      {userStats.recentActivity.lastConnection.drug} → {userStats.recentActivity.lastConnection.health_issue}
                    </p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < userStats.recentActivity.lastConnection.strength 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        Strength: {userStats.recentActivity.lastConnection.strength}/5
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Found: {new Date(userStats.recentActivity.lastConnection.created_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No connections found yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Worker Logs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedWorker ? `Worker Logs (${selectedWorker})` : 'Worker Logs'}
              </h3>
              <span className="text-sm text-gray-500">
                {logs.length} log entries
              </span>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-2 max-h-96 overflow-y-auto" id="logs-container">
              {logs.length > 0 ? (
                logs.map((log, index) => {
                  const isObject = typeof log === 'object';
                  const timestamp = isObject ? log.timestamp : log.match(/\[(.*?)\]/)?.[1];
                  const level = isObject ? log.type : log.match(/\[(.*?)\]/g)?.[1]?.replace(/[\[\]]/g, '');
                  const message = isObject ? log.message : log.split('] ').slice(2).join('] ');
                  
                  const levelColor = level === 'ERROR' || level === 'error' ? 'text-red-600' : 
                                  level === 'WARN' || level === 'warning' ? 'text-yellow-600' : 
                                  'text-gray-600';

                  return (
                    <div key={index} className="text-sm font-mono">
                      <span className="text-gray-400">
                        {new Date(timestamp).toLocaleString()}
                      </span>
                      <span className={`ml-2 ${levelColor}`}>[{level?.toUpperCase()}]</span>
                      <span className="ml-2 text-gray-800">{message}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No logs available. Start a worker to see logs.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}