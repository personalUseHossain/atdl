// app/api/contact/submit/route.js
import { NextResponse } from 'next/server';
import ContactMessage from '@/models/ContactMessage';
import rateLimit from '@/lib/rateLimit';
import { connectToDatabase } from '@/lib/db';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
});

export async function POST(request) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const isRateLimited = await limiter.check(10, ip); // 10 requests per minute per IP
    
    if (isRateLimited) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { status: 429 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get request data
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'All fields are required' 
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Message length validation
    if (message.length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message must be at least 10 characters long' 
        },
        { status: 400 }
      );
    }

    // Subject validation
    const validSubjects = [
      'General Inquiry',
      'Technical Support',
      'Sales Question',
      'Partnership',
      'Feedback',
      'Other'
    ];
    
    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid subject selected' 
        },
        { status: 400 }
      );
    }

    // Get user metadata
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';

    // Create contact message
    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject,
      message: message.trim(),
      ipAddress: ip,
      userAgent,
      metadata: {
        referer,
        timestamp: new Date().toISOString(),
        contentType: request.headers.get('content-type') || 'unknown'
      }
    });

    // Optional: Send email notification (you can implement this separately)
    // await sendContactNotification(contactMessage);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: {
        id: contactMessage._id,
        createdAt: contactMessage.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    // Handle duplicate submissions
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Duplicate submission detected' 
        },
        { status: 400 }
      );
    }

    // Handle validation errors
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

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve messages (protected - admin only)
export async function GET(request) {
  try {
    // You should add authentication middleware here
    // For now, we'll just return unauthorized
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unauthorized' 
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('Get contact messages error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}