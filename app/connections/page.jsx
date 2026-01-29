'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Database,
  TrendingUp,
  Activity,
  Users,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ConnectionsPage() {
  const { user, token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [minStrength, setMinStrength] = useState(1);
  const [drugFilter, setDrugFilter] = useState('');
  const [healthIssueFilter, setHealthIssueFilter] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [sortBy, setSortBy] = useState('strength');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [availableDrugs, setAvailableDrugs] = useState([]);
  const [availableHealthIssues, setAvailableHealthIssues] = useState([]);

  // Fetch connections with all filters
  const fetchConnections = async (page = 1) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(minStrength > 1 && { minStrength: minStrength.toString() }),
        ...(drugFilter && { drug: drugFilter }),
        ...(healthIssueFilter && { health_issue: healthIssueFilter }),
        ...(relationshipFilter !== 'all' && { relationship: relationshipFilter }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/connections?${params}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setConnections(data.connections);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unique drugs and health issues for filters
  const fetchFilterOptions = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/connections/filter-options', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableDrugs(data.drugs || []);
          setAvailableHealthIssues(data.healthIssues || []);
        }
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // You could use these stats for the dashboard
          console.log('User stats:', data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Export connections as CSV
  const exportConnections = async () => {
    try {
      const response = await fetch('/api/connections/export', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `connections-${user._id}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting connections:', error);
      alert('Failed to export connections');
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setMinStrength(1);
    setDrugFilter('');
    setHealthIssueFilter('');
    setRelationshipFilter('all');
    setSortBy('strength');
    setSortOrder('desc');
    fetchConnections(1);
  };

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchFilterOptions();
      fetchUserStats();
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchConnections(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      fetchConnections(page);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    fetchConnections(1);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStrengthColor = (strength) => {
    if (strength >= 4) return 'text-green-600';
    if (strength >= 3) return 'text-blue-600';
    if (strength >= 2) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'inconclusive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse {user?.name}'s drug-health connections extracted from research papers
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportConnections}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showFilters ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Filters
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Filters
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {/* {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Connections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Strength</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {typeof stats.avgStrength === 'number' ? stats.avgStrength.toFixed(2) : '0.00'}/5
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Max Strength</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.maxStrength || 0}/5</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Hash className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">By Strength</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.byStrength?.length || 0} levels
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Filters - Collapsible */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Drug, health issue, mechanism..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Drug Filter */}
                <div>
                  <label htmlFor="drugFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    Drug / Compound
                  </label>
                  <select
                    id="drugFilter"
                    value={drugFilter}
                    onChange={(e) => setDrugFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Drugs</option>
                    {availableDrugs.map((drug) => (
                      <option key={drug} value={drug}>
                        {drug}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Health Issue Filter */}
                <div>
                  <label htmlFor="healthIssueFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    Health Issue
                  </label>
                  <select
                    id="healthIssueFilter"
                    value={healthIssueFilter}
                    onChange={(e) => setHealthIssueFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Health Issues</option>
                    {availableHealthIssues.map((issue) => (
                      <option key={issue} value={issue}>
                        {issue}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Relationship Filter */}
                <div>
                  <label htmlFor="relationshipFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    id="relationshipFilter"
                    value={relationshipFilter}
                    onChange={(e) => setRelationshipFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="all">All Relationships</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                    <option value="inconclusive">Inconclusive</option>
                  </select>
                </div>

                {/* Minimum Strength */}
                <div className="md:col-span-2">
                  <label htmlFor="minStrength" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Strength: <span className="font-semibold">{minStrength}+</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      id="minStrength"
                      min="1"
                      max="5"
                      value={minStrength}
                      onChange={(e) => setMinStrength(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center">
                      {[...Array(minStrength)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => toggleSort('strength')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        sortBy === 'strength'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Strength {getSortIcon('strength')}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort('total_papers')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        sortBy === 'total_papers'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Papers {getSortIcon('total_papers')}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort('last_updated')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        sortBy === 'last_updated'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Recent {getSortIcon('last_updated')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset Filters
                </button>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && connections.length > 0 && (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> connections
                {search && (
                  <span className="ml-2">
                    for "<span className="font-medium">{search}</span>"
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
            </div>
          </div>
        )}

        {/* Connections Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No connections found</h3>
              <p className="mt-2 text-gray-600 mb-6">
                {search || drugFilter || healthIssueFilter || minStrength > 1 || relationshipFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : "You haven't extracted any connections yet."}
              </p>
              {!search && !drugFilter && !healthIssueFilter && minStrength === 1 && relationshipFilter === 'all' && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard to start processing
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('drug')}>
                        Drug / Compound {getSortIcon('drug')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('health_issue')}>
                        Health Issue {getSortIcon('health_issue')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('strength')}>
                        Evidence Strength {getSortIcon('strength')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('total_papers')}>
                        Papers {getSortIcon('total_papers')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Relationship
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Study Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {connections.map((connection) => (
                      <tr key={connection._id || connection.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{connection.drug}</div>
                            {connection.has_full_text_sources > 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Has full text sources">
                                FT
                              </span>
                            )}
                          </div>
                          {connection.extraction_sources?.includes('full_text') && (
                            <div className="text-xs text-green-600 mt-1">Full text analysis</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{connection.health_issue}</div>
                          {connection.mechanism && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {connection.mechanism}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < connection.strength 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${getStrengthColor(connection.strength)}`}>
                              {connection.strength}/5
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {connection.confidence || 'Medium'} confidence
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{connection.total_papers || 1}</div>
                          <div className="text-xs text-gray-500">
                            {connection.first_paper_year && connection.latest_paper_year
                              ? `${connection.first_paper_year}-${connection.latest_paper_year}`
                              : connection.paper_year || 'N/A'}
                          </div>
                          {connection.supporting_papers && connection.supporting_papers.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {connection.supporting_papers.length} papers
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRelationshipColor(connection.relationship)}`}>
                            {connection.relationship || 'neutral'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {connection.study_type || 'Not specified'}
                          {connection.model && (
                            <div className="text-xs text-gray-400 mt-1">
                              {connection.model}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/connections/${connection._id || connection.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {connection.paper_id && (
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${connection.paper_id}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900"
                                title="View on PubMed"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          pagination.page === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          pagination.page === pagination.pages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{pagination.page}</span> of{' '}
                          <span className="font-medium">{pagination.pages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              pagination.page === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {/* Page numbers */}
                          {(() => {
                            const pages = [];
                            const maxVisible = 5;
                            let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                            let end = Math.min(pagination.pages, start + maxVisible - 1);
                            
                            // Adjust start if we're near the end
                            if (end - start + 1 < maxVisible) {
                              start = Math.max(1, end - maxVisible + 1);
                            }
                            
                            // First page
                            if (start > 1) {
                              pages.push(
                                <button
                                  key={1}
                                  onClick={() => handlePageChange(1)}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  1
                                </button>
                              );
                              if (start > 2) {
                                pages.push(
                                  <span key="ellipsis-start" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                            }
                            
                            // Middle pages
                            for (let i = start; i <= end; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => handlePageChange(i)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    i === pagination.page
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            
                            // Last page
                            if (end < pagination.pages) {
                              if (end < pagination.pages - 1) {
                                pages.push(
                                  <span key="ellipsis-end" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                              pages.push(
                                <button
                                  key={pagination.pages}
                                  onClick={() => handlePageChange(pagination.pages)}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  {pagination.pages}
                                </button>
                              );
                            }
                            
                            return pages;
                          })()}
                          
                          <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              pagination.page === pagination.pages
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}