import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getActivePrizeAmounts } from "@/lib/prizes";
import Code from "@/models/Code";

async function pickBalancedPrize(prizes: number[]) {
  const winCounts = await Code.aggregate<{ _id: number; count: number }>([
    { $match: { isUsed: true, prizeWon: { $in: prizes } } },
    { $group: { _id: "$prizeWon", count: { $sum: 1 } } }
  ]);
  const countMap = new Map(winCounts.map((item) => [item._id, item.count]));
  const lowestCount = Math.min(...prizes.map((prize) => countMap.get(prize) || 0));
  const leastWonPrizes = prizes.filter((prize) => (countMap.get(prize) || 0) === lowestCount);

  return leastWonPrizes[crypto.randomInt(leastWonPrizes.length)];
}

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
    const prize = await pickBalancedPrize(prizes);

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
