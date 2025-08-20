import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import dbConnect from './mongoose'
import User from './models/User'

// Extend NextAuth types to include emailVerified in session.user
import { Session, User as NextAuthUser } from 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      emailVerified?: boolean
      isApprovedNGO?: boolean
    }
  }
  interface AppUser extends NextAuthUser {
    role?: string
    emailVerified?: boolean
    isApprovedNGO?: boolean
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        await dbConnect();
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const user = await User.findOne({ email: credentials.email });
          if (!user || !user.password) {
            return null;
          }
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }
          // Allow sign in even if not verified, but add flag
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: user.emailVerified ? true : false
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Only connect to database when necessary (initial sign in or account linking)
      if (user || account) {
        await dbConnect();
        
        if (user) {
          token.role = user.role || 'user';
          token.id = user.id;
          token.emailVerified = (user as any).emailVerified ?? false;
          token.isApprovedNGO = (user as any).isApprovedNGO ?? false;
        }
        
        // For Google OAuth, check if user exists in our database
        if (account?.provider === 'google' && user?.email) {
          try {
            let existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
              // Create new user from Google OAuth
              existingUser = await User.create({
                email: user.email,
                name: user.name || 'User',
                image: user.image,
                emailVerified: new Date(),
                role: 'user',
              });
            }
            token.id = existingUser._id.toString();
            token.role = existingUser.role;
            token.isApprovedNGO = existingUser.role === 'ngo' && existingUser.ngoProfile?.isApproved || false;
          } catch (error) {
            console.error('Error handling Google OAuth user:', error);
          }
        }
      }
      
      // For token refresh, return existing token without database calls
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as boolean
        session.user.isApprovedNGO = token.isApprovedNGO as boolean
        
        // Check if user is admin (cached in token to avoid DB calls)
        if (session.user.email === 'hikmat.mammadlii@gmail.com') {
          session.user.role = 'admin'
          token.role = 'admin' // Cache admin role in token
        }
      }
      return session
    },
    async signIn({ user, account }) {
      // Allow sign in for both OAuth and credentials
      return true
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
