"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import SpinWheel from "@/components/SpinWheel";

type ValidateResponse = {
  ok: boolean;
  message?: string;
  prizes?: number[];
};

export default function HomePage() {
  const [code, setCode] = useState("");
  const [validatedCode, setValidatedCode] = useState("");
  const [prizes, setPrizes] = useState<number[]>([1, 2, 5, 10, 15, 20]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function validateCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setMessage("Please enter your redeem code.");
      return;
    }

    setLoading(true);
    setMessage("");
    setValidatedCode("");

    const response = await fetch("/api/validate-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: cleanCode })
    });
    const data = (await response.json()) as ValidateResponse;

    if (!response.ok || !data.ok) {
      setMessage(data.message || "This code is invalid or already used.");
    } else {
      setPrizes(data.prizes?.length ? data.prizes : [1, 2, 5, 10, 15, 20]);
      setValidatedCode(cleanCode);
      setMessage("Your code is ready. Tap the wheel button once.");
    }

    setLoading(false);
  }

  return (
    <main className="eid-pattern relative min-h-screen overflow-hidden px-4 py-6 text-eid-cream sm:px-6 lg:px-8">
      <Decorations />

      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="text-xl font-black tracking-wide text-eid-gold">Eid Salami</div>
        <Link
          href="/admin/login"
          className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15"
        >
          Owner
        </Link>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="animate-rise">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-eid-gold">
            Eid Mubarak
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-6xl">
            Spin your one-time code for Eid Salami.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
            Enter a valid CDK, unlock the festive prize wheel, and receive your salami amount.
            Each code works exactly once.
          </p>

          <form onSubmit={validateCode} className="glass mt-8 max-w-xl rounded-2xl p-4 sm:p-5">
            <label htmlFor="code" className="mb-2 block text-sm font-semibold text-white/85">
              Redeem code
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                id="code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="EID-ABCD1234"
                className="h-13 w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-base font-bold uppercase tracking-widest text-eid-ink outline-none ring-eid-gold/50 transition placeholder:text-eid-ink/35 focus:ring-4"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-eid-gold px-6 py-3 font-black text-eid-ink shadow-glow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {loading ? "Checking..." : "Start Spin"}
              </button>
            </div>
            {message ? <p className="mt-3 text-sm font-semibold text-white/86">{message}</p> : null}
          </form>
        </div>

        <div className="flex justify-center lg:justify-end">
          <SpinWheel code={validatedCode} prizes={prizes} />
        </div>
      </section>
    </main>
  );
}

function Decorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[7%] top-24 h-24 w-24 animate-float rounded-full border-[14px] border-eid-gold/70" />
      <div className="absolute left-[11%] top-20 h-24 w-24 rounded-full bg-[#05603a]" />
      <div className="absolute right-[12%] top-20 text-5xl text-eid-gold animate-twinkle">★</div>
      <div className="absolute bottom-24 left-[18%] text-3xl text-white/70 animate-twinkle">✦</div>
      <div className="absolute bottom-28 right-[10%] h-44 w-44 rounded-full bg-eid-gold/10 blur-3xl" />
    </div>
  );
}
