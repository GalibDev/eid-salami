"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = (await response.json()) as { ok: boolean; message?: string };

    if (!response.ok || !data.ok) {
      setMessage(data.message || "Login failed.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main className="eid-pattern flex min-h-screen items-center justify-center px-4 py-10 text-eid-cream">
      <section className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-eid-gold">
          Back to home
        </Link>
        <h1 className="mt-5 text-3xl font-black text-white">Owner Login</h1>
        <p className="mt-2 text-sm leading-6 text-white/72">
          Login with your registered admin username and password.
        </p>

        <form onSubmit={login} className="mt-6 space-y-4">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition focus:ring-4"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Owner password"
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition focus:ring-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-eid-gold px-5 py-3 font-black text-eid-ink shadow-glow transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm font-semibold text-red-100">{message}</p> : null}
        <Link href="/admin/register" className="mt-5 block text-center text-sm font-bold text-eid-gold">
          Register or add an admin profile
        </Link>
      </section>
    </main>
  );
}
