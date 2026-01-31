// app/components/ConditionalFooter.js
'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Define dashboard routes
  const dashboardRoutes = [
    '/dashboard',
    '/graph',
    '/connections',
    '/analytics',
    '/profile',
    '/settings',
    '/research',
    '/login',
    'register'
  ];
  
  // Check if current path starts with any dashboard route
  const isDashboardRoute = dashboardRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Don't show footer on dashboard routes
  if (isDashboardRoute) {
    return null;
  }
  
  return <Footer />;
}