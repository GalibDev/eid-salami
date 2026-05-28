import Prize from "@/models/Prize";

export const defaultPrizes = [1, 2, 5, 10, 15, 20];

export async function getActivePrizeAmounts() {
  const prizes = await Prize.find({ isActive: true }).sort({ amount: 1 }).lean();
  const amounts = prizes.map((prize) => prize.amount);
  return amounts.length ? amounts : defaultPrizes;
}

export function normalizePrizeAmounts(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((amount) => Number(amount))
        .filter((amount) => Number.isFinite(amount) && amount > 0)
        .map((amount) => Math.round(amount))
    )
  ).sort((a, b) => a - b);
}
