import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getActivePrizeConfigs, normalizePrizeConfigs, sumPrizeChance } from "@/lib/prizes";
import Prize from "@/models/Prize";

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const prizeConfigs = await getActivePrizeConfigs();

  return NextResponse.json({
    ok: true,
    prizes: prizeConfigs.map((prize) => prize.amount),
    prizeConfigs
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  await connectDB();
  const body = (await request.json()) as { prizes?: unknown };
  const prizeConfigs = normalizePrizeConfigs(body.prizes);

  if (!prizeConfigs.length) {
    return NextResponse.json({ ok: false, message: "Add at least one valid prize amount." }, { status: 400 });
  }

  const totalChance = sumPrizeChance(prizeConfigs);
  if (totalChance !== 100) {
    return NextResponse.json(
      { ok: false, message: `Prize chances must total 100%. Current total is ${totalChance}%.` },
      { status: 400 }
    );
  }

  await Prize.updateMany({}, { $set: { isActive: false } });
  await Promise.all(
    prizeConfigs.map((prize) =>
      Prize.findOneAndUpdate(
        { amount: prize.amount },
        { $set: { amount: prize.amount, chancePercent: prize.chancePercent, isActive: true } },
        { upsert: true, new: true }
      )
    )
  );

  return NextResponse.json({ ok: true, prizes: prizeConfigs.map((prize) => prize.amount), prizeConfigs });
}
