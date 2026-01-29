import { authenticate } from '@/middleware/auth';
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
    
    // Authenticate user directly without the promise wrapper
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
      
      // Get unique drugs and health issues for this user
      const [drugs, healthIssues] = await Promise.all([
        Connection.distinct('drug', { user: user._id }).sort(),
        Connection.distinct('health_issue', { user: user._id }).sort()
      ]);
      
      return Response.json({
        success: true,
        drugs: drugs || [],
        healthIssues: healthIssues || []
      });
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return Response.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}