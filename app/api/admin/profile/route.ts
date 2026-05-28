import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import Admin from "@/models/Admin";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    admin: {
      id: admin._id.toString(),
      name: admin.name || "Owner",
      username: admin.username,
      profileImageUrl: admin.profileImageUrl || ""
    }
  });
}

export async function PUT(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { name, username, profileImageUrl, password } = (await request.json()) as {
    name?: string;
    username?: string;
    profileImageUrl?: string;
    password?: string;
  };

  const cleanUsername = username?.trim().toLowerCase();

  if (!name?.trim() || !cleanUsername) {
    return NextResponse.json({ ok: false, message: "Name and username are required." }, { status: 400 });
  }

  const usernameTaken = await Admin.findOne({ username: cleanUsername, _id: { $ne: admin._id } });
  if (usernameTaken) {
    return NextResponse.json({ ok: false, message: "This username is already used." }, { status: 409 });
  }

  admin.name = name.trim();
  admin.username = cleanUsername;
  admin.profileImageUrl = profileImageUrl?.trim() || "";

  if (password?.trim()) {
    if (password.length < 6) {
      return NextResponse.json({ ok: false, message: "New password must be 6+ characters." }, { status: 400 });
    }
    admin.passwordHash = await bcrypt.hash(password, 12);
  }

  await admin.save();

  return NextResponse.json({
    ok: true,
    admin: {
      id: admin._id.toString(),
      name: admin.name || "Owner",
      username: admin.username,
      profileImageUrl: admin.profileImageUrl || ""
    }
  });
}
