// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function POST(req) {
  try {
    await connectToDatabase();
    
    const { name, email, password } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User already exists with this email' 
      }, { status: 400 });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'User created successfully', 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}