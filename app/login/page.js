"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon, { Mark } from "@/components/Icon";

function Form() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    params.get("e") === "config"
      ? "This deployment has no AUTH_SECRET or DASHBOARD_PASSWORD set. Add them in Vercel, then redeploy."
      : "",
  );
  const [busy, setBusy] = useState(false);
  const next = params.get("next") || "/";

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
      window.location.href = next; // full load, so middleware sees the cookie
      return;
    }
    setError((await res.json().catch(() => ({}))).error || "Wrong password.");
    setBusy(false);
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <div className="login-head">
        <Mark size={30} />
        <b>OAISIS Analytics</b>
        <span>Everything behind one password</span>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        autoComplete="current-password"
      />
      {error && <p className="login-error">{error}</p>}
      <button type="submit" disabled={busy || !password}>{busy ? "Checking" : "Enter"}</button>
    </form>
  );
}

export default function Login() {
  return <div className="login-wrap"><Suspense fallback={null}><Form /></Suspense></div>;
}
