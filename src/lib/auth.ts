import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, logLogin } from './db';
import { isAdminEmail } from './adminEmails';
import { isAllowedEmail } from './allowedEmails';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        mode: { label: 'Mode', type: 'text' }, // 'login' or 'signup'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;
        const mode = credentials.mode || 'login';

        // ── Allowlist check ──
        if (!isAllowedEmail(email)) {
          throw new Error('Access restricted. This email is not authorized.');
        }

        if (mode === 'signup') {
          // ── Sign up ──
          const name = credentials.name?.trim();
          if (!name) throw new Error('Name is required');

          const existing = getUserByEmail(email);
          if (existing) throw new Error('An account with this email already exists');

          const passwordHash = await bcrypt.hash(password, 12);
          const id = crypto.randomUUID();

          createUser(id, email, name, passwordHash);

          return { id, email, name };
        } else {
          // ── Login ──
          const user = getUserByEmail(email);
          if (!user) throw new Error('No account found with this email');

          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) throw new Error('Invalid password');

          try {
            logLogin(user.id, user.email);
          } catch {
            /* login still succeeds if logging fails */
          }

          return { id: user.id, email: user.email, name: user.name };
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const email = (token.email as string | undefined) ?? session.user.email;
        (session.user as { id?: string; isAdmin?: boolean }).id = token.userId as string;
        (session.user as { id?: string; isAdmin?: boolean }).isAdmin = isAdminEmail(email);
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
