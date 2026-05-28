import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findOrCreateGoogleAdmin } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  pages: {
    signIn: "/admin/login",
    error: "/admin/login"
  },
  callbacks: {
    async signIn({ profile }) {
      try {
        const googleProfile = profile as {
          sub?: string;
          name?: string;
          email?: string;
          picture?: string;
        };

        if (!googleProfile.email || !googleProfile.sub) return false;

        await findOrCreateGoogleAdmin({
          name: googleProfile.name || "Google Admin",
          email: googleProfile.email,
          googleId: googleProfile.sub,
          image: googleProfile.picture
        });

        return true;
      } catch {
        return false;
      }
    }
  }
};
