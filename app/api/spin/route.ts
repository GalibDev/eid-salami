import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getActivePrizeAmounts } from "@/lib/prizes";
import Code from "@/models/Code";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { code, redeemerName } = (await request.json()) as { code?: string; redeemerName?: string };
    const cleanCode = code?.trim().toUpperCase();
    const cleanName = redeemerName?.trim().slice(0, 80) || "";

    if (!cleanCode) {
      return NextResponse.json({ ok: false, message: "Code is required." }, { status: 400 });
    }

    const prizes = await getActivePrizeAmounts();
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    const updatedCode = await Code.findOneAndUpdate(
      { code: cleanCode, isUsed: false },
      { $set: { isUsed: true, prizeWon: prize, redeemerName: cleanName, usedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updatedCode) {
      return NextResponse.json({ ok: false, message: "Invalid or already used code." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, prize });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Spin failed." },
      { status: 500 }
    );
  }
}
