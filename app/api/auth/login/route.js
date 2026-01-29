import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const { email, password } = await request.json();
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return Response.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Update last active
    user.stats.lastActive = new Date();
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return Response.json({
      success: true,
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}