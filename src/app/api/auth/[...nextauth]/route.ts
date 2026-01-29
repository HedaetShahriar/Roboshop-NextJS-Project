import NextAuth, {
  type NextAuthOptions,
  type User as NextAuthUser,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import getDb from "@/lib/mongodb";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // @ts-expect-error - trustHost is supported in next-auth 4.x but not in types
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        const db = await getDb();
        const usersCollection = db.collection("users");

        const email = credentials.email.toLowerCase().trim();
        // Case-insensitive exact match to support legacy mixed-case records
        const user = await usersCollection.findOne({
          email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
        });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword as string,
        );
        if (!passwordsMatch) return null;

        // Update login timestamps for credentials users
        const now = new Date();
        const update: Record<string, Date> = { lastLoginAt: now };
        if (!user.createdAt) update.createdAt = now;
        await usersCollection.updateOne({ _id: user._id }, { $set: update });

        return {
          id: user._id.toString(),
          name: user.name as string,
          email: user.email as string,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    // Ensure correct cookie in dev (non-secure) vs prod (secure)
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Ensure token.sub is the MongoDB user id when possible
      try {
        if (!token?.email && !user?.email) return token;
        const email = (token.email || user?.email || "").toLowerCase().trim();
        if (!email) return token;
        const db = await getDb();
        const users = db.collection("users");
        const existing = await users.findOne({
          email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
        });
        if (existing?._id) token.sub = existing._id.toString();
        if (existing?.role)
          token.role = existing.role as
            | "customer"
            | "seller"
            | "admin"
            | "rider";
        else
          token.role =
            (token.role as "customer" | "seller" | "admin" | "rider") ||
            "customer";
        // Always keep token.picture in sync with DB (so SSR/CSR both see the avatar)
        if (existing?.image) token.picture = existing.image as string;
        // Back-compat: some providers may set token.image instead of token.picture
        if (!token?.picture && (token as JWT & { image?: string })?.image) {
          token.picture = (token as JWT & { image?: string }).image;
        }
      } catch {
        /* ignore */
      }
      // If a client calls session.update, propagate fields to token
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string")
          token.name = session.user.name;
        if (typeof session.user.image === "string")
          token.picture = session.user.image;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      session.user.id = token.sub!;
      session.user.role =
        (token.role as "customer" | "seller" | "admin" | "rider") || "customer";
      // Normalize image field consistently
      const image =
        token.picture ||
        (token as JWT & { image?: string }).image ||
        session.user.image;
      if (image) session.user.image = image;
      return session;
    },
  },
  events: {
    // Upsert user on successful sign-in and record timestamps
    async signIn({ user, account, profile }) {
      try {
        const email = (user?.email || profile?.email || "")
          .toLowerCase()
          .trim();
        if (!email) return;

        const db = await getDb();
        const users = db.collection("users");
        const now = new Date();
        const existing = await users.findOne({
          email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
        });

        if (existing) {
          const update: Record<string, unknown> = {
            lastLoginAt: now,
          };
          // For Google/OAuth, refresh name/image on login
          if (account?.provider === "google") {
            if (user?.name) update.name = user.name;
            if (user?.image) update.image = user.image;
            update.oauthProvider = "google";
          }
          if (!existing.createdAt) update.createdAt = now;
          if (!existing.role) update.role = "customer";
          await users.updateOne({ _id: existing._id }, { $set: update });
        } else {
          // Create new user for Google sign-in
          const doc = {
            name: user?.name || profile?.name || "",
            email,
            image:
              user?.image || (profile as { picture?: string })?.picture || null,
            createdAt: now,
            lastLoginAt: now,
            oauthProvider: account?.provider || "google",
            role: "customer",
          };
          await users.insertOne(doc);
        }
      } catch {
        /* ignore */
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
