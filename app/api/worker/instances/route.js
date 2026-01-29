import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { user: user._id };
    if (status) {
      query.status = status;
    }
    
    // Get worker instances
    const workerInstances = await WorkerInstance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const total = await WorkerInstance.countDocuments(query);
    
    // Get associated graph data for each instance
    const instancesWithGraphs = await Promise.all(
      workerInstances.map(async (instance) => {
        // Get the latest graph for this worker instance
        const graph = await KnowledgeGraph.findOne({
          user: user._id,
          workerInstance: instance._id
        })
        .sort({ createdAt: -1 })
        .lean();
        
        return {
          ...instance,
          hasGraph: !!graph,
          graphStats: graph?.stats || null,
          graphId: graph?._id || null,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt
        };
      })
    );
    
    return Response.json({
      success: true,
      instances: instancesWithGraphs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('Get worker instances error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
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
    const { id } = await request.json();
    
    if (!id) {
      return Response.json({
        success: false,
        error: 'Instance ID is required'
      }, { status: 400 });
    }
    
    // Delete worker instance and associated graph
    const WorkerInstanceModel = require('@/models/WorkerInstance').default;
    const KnowledgeGraph = require('@/models/KnowledgeGraph').default;
    
    await WorkerInstanceModel.deleteOne({ _id: id, user: user._id });
    await KnowledgeGraph.deleteMany({ workerInstance: id, user: user._id });
    
    return Response.json({
      success: true,
      message: 'Instance deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete instance error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}