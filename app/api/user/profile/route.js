import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id') || session.user.id;

    // Check if user is accessing their own profile or is admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const user = await User.findById(userId)
      .select('+password') // Include password to check if it exists
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine if user is social login user
    const hasPassword = !!user.password && user.password !== '';
    const hasSocialAccounts = user.accounts && user.accounts.length > 0;
    const isSocialLoginUser = !hasPassword && hasSocialAccounts;
    
    // Get auth method
    let authMethod = user.authMethod;
    if (!authMethod) {
      authMethod = hasPassword ? 'email' : (hasSocialAccounts ? 'social' : 'email');
    }

    // Prepare user response
    const userResponse = {
      ...user,
      id: user._id.toString(),
      _id: undefined,
      
      // Add social login info
      isSocialLoginUser,
      hasPassword,
      authMethod,
      canChangePassword: hasPassword,
      canSetPassword: !hasPassword
    };

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { 
      name, 
      workspaceName, 
      workspaceDescription, 
      defaultMaxPapers, 
      defaultSearchQuery 
    } = body;

    // Validate inputs
    if (name && name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (defaultMaxPapers && (defaultMaxPapers < 1 || defaultMaxPapers > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Max papers must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};
    
    if (name) updateData.name = name;
    
    if (workspaceName !== undefined || workspaceDescription !== undefined) {
      updateData.workspace = {
        name: workspaceName || '',
        description: workspaceDescription || ''
      };
    }
    
    if (defaultMaxPapers !== undefined || defaultSearchQuery !== undefined) {
      updateData.preferences = {
        defaultMaxPapers: defaultMaxPapers || 30,
        defaultSearchQuery: defaultSearchQuery || "(drug OR compound OR supplement OR treatment) AND (aging OR longevity OR healthspan OR lifespan) AND (human OR clinical OR trial)"
      };
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -accounts');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...user.toObject(),
        id: user._id.toString(),
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}