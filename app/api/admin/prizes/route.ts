import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { normalizePrizeAmounts } from "@/lib/prizes";
import Prize from "@/models/Prize";

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const prizes = await Prize.find({ isActive: true }).sort({ amount: 1 }).lean();
  return NextResponse.json({ ok: true, prizes: prizes.map((prize) => prize.amount) });
}

export async function POST(request: NextRequest) {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const body = (await request.json()) as { prizes?: unknown };
  const amounts = normalizePrizeAmounts(body.prizes);

  if (!amounts.length) {
    return NextResponse.json({ ok: false, message: "Add at least one valid prize amount." }, { status: 400 });
  }

  await Prize.updateMany({}, { $set: { isActive: false } });
  await Promise.all(
    amounts.map((amount) =>
      Prize.findOneAndUpdate({ amount }, { $set: { amount, isActive: true } }, { upsert: true, new: true })
    )
  );

  return NextResponse.json({ ok: true, prizes: amounts });
}
