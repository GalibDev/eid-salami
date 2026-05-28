import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { findOrCreateGoogleAdmin, setAdminCookie, signAdminToken } from "@/lib/auth";
import { authOptions } from "@/lib/next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/admin/login?error=google", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const admin = await findOrCreateGoogleAdmin({
    name: session.user.name || "Google Admin",
    email: session.user.email,
    googleId: session.user.email,
    image: session.user.image || ""
  });
  const token = signAdminToken(admin._id.toString());
  setAdminCookie(token);

  return NextResponse.redirect(new URL("/admin/dashboard", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
