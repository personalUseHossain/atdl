import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const { email, name, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json({
        success: false,
        error: 'User already exists'
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      email,
      name,
      password: hashedPassword,
      workspace: {
        name: `${name}'s Workspace`,
        description: 'Default workspace'
      }
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return Response.json({
      success: true,
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}