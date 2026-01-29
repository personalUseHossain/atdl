import { authenticate } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import Connection from '@/models/Connection';

export async function GET(request, { params }) {
  try {
    // Await the params promise
    const { id } = await params;
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
    
    const connection = await Connection.findOne({ 
      _id: id,
      user: user._id 
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