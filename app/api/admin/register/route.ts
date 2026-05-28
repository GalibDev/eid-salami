import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, username, password, profileImageUrl, setupPassword } = (await request.json()) as {
      name?: string;
      username?: string;
      password?: string;
      profileImageUrl?: string;
      setupPassword?: string;
    };

    const cleanName = name?.trim() || "Owner";
    const cleanUsername = username?.trim().toLowerCase();
    const adminCount = await Admin.countDocuments({});
    const envPassword = process.env.ADMIN_PASSWORD;
    const isLoggedIn = Boolean(requireAdmin());
    const hasSetupPassword = Boolean(envPassword && setupPassword === envPassword);

    if (adminCount > 0 && !isLoggedIn && !hasSetupPassword) {
      return NextResponse.json(
        { ok: false, message: "Registration is protected. Use setup password or login first." },
        { status: 401 }
      );
    }

    if (!cleanUsername || !password || password.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Username and a 6+ character password are required." },
        { status: 400 }
      );
    }

    const existingAdmin = await Admin.findOne({ username: cleanUsername });
    if (existingAdmin) {
      return NextResponse.json({ ok: false, message: "This username is already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      name: cleanName,
      username: cleanUsername,
      profileImageUrl: profileImageUrl?.trim() || "",
      passwordHash
    });

    return NextResponse.json({
      ok: true,
      admin: {
        id: admin._id.toString(),
        name: admin.name || "Owner",
        username: admin.username,
        profileImageUrl: admin.profileImageUrl || ""
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 }
    );
  }
}
