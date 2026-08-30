"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Form() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      // Full navigation so middleware sees the new cookie.
      window.location.href = next;
      return;
    }
    setError((await res.json().catch(() => ({}))).error || "Wrong password.");
    setBusy(false);
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <div className="brand"><span className="ring" /><b>OAISIS</b><span>ANALYTICS</span></div>
      <p className="login-sub">Everything behind one password.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        autoComplete="current-password"
      />
      {error && <p className="login-error">{error}</p>}
      <button type="submit" disabled={busy || !password}>{busy ? "Checking…" : "Enter"}</button>
    </form>
  );
}

export default function Login() {
  return (
    <div className="login-wrap">
      <Suspense fallback={null}><Form /></Suspense>
    </div>
  );
}
