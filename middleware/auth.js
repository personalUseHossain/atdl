// middleware/auth.js - UPDATED
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function authenticate(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { error: 'Authentication required' };
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select('-password');
    
    if (!user) {
      return { error: 'User not found' };
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed' };
  }
}