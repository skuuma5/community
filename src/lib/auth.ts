import type { AuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import db from "./db";
import bcrypt from "bcryptjs";
import { logServerError } from "@/lib/errors";

// Extend session type to include custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      reputation: number;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    reputation: number;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    reputation?: number;
    avatarUrl?: string | null;
  }
}

async function getTokenUserFields(userId: string): Promise<Partial<JWT>> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        reputation: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return {};
    }

    return {
      id: user.id,
      sub: user.id,
      username: user.username,
      reputation: user.reputation,
      avatarUrl: user.avatarUrl,
    };
  } catch (error) {
    logServerError("getTokenUserFields", error);
    return {};
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        usernameOrEmail: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usernameOrEmail || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findFirst({
          where: {
            OR: [
              { username: credentials.usernameOrEmail },
              { email: credentials.usernameOrEmail },
            ],
          },
        });

        if (!user) {
          throw new Error("No user found with those credentials");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          username: user.username,
          reputation: user.reputation,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.username = user.username;
        token.reputation = user.reputation;
        token.avatarUrl = user.avatarUrl;
        return token;
      }

      const userId =
        typeof token.sub === "string"
          ? token.sub
          : typeof token.id === "string"
            ? token.id
            : undefined;

      if (!userId) {
        return token;
      }

      token.sub = userId;
      token.id = userId;

      if (trigger === "update") {
        return { ...token, ...(await getTokenUserFields(userId)) };
      }

      return token;
    },
    async session({ session, token }) {
      const userId =
        typeof token.sub === "string"
          ? token.sub
          : typeof token.id === "string"
            ? token.id
            : undefined;

      if (session.user && userId) {
        session.user.id = userId;
        session.user.username =
          typeof token.username === "string" ? token.username : "";
        session.user.reputation =
          typeof token.reputation === "number" ? token.reputation : 0;
        session.user.avatarUrl =
          typeof token.avatarUrl === "string" ? token.avatarUrl : null;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
