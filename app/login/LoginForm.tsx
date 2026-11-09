"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Sign-in failed.");
        setBusy(false);
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <div>
        <h1>Sign in</h1>
        <p className="secondary" style={{ marginTop: 6 }}>Use the login you were given for your company.</p>
      </div>
      <label className="field">
        Username
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && (
        <div role="alert" className="badge badge-critical" style={{ padding: "8px 10px", borderRadius: 8, whiteSpace: "normal" }}>
          {error}
        </div>
      )}
      <button className="btn btn-primary" style={{ height: 40 }} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="muted" style={{ fontSize: 12 }}>Built by ComputerPro.ai for LJ&apos;s, All Faze and Platinum.</p>
    </form>
  );
}
