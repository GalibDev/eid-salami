import Prize from "@/models/Prize";

export const defaultPrizes = [1, 2, 5, 10, 15, 20];
export const defaultPrizeConfigs = defaultPrizes.map((amount) => ({
  amount,
  chancePercent: Math.round((100 / defaultPrizes.length) * 100) / 100
}));

export async function getActivePrizeAmounts() {
  const prizes = await Prize.find({ isActive: true }).sort({ amount: 1 }).lean();
  const amounts = prizes.map((prize) => prize.amount);
  return amounts.length ? amounts : defaultPrizes;
}

export async function getActivePrizeConfigs() {
  const prizes = await Prize.find({ isActive: true }).sort({ amount: 1 }).lean();
  const configs = prizes.map((prize) => ({
    amount: prize.amount,
    chancePercent: Number.isFinite(prize.chancePercent) ? prize.chancePercent : 0
  }));

  if (!configs.length) return defaultPrizeConfigs;

  const totalChance = sumPrizeChance(configs);
  if (totalChance <= 0) {
    const baseChance = Math.floor((100 / configs.length) * 100) / 100;
    const equalConfigs = configs.map((prize) => ({ ...prize, chancePercent: baseChance }));
    equalConfigs[equalConfigs.length - 1].chancePercent =
      Math.round((100 - baseChance * (equalConfigs.length - 1)) * 100) / 100;
    return equalConfigs;
  }

  return configs;
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

export function normalizePrizeConfigs(value: unknown) {
  if (!Array.isArray(value)) return [];

  const configMap = new Map<number, number>();

  value.forEach((item) => {
    if (typeof item === "number") {
      configMap.set(Math.round(item), 0);
      return;
    }

    if (!item || typeof item !== "object") return;

    const config = item as { amount?: unknown; chancePercent?: unknown };
    const amount = Math.round(Number(config.amount));
    const chancePercent = Math.max(0, Math.round(Number(config.chancePercent) * 100) / 100);

    if (Number.isFinite(amount) && amount > 0 && Number.isFinite(chancePercent)) {
      configMap.set(amount, chancePercent);
    }
  });

  return Array.from(configMap.entries())
    .map(([amount, chancePercent]) => ({ amount, chancePercent }))
    .sort((a, b) => a.amount - b.amount);
}

export function sumPrizeChance(configs: Array<{ amount: number; chancePercent: number }>) {
  return Math.round(configs.reduce((sum, prize) => sum + prize.chancePercent, 0) * 100) / 100;
}
