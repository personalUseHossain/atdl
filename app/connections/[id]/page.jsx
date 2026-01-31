'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  FileText,
  Calendar,
  User,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Database,
  BarChart3
} from 'lucide-react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function ConnectionDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && id) {
      fetchConnection();
    }
  }, [user, id]);

  const fetchConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/connections/${id}`, {
       
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Connection not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConnection(data.connection);
      } else {
        throw new Error(data.error || 'Failed to fetch connection');
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    if (strength >= 4) return 'text-green-600 bg-green-100';
    if (strength >= 3) return 'text-blue-600 bg-blue-100';
    if (strength >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'inconclusive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Connection Details</h1>
              <p className="mt-1 text-sm text-gray-600">Detailed view of a drug-health connection</p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <Link
              href="/connections"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Connections
            </Link>
          </div>
        </div>
    );
  }

  if (!connection) {
    return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Connection Details</h1>
              <p className="mt-1 text-sm text-gray-600">Detailed view of a drug-health connection</p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Connection Not Found</h3>
            <p className="mt-2 text-gray-600">The requested connection could not be found.</p>
            <Link
              href="/connections"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Connections
            </Link>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <Link
                href="/connections"
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Connection Details</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600 ml-9">
              Detailed view of a drug-health connection
            </p>
          </div>
          <div className="flex space-x-3">
            {connection.paper_id && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${connection.paper_id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on PubMed
              </a>
            )}
          </div>
        </div>

        {/* Main Connection Info */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {connection.drug} → {connection.health_issue}
                </h2>
                {connection.mechanism && (
                  <p className="mt-2 text-gray-600">{connection.mechanism}</p>
                )}
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRelationshipColor(connection.relationship)}`}>
                  {connection.relationship || 'neutral'} relationship
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStrengthColor(connection.strength)}`}>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < connection.strength ? 'fill-current' : ''}`}
                      />
                    ))}
                    <span className="ml-1">Strength: {connection.strength}/5</span>
                  </div>
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Supporting Papers</p>
                    <p className="text-lg font-semibold text-gray-900">{connection.total_papers || 1}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Confidence</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{connection.confidence || 'Medium'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Year Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {connection.first_paper_year && connection.latest_paper_year
                        ? `${connection.first_paper_year}-${connection.latest_paper_year}`
                        : connection.paper_year || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Extraction Source</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {connection.extraction_source?.replace('_', ' ') || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Study Information</h3>
                  <div className="space-y-3">
                    {connection.study_type && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Study Type</span>
                        <span className="text-sm font-medium text-gray-900">{connection.study_type}</span>
                      </div>
                    )}
                    {connection.model && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Model</span>
                        <span className="text-sm font-medium text-gray-900">{connection.model}</span>
                      </div>
                    )}
                    {connection.dose && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Dose</span>
                        <span className="text-sm font-medium text-gray-900">{connection.dose}</span>
                      </div>
                    )}
                    {connection.duration && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Duration</span>
                        <span className="text-sm font-medium text-gray-900">{connection.duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                {connection.statistical_significance && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Statistical Significance</h3>
                    <div className="flex items-center">
                      {connection.statistical_significance.includes('<') ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{connection.statistical_significance}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Paper Information</h3>
                  <div className="space-y-3">
                    {connection.paper_title && (
                      <div>
                        <p className="text-sm text-gray-500">Title</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{connection.paper_title}</p>
                      </div>
                    )}
                    {connection.paper_journal && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Journal</span>
                        <span className="text-sm font-medium text-gray-900">{connection.paper_journal}</span>
                      </div>
                    )}
                    {connection.paper_year && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Year</span>
                        <span className="text-sm font-medium text-gray-900">{connection.paper_year}</span>
                      </div>
                    )}
                    {connection.paper_doi && (
                      <div>
                        <p className="text-sm text-gray-500">DOI</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{connection.paper_doi}</p>
                      </div>
                    )}
                  </div>
                </div>

                {connection.sample_size && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Information</h3>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{connection.sample_size}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Extracted At</span>
                  <span className="text-gray-900">
                    {new Date(connection.extracted_at || connection.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">
                    {new Date(connection.last_updated).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Has Full Text</span>
                  <span className="text-gray-900">
                    {connection.has_full_text ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Extraction Method</span>
                  <span className="text-gray-900 capitalize">
                    {connection.extraction_source?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}