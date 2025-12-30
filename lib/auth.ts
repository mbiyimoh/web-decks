import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { isEmailAllowed } from './email-allowlist';
import './auth-types'; // Import type extensions

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Check password against env var
        const expectedPassword = process.env.LEARNING_PASSWORD;
        if (!expectedPassword || password !== expectedPassword) {
          return null;
        }

        return {
          id: email,
          email: email,
          name: email.split('@')[0],
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Validate email domain/allowlist for ALL providers
      if (!user.email || !isEmailAllowed(user.email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Persist user id to JWT on first sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/learning',
    error: '/learning',
  },
});
