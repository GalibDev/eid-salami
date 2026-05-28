"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CodeRow = {
  id: string;
  code: string;
  isUsed: boolean;
  prizeWon: number | null;
  usedAt: string | null;
  createdAt: string;
};

type CodesResponse = {
  ok: boolean;
  message?: string;
  stats?: {
    totalCodes: number;
    usedCodes: number;
    unusedCodes: number;
  };
  codes?: CodeRow[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [prizeText, setPrizeText] = useState("1, 2, 5, 10, 15, 20");
  const [count, setCount] = useState(10);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [stats, setStats] = useState({ totalCodes: 0, usedCodes: 0, unusedCodes: 0 });
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const winners = useMemo(() => codes.filter((code) => code.isUsed), [codes]);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const [prizeResponse, codeResponse] = await Promise.all([
      fetch("/api/admin/prizes"),
      fetch("/api/admin/codes")
    ]);

    if (prizeResponse.status === 401 || codeResponse.status === 401) {
      router.push("/admin/login");
      return;
    }

    const prizeData = (await prizeResponse.json()) as { ok: boolean; prizes?: number[]; message?: string };
    const codeData = (await codeResponse.json()) as CodesResponse;

    if (prizeData.ok && prizeData.prizes?.length) {
      setPrizeText(prizeData.prizes.join(", "));
    }

    if (codeData.ok) {
      setCodes(codeData.codes || []);
      setStats(codeData.stats || { totalCodes: 0, usedCodes: 0, unusedCodes: 0 });
    } else {
      setMessage(codeData.message || "Could not load dashboard.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function savePrizes() {
    const prizes = prizeText
      .split(",")
      .map((item) => Number(item.trim()))
      .filter(Boolean);

    const response = await fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prizes })
    });
    const data = (await response.json()) as { ok: boolean; message?: string; prizes?: number[] };

    if (data.ok) {
      setPrizeText((data.prizes || prizes).join(", "));
      setMessage("Prize amounts saved.");
    } else {
      setMessage(data.message || "Could not save prizes.");
    }
  }

  async function generateCodes() {
    const response = await fetch("/api/admin/generate-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count })
    });
    const data = (await response.json()) as { ok: boolean; codes?: string[]; message?: string };

    if (data.ok) {
      setGeneratedCodes(data.codes || []);
      setMessage(`Generated ${data.codes?.length || 0} code(s).`);
      await loadDashboard();
    } else {
      setMessage(data.message || "Could not generate codes.");
    }
  }

  async function deleteCode(code: string) {
    await fetch(`/api/admin/codes?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    await loadDashboard();
  }

  async function resetAllCodes() {
    const confirmed = window.confirm("Delete every code and winner record?");
    if (!confirmed) return;

    await fetch("/api/admin/codes?reset=all", { method: "DELETE" });
    setGeneratedCodes([]);
    await loadDashboard();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="eid-pattern min-h-screen px-4 py-6 text-eid-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-sm font-semibold text-eid-gold">
              Public page
            </Link>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Owner Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/25 px-4 py-2 font-bold text-white transition hover:bg-white/15"
          >
            Logout
          </button>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Total codes" value={stats.totalCodes} />
          <Stat label="Used codes" value={stats.usedCodes} />
          <Stat label="Unused codes" value={stats.unusedCodes} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xl font-black text-white">Prize Amounts</h2>
              <p className="mt-1 text-sm text-white/70">Comma-separated taka amounts used by the server.</p>
              <textarea
                value={prizeText}
                onChange={(event) => setPrizeText(event.target.value)}
                className="mt-4 min-h-24 w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
              />
              <button
                type="button"
                onClick={savePrizes}
                className="mt-3 rounded-xl bg-eid-gold px-5 py-3 font-black text-eid-ink shadow-glow"
              >
                Save Prizes
              </button>
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="text-xl font-black text-white">Generate Codes</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
                />
                <button
                  type="button"
                  onClick={generateCodes}
                  className="rounded-xl bg-white px-5 py-3 font-black text-eid-emerald shadow-glow"
                >
                  Generate
                </button>
              </div>
              {generatedCodes.length ? (
                <div className="mt-4 rounded-xl bg-black/18 p-3">
                  <p className="mb-2 text-sm font-bold text-eid-gold">Newest codes</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedCodes.map((item) => (
                      <span key={item} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-eid-ink">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={resetAllCodes}
              className="w-full rounded-2xl border border-red-200/50 bg-red-500/20 px-5 py-3 font-black text-red-50"
            >
              Delete / Reset All Codes
            </button>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 p-5">
              <div>
                <h2 className="text-xl font-black text-white">Codes & Winners</h2>
                <p className="mt-1 text-sm text-white/70">
                  {winners.length} winner(s) saved permanently unless you reset them.
                </p>
              </div>
              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white"
              >
                Refresh
              </button>
            </div>

            {message ? <p className="px-5 pt-4 text-sm font-semibold text-eid-gold">{message}</p> : null}
            {loading ? <p className="p-5 text-white/75">Loading dashboard...</p> : <CodesTable codes={codes} onDelete={deleteCode} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-eid-gold">{label}</p>
      <p className="mt-2 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function CodesTable({ codes, onDelete }: { codes: CodeRow[]; onDelete: (code: string) => void }) {
  if (!codes.length) {
    return <p className="p-5 text-white/75">No codes yet. Generate a few to begin.</p>;
  }

  return (
    <div className="max-h-[620px] overflow-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-eid-emerald text-eid-gold">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Prize</th>
            <th className="px-4 py-3">Used time</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((item) => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="px-4 py-3 font-black text-white">{item.code}</td>
              <td className="px-4 py-3">
                <span className={item.isUsed ? "text-eid-gold" : "text-emerald-100"}>
                  {item.isUsed ? "Used" : "Unused"}
                </span>
              </td>
              <td className="px-4 py-3">{item.prizeWon ? `${item.prizeWon}৳` : "-"}</td>
              <td className="px-4 py-3">{item.usedAt ? new Date(item.usedAt).toLocaleString() : "-"}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onDelete(item.code)}
                  className="rounded-lg bg-red-500/25 px-3 py-2 font-bold text-red-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
