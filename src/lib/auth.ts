import { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import db from "./db";
import bcrypt from "bcryptjs";

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

        // Find user by username or email
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

        // Return user fields conforming to next-auth user
        return {
          id: user.id,
          name: user.username, // using username as name
          email: user.email,
          username: user.username,
          reputation: user.reputation,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.reputation = user.reputation;
        token.avatarUrl = user.avatarUrl;
      }
      
      // Reactive reputation / avatar update if trigger occurs
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.reputation = token.reputation as number;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
