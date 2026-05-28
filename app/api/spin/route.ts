import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getActivePrizeConfigs } from "@/lib/prizes";
import Code from "@/models/Code";

function pickWeightedPrize(prizes: Array<{ amount: number; chancePercent: number }>) {
  const activePrizes = prizes.filter((prize) => prize.chancePercent > 0);
  const weightedPrizes = activePrizes.length ? activePrizes : prizes;
  const totalWeight = weightedPrizes.reduce((sum, prize) => sum + Math.max(0, prize.chancePercent), 0);

  if (totalWeight <= 0) {
    return weightedPrizes[crypto.randomInt(weightedPrizes.length)].amount;
  }

  const randomPoint = crypto.randomInt(Math.round(totalWeight * 100)) / 100;
  let runningTotal = 0;

  for (const prize of weightedPrizes) {
    runningTotal += prize.chancePercent;
    if (randomPoint < runningTotal) return prize.amount;
  }

  return weightedPrizes[weightedPrizes.length - 1].amount;
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

    const prizes = await getActivePrizeConfigs();
    const prize = pickWeightedPrize(prizes);

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
