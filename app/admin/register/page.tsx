"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    let uploadedProfileImageUrl = "";

    if (profileImage) {
      const imageForm = new FormData();
      imageForm.append("image", profileImage);
      imageForm.append("setupPassword", setupPassword);

      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: imageForm
      });
      const uploadData = (await uploadResponse.json()) as { ok: boolean; url?: string; message?: string };

      if (!uploadResponse.ok || !uploadData.ok || !uploadData.url) {
        setMessage(uploadData.message || "Profile image upload failed.");
        setLoading(false);
        return;
      }

      uploadedProfileImageUrl = uploadData.url;
    }

    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password, setupPassword, profileImageUrl: uploadedProfileImageUrl })
    });
    const data = (await response.json()) as { ok: boolean; message?: string };

    if (!response.ok || !data.ok) {
      setMessage(data.message || "Registration failed.");
      setLoading(false);
      return;
    }

    setMessage("Admin registered. You can login now.");
    window.setTimeout(() => router.push("/admin/login"), 900);
  }

  return (
    <main className="eid-pattern flex min-h-screen items-center justify-center px-4 py-10 text-eid-cream">
      <section className="glass w-full max-w-lg rounded-3xl p-6 sm:p-8">
        <Link href="/admin/login" className="text-sm font-semibold text-eid-gold">
          Back to login
        </Link>
        <h1 className="mt-5 text-3xl font-black text-white">Admin Registration</h1>
        <p className="mt-2 text-sm leading-6 text-white/72">
          Use the setup password from <span className="font-bold text-white">ADMIN_PASSWORD</span> to create another admin.
        </p>

        <a
          href="/api/auth/signin/google?callbackUrl=/api/admin/google-login"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-black text-eid-ink shadow-glow transition hover:scale-[1.01]"
        >
          Register / login with Google
        </a>

        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/55">
          <span className="h-px flex-1 bg-white/20" />
          or
          <span className="h-px flex-1 bg-white/20" />
        </div>

        <form onSubmit={register} className="space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Admin name"
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition focus:ring-4"
          />
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            placeholder="Username"
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition focus:ring-4"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition focus:ring-4"
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setProfileImage(file);
              setPreviewUrl(file ? URL.createObjectURL(file) : "");
            }}
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition file:mr-4 file:rounded-lg file:border-0 file:bg-eid-gold file:px-3 file:py-2 file:font-black file:text-eid-ink focus:ring-4"
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="h-24 w-24 rounded-full border-2 border-eid-gold object-cover"
            />
          ) : null}
          <input
            type="password"
            value={setupPassword}
            onChange={(event) => setSetupPassword(event.target.value)}
            placeholder="Setup password"
            className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 font-semibold text-eid-ink outline-none ring-eid-gold/50 transition focus:ring-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-eid-gold px-5 py-3 font-black text-eid-ink shadow-glow transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm font-semibold text-eid-gold">{message}</p> : null}
      </section>
    </main>
  );
}
