import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { checkLoginRateLimit, recordLoginFailure, resetLoginRateLimit } from "./rate-limit";
import { recordAuditLog } from "./audit-log";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email?.toLowerCase(),
          image: profile.picture,
          role: "CANDIDATE",
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Check brute-force rate limit (ADR-003 compensation for no MFA)
        const rateCheck = checkLoginRateLimit(normalizedEmail);
        if (!rateCheck.allowed) {
          await recordAuditLog({
            actorEmail: normalizedEmail,
            action: "AUTH_LOGIN_RATE_LIMITED",
            entityType: "User",
            metadata: { retryAfterSeconds: rateCheck.retryAfterSeconds },
          });
          throw new Error(
            `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${Math.ceil(
              rateCheck.retryAfterSeconds / 60
            )} menit.`
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) {
          recordLoginFailure(normalizedEmail);
          await recordAuditLog({
            actorEmail: normalizedEmail,
            action: "AUTH_LOGIN_FAILED",
            entityType: "User",
            metadata: { reason: "USER_NOT_FOUND_OR_NO_PASSWORD" },
          });
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          recordLoginFailure(normalizedEmail);
          await recordAuditLog({
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "AUTH_LOGIN_FAILED",
            entityType: "User",
            entityId: user.id,
            metadata: { reason: "INVALID_PASSWORD" },
          });
          throw new Error("Invalid credentials");
        }

        resetLoginRateLimit(normalizedEmail);
        await recordAuditLog({
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "AUTH_LOGIN_SUCCESS",
          entityType: "User",
          entityId: user.id,
          metadata: { provider: "credentials" },
        });

        return user as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours session validity
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        await recordAuditLog({
          actorId: user.id,
          actorEmail: user.email,
          actorRole: (user as any).role || "CANDIDATE",
          action: "AUTH_LOGIN_SUCCESS",
          entityType: "User",
          entityId: user.id,
          metadata: { provider: "google" },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { role: true, id: true },
        });
        token.role = dbUser?.role || (user as any).role || "CANDIDATE";
        token.id = dbUser?.id || user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
