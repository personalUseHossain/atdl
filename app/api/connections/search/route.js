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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query) {
      return Response.json({
        success: true,
        results: []
      });
    }
    
    // Search using text index
    const results = await Connection.find(
      { 
        user: user._id,
        $text: { $search: query }
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();
    
    // If text search doesn't yield results, try regex
    if (results.length === 0) {
      const regexResults = await Connection.find({
        user: user._id,
        $or: [
          { drug: { $regex: query, $options: 'i' } },
          { health_issue: { $regex: query, $options: 'i' } },
          { mechanism: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(limit)
      .lean();
      
      return Response.json({
        success: true,
        results: regexResults
      });
    }
    
    return Response.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Search connections error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}