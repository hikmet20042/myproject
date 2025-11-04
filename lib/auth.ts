import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import dbConnect from './mongoose'
import User from './models/User'
import NGO from './models/NGO'

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
        password: { label: 'Password', type: 'password' },
        accountType: { label: 'Account Type', type: 'text' }
      },
      async authorize(credentials) {
        await dbConnect();
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const accountType = credentials.accountType || 'user';
          
          if (accountType === 'ngo') {
            // Authenticate NGO
            const ngo = await NGO.findOne({ email: credentials.email });
            if (!ngo || !ngo.password) {
              return null;
            }
            
            // Check if email is verified
            if (!ngo.emailVerified) {
              throw new Error('Please verify your email before signing in');
            }
            
            const isPasswordValid = await bcrypt.compare(credentials.password, ngo.password);
            if (!isPasswordValid) {
              return null;
            }
            // Return NGO user object (role is not set for NGOs, use isApprovedNGO instead)
            return {
              id: ngo._id.toString(),
              email: ngo.email,
              name: ngo.organizationName,
              image: null,
              role: undefined, // NGOs don't have a role in User collection
              emailVerified: true,
              isApprovedNGO: ngo.status === 'approved'
            };
          } else {
            // Authenticate regular user
            const user = await User.findOne({ email: credentials.email });
            if (!user || !user.password) {
              return null;
            }
            
            // Check if email is verified
            if (!user.emailVerified) {
              throw new Error('Please verify your email before signing in');
            }
            
            // Check if user registered with credentials (not Google)
            if (user.authProvider === 'google') {
              throw new Error('This account was created with Google. Please sign in with Google');
            }
            
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            if (!isPasswordValid) {
              return null;
            }
            // Return verified user
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
              emailVerified: true
            };
          }
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
          // Special flag to identify NGO sessions (when role is undefined but isApprovedNGO exists)
          token.isNGOAccount = (user as any).isApprovedNGO !== undefined && !user.role;
        }
        
        // For Google OAuth, check if user exists in our database
        if (account?.provider === 'google' && user?.email) {
          try {
            // Check if email exists as NGO (NGOs can't use Google OAuth)
            const existingNGO = await NGO.findOne({ email: user.email });
            if (existingNGO) {
              throw new Error('This email is registered as an NGO. Please sign in with your password');
            }
            
            let existingUser = await User.findOne({ email: user.email });
            
            if (existingUser) {
              // User exists - check if they registered with credentials
              if (existingUser.authProvider === 'credentials') {
                throw new Error('This account was created with email/password. Please sign in with your credentials');
              }
              // User registered with Google - allow login
              token.id = existingUser._id.toString();
              token.role = existingUser.role;
              token.isApprovedNGO = false;
            } else {
              // Create new user from Google OAuth
              existingUser = await User.create({
                email: user.email,
                name: user.name || 'User',
                image: user.image,
                emailVerified: new Date(),
                role: 'user',
                authProvider: 'google'
              });
              token.id = existingUser._id.toString();
              token.role = existingUser.role;
              token.isApprovedNGO = false;
            }
          } catch (error) {
            console.error('Error handling Google OAuth user:', error);
            throw error; // Throw error to prevent sign in
          }
        }
      }
      
      // For token refresh, return existing token without database calls
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string || undefined
        session.user.emailVerified = token.emailVerified as boolean
        session.user.isApprovedNGO = token.isApprovedNGO as boolean
        
        // Check if user is admin (cached in token to avoid DB calls)
        // Only apply to users, not NGO accounts
        if (!token.isNGOAccount && session.user.email === 'hikmat.mammadlii@gmail.com') {
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
