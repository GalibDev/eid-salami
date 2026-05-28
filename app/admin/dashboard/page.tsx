"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CodeRow = {
  id: string;
  code: string;
  isUsed: boolean;
  prizeWon: number | null;
  redeemerName: string;
  claimPhone: string;
  claimedAt: string | null;
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

type AdminProfile = {
  id: string;
  name: string;
  username: string;
  profileImageUrl: string;
};

type PrizeConfig = {
  amount: number;
  chancePercent: number;
};

const defaultPrizeConfigs: PrizeConfig[] = [
  { amount: 1, chancePercent: 16.67 },
  { amount: 2, chancePercent: 16.67 },
  { amount: 5, chancePercent: 16.67 },
  { amount: 10, chancePercent: 16.67 },
  { amount: 15, chancePercent: 16.66 },
  { amount: 20, chancePercent: 16.66 }
];

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>(defaultPrizeConfigs);
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

    const [profileResponse, prizeResponse, codeResponse] = await Promise.all([
      fetch("/api/admin/profile"),
      fetch("/api/admin/prizes"),
      fetch("/api/admin/codes")
    ]);

    if (profileResponse.status === 401 || prizeResponse.status === 401 || codeResponse.status === 401) {
      router.push("/admin/login");
      return;
    }

    const profileData = (await profileResponse.json()) as { ok: boolean; admin?: AdminProfile; message?: string };
    const prizeData = (await prizeResponse.json()) as {
      ok: boolean;
      prizes?: number[];
      prizeConfigs?: PrizeConfig[];
      message?: string;
    };
    const codeData = (await codeResponse.json()) as CodesResponse;

    if (profileData.ok && profileData.admin) {
      setProfile(profileData.admin);
      setProfileName(profileData.admin.name);
      setProfileUsername(profileData.admin.username);
      setProfileImageUrl(profileData.admin.profileImageUrl || "");
    }

    if (prizeData.ok && prizeData.prizeConfigs?.length) {
      setPrizeConfigs(prizeData.prizeConfigs);
    } else if (prizeData.ok && prizeData.prizes?.length) {
      const chance = Math.round((100 / prizeData.prizes.length) * 100) / 100;
      setPrizeConfigs(prizeData.prizes.map((amount) => ({ amount, chancePercent: chance })));
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

  async function saveProfile() {
    let nextProfileImageUrl = profileImageUrl;

    if (profileImage) {
      const imageForm = new FormData();
      imageForm.append("image", profileImage);

      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: imageForm
      });
      const uploadData = (await uploadResponse.json()) as { ok: boolean; url?: string; message?: string };

      if (!uploadResponse.ok || !uploadData.ok || !uploadData.url) {
        setMessage(uploadData.message || "Profile image upload failed.");
        return;
      }

      nextProfileImageUrl = uploadData.url;
    }

    const response = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profileName,
        username: profileUsername,
        profileImageUrl: nextProfileImageUrl,
        password: profilePassword
      })
    });
    const data = (await response.json()) as { ok: boolean; message?: string; admin?: AdminProfile };

    if (data.ok && data.admin) {
      setProfile(data.admin);
      setProfileImageUrl(data.admin.profileImageUrl || "");
      setProfileImage(null);
      setProfilePreviewUrl("");
      setProfilePassword("");
      setMessage("Admin profile updated.");
    } else {
      setMessage(data.message || "Could not update profile.");
    }
  }

  async function savePrizes() {
    const prizes = prizeConfigs
      .map((prize) => ({
        amount: Math.round(Number(prize.amount)),
        chancePercent: Math.max(0, Math.round(Number(prize.chancePercent) * 100) / 100)
      }))
      .filter((prize) => prize.amount > 0);

    const response = await fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prizes })
    });
    const data = (await response.json()) as { ok: boolean; message?: string; prizeConfigs?: PrizeConfig[] };

    if (data.ok) {
      setPrizeConfigs(data.prizeConfigs || prizes);
      setMessage("Prize chances saved.");
    } else {
      setMessage(data.message || "Could not save prizes.");
    }
  }

  function updatePrizeConfig(index: number, field: keyof PrizeConfig, value: number) {
    setPrizeConfigs((current) =>
      current.map((prize, prizeIndex) => (prizeIndex === index ? { ...prize, [field]: value } : prize))
    );
  }

  function addPrizeConfig() {
    setPrizeConfigs((current) => [...current, { amount: 25, chancePercent: 0 }]);
  }

  function removePrizeConfig(index: number) {
    setPrizeConfigs((current) => current.filter((_, prizeIndex) => prizeIndex !== index));
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
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={profile} />
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/25 px-4 py-2 font-bold text-white transition hover:bg-white/15"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Total codes" value={stats.totalCodes} />
          <Stat label="Used codes" value={stats.usedCodes} />
          <Stat label="Unused codes" value={stats.unusedCodes} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <ProfileAvatar profile={profile} previewUrl={profilePreviewUrl} large />
                <div>
                  <h2 className="text-xl font-black text-white">Admin Profile</h2>
                  <p className="mt-1 text-sm text-white/70">Update owner name, username, image and password.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="Admin name"
                  className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
                />
                <input
                  value={profileUsername}
                  onChange={(event) => setProfileUsername(event.target.value.toLowerCase())}
                  placeholder="Username"
                  className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
                />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setProfileImage(file);
                    setProfilePreviewUrl(file ? URL.createObjectURL(file) : "");
                  }}
                  className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 file:mr-4 file:rounded-lg file:border-0 file:bg-eid-gold file:px-3 file:py-2 file:font-black file:text-eid-ink focus:ring-4"
                />
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(event) => setProfilePassword(event.target.value)}
                  placeholder="New password, optional"
                  className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
                />
              </div>
              <button
                type="button"
                onClick={saveProfile}
                className="mt-3 rounded-xl bg-white px-5 py-3 font-black text-eid-emerald shadow-glow"
              >
                Save Profile
              </button>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Prize Chances</h2>
                  <p className="mt-1 text-sm text-white/70">Set how often each prize should win. Total must be 100%.</p>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-2 text-sm font-black text-eid-gold">
                  Total {Math.round(prizeConfigs.reduce((sum, prize) => sum + Number(prize.chancePercent || 0), 0) * 100) / 100}%
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {prizeConfigs.map((prize, index) => (
                  <div key={`${prize.amount}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="number"
                      min={1}
                      value={prize.amount}
                      onChange={(event) => updatePrizeConfig(index, "amount", Number(event.target.value))}
                      placeholder="Prize amount"
                      className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={prize.chancePercent}
                      onChange={(event) => updatePrizeConfig(index, "chancePercent", Number(event.target.value))}
                      placeholder="Chance %"
                      className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-bold text-eid-ink outline-none ring-eid-gold/50 focus:ring-4"
                    />
                    <button
                      type="button"
                      onClick={() => removePrizeConfig(index)}
                      className="rounded-xl bg-red-500/25 px-4 py-3 font-black text-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addPrizeConfig}
                  className="rounded-xl bg-white px-5 py-3 font-black text-eid-emerald shadow-glow"
                >
                  Add Prize
                </button>
                <button
                  type="button"
                  onClick={savePrizes}
                  className="rounded-xl bg-eid-gold px-5 py-3 font-black text-eid-ink shadow-glow"
                >
                  Save Chances
                </button>
              </div>
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

function ProfileAvatar({
  profile,
  previewUrl = "",
  large = false
}: {
  profile: AdminProfile | null;
  previewUrl?: string;
  large?: boolean;
}) {
  const size = large ? "h-16 w-16 text-xl" : "h-11 w-11 text-base";
  const initials =
    profile?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  const imageUrl = previewUrl || profile?.profileImageUrl;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={profile?.name || "Admin"}
        className={`${size} rounded-full border-2 border-eid-gold object-cover`}
      />
    );
  }

  return (
    <div className={`${size} flex items-center justify-center rounded-full border-2 border-eid-gold bg-white font-black text-eid-emerald`}>
      {initials}
    </div>
  );
}

function CodesTable({ codes, onDelete }: { codes: CodeRow[]; onDelete: (code: string) => void }) {
  if (!codes.length) {
    return <p className="p-5 text-white/75">No codes yet. Generate a few to begin.</p>;
  }

  return (
    <div className="max-h-[620px] overflow-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-eid-emerald text-eid-gold">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Prize won</th>
            <th className="px-4 py-3">bKash number</th>
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
                  {item.isUsed ? `Used${item.prizeWon ? ` - won ${item.prizeWon}৳` : ""}` : "Unused"}
                </span>
              </td>
              <td className="px-4 py-3">{item.redeemerName || "-"}</td>
              <td className="px-4 py-3">
                {item.prizeWon ? (
                  <span className="rounded-full bg-eid-gold px-3 py-1 font-black text-eid-ink">{item.prizeWon}৳</span>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3">{item.claimPhone || "-"}</td>
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
