// app/providers.js
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }) {
  return <SessionProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </SessionProvider>;
}