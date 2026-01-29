import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import Connection from '@/models/Connection';
import ProcessedPaper from '@/models/ProcessedPaper';
import WorkerInstance from '@/models/WorkerInstance';
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
    
    // Get all stats in parallel
    const [
      connectionStats,
      paperStats,
      workerStats,
      graphStats
    ] = await Promise.all([
      // Connection stats
      Connection.aggregate([
        { $match: { user: user._id } },
        { 
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgStrength: { $avg: '$strength' },
            maxStrength: { $max: '$strength' },
            byStrength: {
              $push: {
                strength: '$strength',
                drug: '$drug',
                health_issue: '$health_issue'
              }
            }
          }
        }
      ]),
      
      // Paper stats
      ProcessedPaper.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            withFullText: {
              $sum: { $cond: [{ $eq: ['$has_full_text', true] }, 1, 0] }
            },
            connectionsFound: { $sum: '$connections_found' },
            byYear: {
              $push: {
                year: '$year',
                connections: '$connections_found'
              }
            }
          }
        }
      ]),
      
      // Worker stats
      WorkerInstance.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Graph stats
      KnowledgeGraph.findOne({ user: user._id })
        .sort({ createdAt: -1 })
        .select('stats metadata')
        .lean()
    ]);
    
    // Format the response
    const stats = {
      connections: {
        total: connectionStats[0]?.total || 0,
        avgStrength: connectionStats[0]?.avgStrength?.toFixed(2) || 0,
        maxStrength: connectionStats[0]?.maxStrength || 0,
        strengthDistribution: connectionStats[0]?.byStrength?.reduce((acc, curr) => {
          acc[curr.strength] = (acc[curr.strength] || 0) + 1;
          return acc;
        }, {}) || {}
      },
      papers: {
        total: paperStats[0]?.total || 0,
        withFullText: paperStats[0]?.withFullText || 0,
        totalConnectionsFound: paperStats[0]?.connectionsFound || 0
      },
      workers: workerStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      graph: graphStats?.stats || {},
      recentActivity: {
        lastWorker: await WorkerInstance.findOne({ user: user._id })
          .sort({ createdAt: -1 })
          .select('query status createdAt')
          .lean(),
        lastConnection: await Connection.findOne({ user: user._id })
          .sort({ created_at: -1 })
          .select('drug health_issue strength created_at')
          .lean()
      }
    };
    
    return Response.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}