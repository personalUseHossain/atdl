import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/api/auth/login', 
    '/api/auth/register',
    '/api/auth/me' // Allow checking auth status
  ];
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // For API routes, check Authorization header
  if (pathname.startsWith('/api/')) {
    // Skip auth check for public API routes
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // If it's an API route and there's no token, return 401
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // For page routes, we'll handle authentication client-side
  // Don't redirect in middleware for page routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};