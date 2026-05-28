import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getActivePrizeAmounts } from "@/lib/prizes";
import Code from "@/models/Code";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { code } = (await request.json()) as { code?: string };
    const cleanCode = code?.trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ ok: false, message: "Code is required." }, { status: 400 });
    }

    const redeemCode = await Code.findOne({ code: cleanCode }).lean();
    if (!redeemCode) {
      return NextResponse.json({ ok: false, message: "Invalid redeem code." }, { status: 404 });
    }

    if (redeemCode.isUsed) {
      return NextResponse.json({ ok: false, message: "This code was already used." }, { status: 409 });
    }

    const prizes = await getActivePrizeAmounts();
    return NextResponse.json({ ok: true, prizes });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not validate code." },
      { status: 500 }
    );
  }
}
