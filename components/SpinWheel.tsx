"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SpinWheelProps = {
  code: string;
  redeemerName: string;
  prizes: number[];
};

type SpinResponse = {
  ok: boolean;
  prize?: number;
  message?: string;
};

type ClaimResponse = {
  ok: boolean;
  message?: string;
};

const colors = ["#f8c84c", "#0f8a5f", "#fff8df", "#d4483f", "#31b184", "#f5a623"];

export default function SpinWheel({ code, redeemerName, prizes }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimSaved, setClaimSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setResult(null);
    setMessage("");
    setClaimPhone("");
    setClaimSaved(false);
    setShowConfetti(false);
  }, [code]);

  const wheelBackground = useMemo(() => {
    const segment = 360 / prizes.length;
    return `conic-gradient(${prizes
      .map((_, index) => `${colors[index % colors.length]} ${index * segment}deg ${(index + 1) * segment}deg`)
      .join(", ")})`;
  }, [prizes]);

  async function spin() {
    if (!code || spinning || result !== null) return;

    setSpinning(true);
    setMessage("");
    setShowConfetti(false);

    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redeemerName })
    });
    const data = (await response.json()) as SpinResponse;

    if (!response.ok || !data.ok || typeof data.prize !== "number") {
      setMessage(data.message || "This code cannot be used for another spin.");
      setSpinning(false);
      return;
    }

    const prizeIndex = Math.max(0, prizes.findIndex((prize) => prize === data.prize));
    const segment = 360 / prizes.length;
    const centerOfPrize = prizeIndex * segment + segment / 2;
    const fullSpins = 6 * 360;
    const currentOffset = ((rotation % 360) + 360) % 360;
    const nextRotation = fullSpins - centerOfPrize - currentOffset;

    setRotation((current) => current + nextRotation);

    window.setTimeout(() => {
      setResult(data.prize!);
      setShowConfetti(true);
      setSpinning(false);
    }, 4300);
  }

  async function saveClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, claimPhone })
    });
    const data = (await response.json()) as ClaimResponse;

    if (!response.ok || !data.ok) {
      setMessage(data.message || "Could not save your bKash number.");
      return;
    }

    setClaimSaved(true);
    setMessage(claimPhone.trim() ? "Your bKash number was saved for claim." : "Claim number skipped.");
  }

  return (
    <section className="glass w-full max-w-[520px] rounded-3xl p-5 text-center sm:p-7">
      {showConfetti ? <Confetti /> : null}

      <div className="relative mx-auto aspect-square w-full max-w-[400px]">
        <div className="absolute left-1/2 top-[-8px] z-20 -translate-x-1/2">
          <div className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-eid-gold drop-shadow-lg" />
        </div>

        <div
          className="absolute inset-0 rounded-full border-[10px] border-eid-gold shadow-glow transition-transform duration-[4300ms] ease-out"
          style={{ background: wheelBackground, transform: `rotate(${rotation}deg)` }}
        >
          {prizes.map((prize, index) => {
            const segment = 360 / prizes.length;
            const angle = index * segment + segment / 2;
            return (
              <div
                key={`${prize}-${index}`}
                className="absolute left-1/2 top-1/2 h-1/2 origin-top"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span
                  className="absolute -top-[92%] left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-eid-ink shadow sm:text-base"
                  style={{ transform: `rotate(${-angle}deg)` }}
                >
                  {prize}৳
                </span>
              </div>
            );
          })}
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-eid-gold bg-eid-emerald shadow-xl" />
        </div>
      </div>

      <button
        type="button"
        disabled={!code || spinning || result !== null}
        onClick={spin}
        className="mt-7 w-full rounded-2xl bg-white px-6 py-4 text-lg font-black text-eid-emerald shadow-glow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {spinning ? "Spinning..." : result === null ? "Spin Now" : "Prize Saved"}
      </button>

      {result !== null ? (
        <div className="mt-5 rounded-2xl bg-eid-gold px-4 py-4 text-eid-ink">
          <p className="text-xl font-black">Congratulations! You got {result}৳ Eid Salami</p>
          <form onSubmit={saveClaim} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={claimPhone}
              onChange={(event) => setClaimPhone(event.target.value)}
              placeholder="bKash number, optional"
              disabled={claimSaved}
              className="rounded-xl border border-eid-ink/15 bg-white px-4 py-3 text-sm font-bold text-eid-ink outline-none ring-eid-emerald/30 placeholder:text-eid-ink/40 focus:ring-4 disabled:opacity-70"
              inputMode="tel"
            />
            <button
              type="submit"
              disabled={claimSaved}
              className="rounded-xl bg-eid-emerald px-5 py-3 text-sm font-black text-white disabled:opacity-70"
            >
              {claimSaved ? "Saved" : "Save Claim"}
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-4 min-h-6 text-sm font-semibold text-white/75">
          {code ? "One tap only. The server saves your result before the wheel lands." : "Enter a valid code to unlock the wheel."}
        </p>
      )}

      {message ? <p className="mt-3 text-sm font-semibold text-red-100">{message}</p> : null}
    </section>
  );
}

function Confetti() {
  return (
    <>
      {Array.from({ length: 42 }).map((_, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[index % colors.length],
            animationDelay: `${Math.random() * 0.45}s`
          }}
        />
      ))}
    </>
  );
}
