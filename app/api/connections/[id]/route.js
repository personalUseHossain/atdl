import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import Connection from '@/models/Connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {

    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Await the params promise
    const { id } = await params;
    await connectToDatabase();
    
    
    const user = session.user;
    
    const connection = await Connection.findOne({ 
      _id: id,
      user: user.id 
    });
    
    if (!connection) {
      return Response.json({
        success: false,
        error: 'Connection not found'
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      connection
    });
    
  } catch (error) {
    console.error('Get connection error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}