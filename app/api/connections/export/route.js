import { connectToDatabase } from '@/lib/db';
import Connection from '@/models/Connection';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get the token from the Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return Response.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 });
    }
    
    // Authenticate user directly
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database
      const User = require('@/models/User');
      const user = await User.findById(decoded.userId).select('_id');
      
      if (!user) {
        return Response.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }
      
      // Get all connections for this user
      const connections = await Connection.find({ user: user._id })
        .sort({ strength: -1, total_papers: -1 })
        .lean();
      
      // If no connections, return empty CSV
      if (connections.length === 0) {
        const emptyCsv = 'Drug,Health Issue,Relationship,Strength,Total Papers,First Paper Year,Latest Paper Year,Confidence,Study Type,Model,Dose,Duration,Sample Size,Statistical Significance,Mechanism,Extraction Source,Has Full Text,Created At,Last Updated\nNo connections found';
        
        return new Response(emptyCsv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="connections-${user._id}-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }
      
      // Convert to CSV
      const headers = [
        'Drug',
        'Health Issue',
        'Relationship',
        'Strength',
        'Total Papers',
        'First Paper Year',
        'Latest Paper Year',
        'Confidence',
        'Study Type',
        'Model',
        'Dose',
        'Duration',
        'Sample Size',
        'Statistical Significance',
        'Mechanism',
        'Extraction Source',
        'Has Full Text',
        'Created At',
        'Last Updated'
      ];
      
      const csvRows = [
        headers.join(','),
        ...connections.map(conn => {
          // Helper function to escape CSV fields
          const escapeCSV = (field) => {
            if (field === null || field === undefined) return '';
            const stringField = String(field);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
              return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
          };
          
          return [
            escapeCSV(conn.drug),
            escapeCSV(conn.health_issue),
            escapeCSV(conn.relationship),
            conn.strength || '',
            conn.total_papers || '',
            conn.first_paper_year || '',
            conn.latest_paper_year || '',
            escapeCSV(conn.confidence),
            escapeCSV(conn.study_type),
            escapeCSV(conn.model),
            escapeCSV(conn.dose),
            escapeCSV(conn.duration),
            escapeCSV(conn.sample_size),
            escapeCSV(conn.statistical_significance),
            escapeCSV(conn.mechanism),
            escapeCSV(conn.extraction_source),
            conn.has_full_text ? 'Yes' : 'No',
            escapeCSV(conn.created_at),
            escapeCSV(conn.last_updated)
          ].join(',');
        })
      ];
      
      const csvContent = csvRows.join('\n');
      
      // Create response with CSV file
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="connections-${user._id}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return Response.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Error exporting connections:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}