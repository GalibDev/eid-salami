import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, setAdminCookie, verifyAdminPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { password, username } = (await request.json()) as { password?: string; username?: string };

    if (!password) {
      return NextResponse.json({ ok: false, message: "Password is required." }, { status: 400 });
    }

    const admin = await verifyAdminPassword(password, username || "owner");
    if (!admin) {
      return NextResponse.json({ ok: false, message: "Wrong owner password." }, { status: 401 });
    }

    const token = signAdminToken(admin._id.toString());
    setAdminCookie(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Login failed." },
      { status: 500 }
    );
  }
}
