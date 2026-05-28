import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Code from "@/models/Code";

function makeCode() {
  return `EID-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const { count } = (await request.json()) as { count?: number };
  const requestedCount = Math.min(Math.max(Number(count) || 1, 1), 500);
  const created: string[] = [];

  while (created.length < requestedCount) {
    const code = makeCode();
    try {
      await Code.create({ code });
      created.push(code);
    } catch {
      // A duplicate is unlikely, but retrying keeps generation simple and reliable.
    }
  }

  return NextResponse.json({ ok: true, codes: created });
}
