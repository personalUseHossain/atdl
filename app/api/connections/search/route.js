import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import Connection from '@/models/Connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {

    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    
    const user = session.user;
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
        user: user.id,
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
        user: user.id,
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