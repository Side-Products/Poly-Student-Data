import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.studentId = (user as { studentId: string | null }).studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { studentId: string | null }).studentId = token.studentId as string | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string })?.role;
      const pathname = nextUrl.pathname;

      // Public routes
      if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
        return true;
      }

      // All other routes require login
      if (!isLoggedIn) return false;

      // Admin routes
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/students") ||
        pathname.startsWith("/marks") ||
        pathname.startsWith("/results") ||
        pathname.startsWith("/export")
      ) {
        return role === "ADMIN";
      }

      // Student routes
      if (pathname.startsWith("/application") || pathname.startsWith("/my-results")) {
        return role === "STUDENT";
      }

      return true;
    },
  },
  providers: [], // providers are added in auth.ts
  secret: process.env.AUTH_SECRET,
};
