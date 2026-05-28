import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Code from "@/models/Code";

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const [codes, totalCodes, usedCodes] = await Promise.all([
    Code.find({}).sort({ createdAt: -1 }).limit(300).lean(),
    Code.countDocuments({}),
    Code.countDocuments({ isUsed: true })
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      totalCodes,
      usedCodes,
      unusedCodes: totalCodes - usedCodes
    },
    codes: codes.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      isUsed: item.isUsed,
      prizeWon: item.prizeWon,
      redeemerName: item.redeemerName || "",
      claimPhone: item.claimPhone || "",
      claimedAt: item.claimedAt,
      usedAt: item.usedAt,
      createdAt: item.createdAt
    }))
  });
}

export async function DELETE(request: NextRequest) {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const reset = searchParams.get("reset");

  if (reset === "all") {
    await Code.deleteMany({});
    return NextResponse.json({ ok: true });
  }

  if (!code) {
    return NextResponse.json({ ok: false, message: "Code is required." }, { status: 400 });
  }

  await Code.deleteOne({ code });
  return NextResponse.json({ ok: true });
}
