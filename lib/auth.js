// lib/auth.js
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { connectToDatabase } from './db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          await connectToDatabase();
          
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            throw new Error('No user found with this email');
          }

          // Check if user has a password (not social login only)
          if (!user.password) {
            throw new Error('This email is associated with a social login. Please sign in with Google.');
          }

          // Compare password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role
          };
        } catch (error) {
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectToDatabase();
        
        if (account.provider === 'google') {
          // Check if user exists by email
          let existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Update user if needed
            if (!existingUser.image && user.image) {
              existingUser.image = user.image;
            }
            
            if (!existingUser.emailVerified) {
              existingUser.emailVerified = new Date();
            }
            
            // Add Google account if not already linked
            const hasGoogleAccount = existingUser.accounts?.some(
              acc => acc.provider === 'google' && acc.providerAccountId === account.providerAccountId
            );
            
            if (!hasGoogleAccount) {
              existingUser.accounts = existingUser.accounts || [];
              existingUser.accounts.push({
                provider: 'google',
                providerAccountId: account.providerAccountId,
                type: 'oauth'
              });
            }
            
            // Save without triggering password hash middleware for social login users
            await existingUser.save({ validateBeforeSave: true });
            user.id = existingUser._id.toString();
          } else {
            // Create new user for Google login - no password needed
            const newUser = new User({
              name: user.name || profile?.name || user.email.split('@')[0],
              email: user.email,
              image: user.image || profile?.picture,
              emailVerified: new Date(),
              accounts: [{
                provider: 'google',
                providerAccountId: account.providerAccountId,
                type: 'oauth'
              }]
            });

            // Save without validation for password field
            await newUser.save({ validateBeforeSave: true });
            user.id = newUser._id.toString();
          }
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.role = user.role;
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};