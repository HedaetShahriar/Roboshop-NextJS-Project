import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import getDb from "@/lib/mongodb";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const db = await getDb();
        const usersCollection = db.collection("users");

        const email = credentials.email.toLowerCase().trim();
        // Case-insensitive exact match to support legacy mixed-case records
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await usersCollection.findOne({
          email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }
        });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!passwordsMatch) return null;

  // Update login timestamps for credentials users
  const now = new Date();
  const update = { lastLoginAt: now };
  if (!user.createdAt) update.createdAt = now;
  await usersCollection.updateOne({ _id: user._id }, { $set: update });

  return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Ensure token.sub is the MongoDB user id when possible
      try {
        if (!token?.email && !user?.email) return token;
        const email = (token.email || user.email || "").toLowerCase().trim();
        if (!email) return token;
        const db = await getDb();
        const users = db.collection("users");
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existing = await users.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
        if (existing?._id) token.sub = existing._id.toString();
        if (existing?.role) token.role = existing.role;
        else token.role = token.role || 'customer';
        if (existing?.image && !session) {
          // keep token.picture in sync with DB when reloading
          token.picture = existing.image;
        }
      } catch {}
      // If a client calls session.update, propagate fields to token
      if (trigger === 'update' && session?.user) {
        if (typeof session.user.name === 'string') token.name = session.user.name;
        if (typeof session.user.image === 'string') token.picture = session.user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role || 'customer';
      if (token.picture) session.user.image = token.picture;
      return session;
    },
  },
  events: {
    // Upsert user on successful sign-in and record timestamps
    async signIn({ user, account, profile }) {
      try {
        const email = (user?.email || profile?.email || "").toLowerCase().trim();
        if (!email) return;

        const db = await getDb();
        const users = db.collection("users");
        const now = new Date();
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existing = await users.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });

        if (existing) {
          const update = {
            lastLoginAt: now,
          };
          // For Google/OAuth, refresh name/image on login
          if (account?.provider === 'google') {
            if (user?.name) update.name = user.name;
            if (user?.image) update.image = user.image;
            update.oauthProvider = 'google';
          }
          if (!existing.createdAt) update.createdAt = now;
          if (!existing.role) update.role = 'customer';
          await users.updateOne({ _id: existing._id }, { $set: update });
        } else {
          // Create new user for Google sign-in
          const doc = {
            name: user?.name || profile?.name || "",
            email,
            image: user?.image || profile?.picture || null,
            createdAt: now,
            lastLoginAt: now,
            oauthProvider: account?.provider || 'google',
            role: 'customer',
          };
          await users.insertOne(doc);
        }
      } catch {}
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
