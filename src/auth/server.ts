/*
 * @Author: Mael mael.liang@live.com
 * @Date: 2025-07-05 16:15:05
 * @LastEditors: Mael mael.liang@live.com
 * @LastEditTime: 2025-07-06 10:44:41
 * @FilePath: /exif-photo-blog/src/auth/server.ts
 * @Description:
 */
import { isPathProtected } from '@/app/paths';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      async authorize({ email, password }) {
        if (
          process.env.ADMIN_EMAIL &&
          process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD &&
          process.env.ADMIN_PASSWORD === password
        ) {
          const user: User = { email, name: 'Admin User' };
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const isUrlProtected = isPathProtected(pathname);
      const isUserLoggedIn = !!auth?.user;
      const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;

      return isRequestAuthorized;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  trustHost: true,
});

export const runAuthenticatedAdminServerAction = async <T>(callback: () => T): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  } else {
    throw new Error('Unauthorized server action request');
  }
};
