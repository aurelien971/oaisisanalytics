"use client";
// Live console bits: a seconds-precision clock, ticking relative times, and a
// silent auto-refresh that re-pulls Firestore data every 30s.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pad = (n) => String(n).padStart(2, "0");

export function LiveClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <span className="clock">—</span>;
  return (
    <span className="clock">
      {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
      <b>{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</b>
    </span>
  );
}

// "2m 13s ago" — ticks every second under a minute, every 10s after.
export function Ago({ ms }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!ms) return null;
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  let label;
  if (s < 60) label = `${s}s ago`;
  else if (s < 3600) label = `${Math.floor(s / 60)}m ${s % 60}s ago`;
  else if (s < 86400) label = `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
  else label = `${Math.floor(s / 86400)}d ago`;
  return <span suppressHydrationWarning>{label}</span>;
}

export function AutoRefresh({ seconds = 30 }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
