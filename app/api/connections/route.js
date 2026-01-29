import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import Connection from '@/models/Connection';

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
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const minStrength = parseInt(searchParams.get('minStrength') || '1');
    const drug = searchParams.get('drug');
    const healthIssue = searchParams.get('health_issue');
    const sortBy = searchParams.get('sortBy') || 'strength';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build query
    const query = { user: user._id };
    
    if (minStrength > 1) {
      query.strength = { $gte: minStrength };
    }
    
    if (drug) {
      query.drug = { $regex: drug, $options: 'i' };
    }
    
    if (healthIssue) {
      query.health_issue = { $regex: healthIssue, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { drug: { $regex: search, $options: 'i' } },
        { health_issue: { $regex: search, $options: 'i' } },
        { mechanism: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get total count
    const total = await Connection.countDocuments(query);
    
    // Get connections with pagination
    const connections = await Connection.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Get stats
    const stats = {
      total: await Connection.countDocuments({ user: user._id }),
      averageStrength: await Connection.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, avg: { $avg: '$strength' } } }
      ]).then(result => result[0]?.avg || 0),
      byStrength: await Connection.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: '$strength', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    };
    
    return Response.json({
      success: true,
      connections,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get connections error:', error);
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
    const body = await request.json();
    
    // Create new connection
    const connection = new Connection({
      ...body,
      user: user._id,
      created_at: new Date(),
      last_updated: new Date()
    });
    
    await connection.save();
    
    return Response.json({
      success: true,
      connection
    });
    
  } catch (error) {
    console.error('Create connection error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}