import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';

export async function PUT(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required. Please sign in again.' 
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Parse request body
    const { currentPassword, newPassword, isSocialLoginUser } = await request.json();

    // Validate required fields
    if (!newPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'New password is required.' 
        },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'New password must be at least 8 characters long.' 
        },
        { status: 400 }
      );
    }

    // Optional: Strong password validation
    // const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!strongPasswordRegex.test(newPassword)) {
    //   return NextResponse.json(
    //     { 
    //       success: false, 
    //       error: 'Password must contain uppercase, lowercase, number and special character' 
    //     },
    //     { status: 400 }
    //   );
    // }

    // Find user with password field
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found.' 
        },
        { status: 404 }
      );
    }

    // Determine if user is social login user
    const isSocialUser = (!user.password || user.password === '') && 
                        user.accounts && 
                        user.accounts.length > 0;

    // Check if user has existing password
    const hasExistingPassword = !!user.password && user.password !== '';
    
    // Handle different scenarios
    if (hasExistingPassword) {
      // Email/password user - verify current password
      if (!currentPassword) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Current password is required for email/password users.' 
          },
          { status: 400 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Current password is incorrect.' 
          },
          { status: 400 }
        );
      }

      // Check if new password is same as current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'New password must be different from current password.' 
          },
          { status: 400 }
        );
      }
    } else if (isSocialUser) {
      // Social login user setting password for first time
      // Verify they confirmed this action
      if (!isSocialLoginUser) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Please confirm you want to set a password for your social login account.' 
          },
          { status: 400 }
        );
      }
    } else {
      // User with no password but not social login (shouldn't happen)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account configuration error. Please contact support.' 
        },
        { status: 400 }
      );
    }

    // Check password history (prevent reuse of last 5 passwords)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPasswordEntry of user.passwordHistory) {
        if (oldPasswordEntry.password && oldPasswordEntry.password.startsWith('$2')) {
          try {
            const isReusedPassword = await bcrypt.compare(newPassword, oldPasswordEntry.password);
            if (isReusedPassword) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: 'New password has been used recently. Please choose a different password.' 
                },
                { status: 400 }
              );
            }
          } catch (err) {
            console.error('Error comparing with old password:', err);
          }
        }
      }
    }

    // Prepare password history entry
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    // Initialize password history if it doesn't exist
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }

    // If user has existing password, add it to history
    if (hasExistingPassword && user.password) {
      user.passwordHistory.push({
        password: user.password, // Already hashed
        changedAt: new Date(),
        ipAddress: ipAddress.split(',')[0].trim()
      });
    }

    // Set new password (plain text - middleware will hash it)
    user.password = newPassword;
    
    // Update auth method for social login users
    if (isSocialUser) {
      user.authMethod = 'email';
    }

    // Save the user - This will trigger the pre('save') middleware
    await user.save();

    // Keep only last 5 passwords for history
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5);
    }

    // Save again with trimmed history
    await user.save();

    // Clear sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.passwordHistory;

    // Return success response
    return NextResponse.json({
      success: true,
      message: hasExistingPassword 
        ? 'Password changed successfully. Please use your new password for future logins.'
        : 'Password set successfully. You can now login with email and password.',
      user: userResponse,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Password change error:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: errors.join(', ') 
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Duplicate entry detected.' 
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    const hasPassword = !!user.password;
    const isSocialLoginUser = !user.password && user.accounts && user.accounts.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        hasPassword,
        isSocialLoginUser,
        authMethod: user.authMethod || (hasPassword ? 'email' : 'social'),
        canChangePassword: hasPassword,
        canSetPassword: !hasPassword
      }
    });

  } catch (error) {
    console.error('Get password info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}