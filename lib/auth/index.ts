import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { createAuthAdapter, getPrismaClient } from './adapter';
import { githubProvider, googleProvider } from './providers';
import { authCallbacks } from './callbacks';
import { SESSION_CONFIG, AUTH_ERROR_MESSAGES } from './constants';
import { verifyPassword } from './password';
import { normalizeEmail } from '@/lib/utils/email';

const prisma = getPrismaClient();
const adapter = createAuthAdapter();

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
          throw new Error(AUTH_ERROR_MESSAGES.MISSING_CREDENTIALS);
        }

        if (!prisma) {
          throw new Error(AUTH_ERROR_MESSAGES.DATABASE_UNAVAILABLE);
        }

        const email = normalizeEmail(credentials.email);
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) {
          throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    githubProvider,
    googleProvider,
  ],
  callbacks: authCallbacks,
  pages: {
    signIn: undefined, // Use default NextAuth pages
    error: undefined, // Use default NextAuth error page
  },
  // Handle OAuth events for logging and error tracking
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser && account?.provider) {
        logger.info(
          {
            email: user.email,
            provider: account.provider,
            userId: user.id,
          },
          'New OAuth user signed up'
        );
      }
    },
  },
  session: SESSION_CONFIG,
  secret: config.auth.secret,
  debug: config.isDevelopment,
};
