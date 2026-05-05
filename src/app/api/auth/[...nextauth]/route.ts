import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { authAPI } from '@/lib/api';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { data } = await authAPI.login(
            credentials?.email as string,
            credentials?.password as string
          );

          if (data.accessToken) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as {
          id: string;
          accessToken: string;
          refreshToken: string;
        };
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.id = authUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      const nextSession = session as typeof session & {
        accessToken?: string;
        refreshToken?: string;
        user: typeof session.user & { id?: string };
      };

      nextSession.accessToken = token.accessToken as string;
      nextSession.refreshToken = token.refreshToken as string;
      if (nextSession.user) {
        nextSession.user.id = token.id as string;
      }
      return nextSession;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
