import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Function to get prisma and adapter conditionally
function getPrismaAdapter() {
  if (!process.env.DATABASE_URL) {
    return { prisma: null, adapter: undefined };
  }
  
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/db');
  return { 
    prisma, 
    adapter: PrismaAdapter(prisma) as any 
  };
}

const { prisma, adapter } = getPrismaAdapter();

export const authOptions: NextAuthOptions = {
  adapter,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        if (!prisma) {
          throw new Error('Database not available');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user?.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture, // Ensure we get the profile picture
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth account linking to existing users with same email
      if (account?.provider && account.provider !== 'credentials') {
        const email = user.email;
        if (email) {
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { accounts: true },
          });

          if (existingUser) {
            // Check if this provider is already linked
            const isLinked = existingUser.accounts.some(
              acc => acc.provider === account.provider && 
                     acc.providerAccountId === account.providerAccountId
            );

            if (!isLinked) {
              // Link the OAuth account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            }

            // Update user info with OAuth provider data
            const updateData: any = {};

            // Always update image from OAuth providers (Google/GitHub profile pictures)
            if (user.image) {
              updateData.image = user.image;

              // Debug logging for profile pictures
              if (process.env.NODE_ENV === 'development') {
                console.log('SignIn callback - Updating user image:', user.image);
                console.log('Provider:', account.provider);
              }
            }

            // Update name if user doesn't have one
            if (!existingUser.name && user.name) {
              updateData.name = user.name;
            }

            // Apply updates if any
            if (Object.keys(updateData).length > 0) {
              const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: updateData,
              });

              if (process.env.NODE_ENV === 'development') {
                console.log('User updated with new data:', updatedUser);
              }
            }

            // Set the correct user id for the session
            user.id = existingUser.id;
            return true;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // For OAuth providers, ensure we use the correct user id
      if (account?.provider && account.provider !== 'credentials') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        // Fetch latest user data from database to ensure profile picture is up to date
        if (prisma) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            },
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.email = dbUser.email;
            session.user.image = dbUser.image;

            // Debug logging for profile pictures
            if (process.env.NODE_ENV === 'development') {
              console.log('Session callback - User image:', dbUser.image);
            }
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: undefined, // Use default NextAuth pages
    error: undefined,
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};