"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemo } from "@/components/DemoProvider";
import { BrandChip, fmtTime, fmtWhen, moneyFull } from "@/components/ui";
import { BRANDS, type BrandId } from "@/lib/brands";
import type { Referral } from "@/lib/data";

interface Scenario {
  key: string;
  to: BrandId;
  title: string;
  spottedBy: string;
  site: string;
  finding: string;
  reading: string;
  aiRead: string;
  value: number;
  contact: string;
  customerText: string;
  job: { title: string; tech: string; durationHrs: number; address: string };
}

const SCENARIOS: Scenario[] = [
  {
    key: "walkin",
    to: "platinum",
    title: "Warm walk-in cooler",
    spottedBy: "Maria R. (LJ's night crew)",
    site: "Valley Food Hall",
    finding: "Walk-in cooler reading 48°F, frost on the door gasket",
    reading: "48°F",
    aiRead: "Thermometer reads 48°F. Safe holding is 41°F or below. Ice on the door gasket points to a bad seal or a failing defrost.",
    value: 1450,
    contact: "Angela (Valley Food Hall GM)",
    customerText:
      "Hi Angela, this is Platinum Refrigeration, LJ's partner. Their crew noticed your walk-in at 48°F tonight. Food above 41°F is at risk. We can have a tech there by 7am, or tonight for emergency rates. Reply 1 for 7am, 2 for tonight.",
    job: { title: "Walk-in at 48°F (LJ's referral)", tech: "Jess K.", durationHrs: 2, address: "1 W Jefferson St" },
  },
  {
    key: "lights",
    to: "allfaze",
    title: "Dead parking lot lights",
    spottedBy: "Andre T. (LJ's warehouse crew)",
    site: "Copper State Distributors",
    finding: "5 of 12 parking lot poles out along the loading dock",
    reading: "5 / 12 out",
    aiRead: "Five pole lights dark along the dock side. That's a safety and liability issue for night shifts. Likely failed LED drivers or a tripped lighting circuit.",
    value: 2600,
    contact: "Rob (facilities manager)",
    customerText:
      "Hi Rob, this is All Faze Electric, LJ's partner. Their crew noticed 5 lot lights out by your loading dock last night. We can troubleshoot and quote it this week, usually same-day repair. Want us to stop by Thursday at 9am?",
    job: { title: "Lot lights out, 5 poles (LJ's referral)", tech: "Ray M.", durationHrs: 3, address: "4400 W Lower Buckeye Rd" },
  },
];

const STEPS = ["Photo uploaded", "AI reads the photo", "Ticket opened", "Customer texted", "On the board"];
const STATUS_ORDER: Referral["status"][] = ["New ticket", "Customer texted", "Booked", "Won"];

export default function CrossSellPage() {
  const { referrals, role, addReferral, addJob, updateReferral, anchor } = useDemo();
  const available = SCENARIOS.filter((s) => role === "owner" || role === "ljs" || role === s.to);
  const [active, setActive] = useState<Scenario | null>(null);
  const [step, setStep] = useState(0);
  const [ids, setIds] = useState<{ ref: string; job: string; at: number } | null>(null);

  useEffect(() => {
    if (!active || step >= STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : 1300);
    return () => clearTimeout(t);
  }, [active, step]);

  useEffect(() => {
    if (!active || !ids || step !== STEPS.length) return;
    addReferral({
      id: ids.ref,
      from: "ljs",
      to: active.to,
      ts: ids.at,
      spottedBy: active.spottedBy,
      site: active.site,
      finding: active.finding,
      status: "Customer texted",
      value: active.value,
      isNew: true,
    });
    addJob({
      id: ids.job,
      brand: active.to,
      title: active.job.title,
      customer: active.site,
      address: active.job.address,
      start: nextMorning(ids.at, active.to === "platinum" ? 7 : 9),
      durationHrs: active.job.durationHrs,
      tech: active.job.tech,
      status: "scheduled",
      value: active.value,
      source: "Cross-sell",
      isNew: true,
    });
    // run once per completed scenario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function run(s: Scenario) {
    const stamp = Date.now().toString(36).slice(-3).toUpperCase();
    setIds({ ref: `R-${stamp}`, job: `J-X${stamp}`, at: Date.now() });
    setActive(s);
    setStep(0);
  }

  const won = referrals.filter((r) => r.status === "Won").reduce((s, r) => s + r.value, 0);
  const open = referrals.filter((r) => r.status !== "Won").reduce((s, r) => s + r.value, 0);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Cross-sell</h1>
          <p>Crews are inside dozens of buildings a week. Anything they spot becomes a ticket for the right partner.</p>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="stat-label">Referrals, last 30 days</div><div className="stat-value">{referrals.length}</div></div>
        <div className="card"><div className="stat-label">Won from referrals</div><div className="stat-value">{moneyFull(won)}</div></div>
        <div className="card"><div className="stat-label">Open referral pipeline</div><div className="stat-value">{moneyFull(open)}</div></div>
        <div className="card"><div className="stat-label">Time from photo to customer text</div><div className="stat-value">~1 min</div><div className="stat-sub">Before: whenever someone remembered</div></div>
      </div>

      {available.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Try it: a crew member snaps a photo</h2>
            <p>The crew just texts a photo to the job thread. The AI does the rest.</p>
          </div>
          <div className="row wrap" style={{ gap: 10, marginBottom: active ? 16 : 0 }}>
            {available.map((s) => (
              <button key={s.key} className="btn" onClick={() => run(s)} disabled={!!active && step < STEPS.length}>
                <BrandChip id="ljs" /> <span className="muted">→</span> <BrandChip id={s.to} />
                <span className="muted" style={{ fontWeight: 500 }}>{s.title}</span>
              </button>
            ))}
          </div>

          {active && (
            <div className="grid" style={{ gridTemplateColumns: "minmax(0, 260px) minmax(0, 1fr)", gap: 20 }}>
              <div>
                <Photo kind={active.key} reading={active.reading} />
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  From {active.spottedBy} at {active.site}, {ids ? fmtTime(ids.at) : ""}
                </div>
              </div>
              <div className="stack" style={{ gap: 12 }}>
                <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STEPS.map((label, i) => (
                    <li key={label} className={`badge ${i < step ? "badge-good" : i === step ? "badge-accent" : "badge-neutral"}`}>
                      <span aria-hidden>{i < step ? "✓" : i + 1}</span>{label}
                    </li>
                  ))}
                </ol>
                {step >= 2 && (
                  <div className="bubble bubble-ai" style={{ maxWidth: "100%" }}>
                    <div className="bubble-who">AI photo read</div>
                    {active.aiRead}
                  </div>
                )}
                {step >= 3 && (
                  <div className="card" style={{ padding: 12, boxShadow: "none" }}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <strong>{ids?.ref} · {BRANDS[active.to].short} ticket</strong>
                      <span className="badge badge-accent">Referral from LJ&apos;s</span>
                    </div>
                    <div style={{ marginTop: 4 }}>{active.finding}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{active.site} · est. {moneyFull(active.value)} · assigned to {active.job.tech}</div>
                  </div>
                )}
                {step >= 4 && (
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Text to {active.contact}</div>
                    <div className="sms" style={{ maxWidth: 480 }}>{active.customerText}</div>
                  </div>
                )}
                {step >= STEPS.length && (
                  <div className="row wrap">
                    <span className="badge badge-good"><span aria-hidden>✓</span>Added to {BRANDS[active.to].short}&apos;s dispatch board</span>
                    <Link className="btn btn-sm btn-primary" href="/dispatch" style={{ marginLeft: "auto" }}>Open dispatch →</Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-head"><h2>Referral log</h2><p>Click a status to move it forward</p></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>From → to</th><th>Site</th><th>What they saw</th><th>Spotted by</th><th>Status</th><th className="r">Value</th></tr>
            </thead>
            <tbody>
              {referrals.map((r) => {
                const idx = STATUS_ORDER.indexOf(r.status);
                const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
                return (
                  <tr key={r.id} className={r.isNew ? "new-flash" : undefined}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtWhen(r.ts, Math.max(anchor, Date.now()))}</td>
                    <td style={{ whiteSpace: "nowrap" }}><BrandChip id={r.from} /> <span className="muted">→</span> <BrandChip id={r.to} /></td>
                    <td>{r.site}</td>
                    <td>{r.finding}</td>
                    <td className="secondary">{r.spottedBy}</td>
                    <td>
                      <button
                        className={`badge ${r.status === "Won" ? "badge-good" : r.status === "Booked" ? "badge-accent" : "badge-warn"}`}
                        style={{ cursor: r.status === "Won" ? "default" : "pointer" }}
                        onClick={() => r.status !== "Won" && updateReferral(r.id, { status: next })}
                        title={r.status === "Won" ? undefined : `Mark as ${next}`}
                      >
                        <span aria-hidden>{r.status === "Won" ? "✓" : "→"}</span>{r.status}
                      </button>
                    </td>
                    <td className="r">{moneyFull(r.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@media (max-width: 720px){ .card > .grid[style] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function nextMorning(now: number, hour: number) {
  const PHX = 7 * 3600_000;
  const d = new Date(now - PHX + 86400_000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.getTime() + PHX;
}

function Photo({ kind, reading }: { kind: string; reading: string }) {
  if (kind === "walkin") {
    return (
      <svg viewBox="0 0 260 200" style={{ width: "100%", borderRadius: 10, display: "block" }} role="img" aria-label="Photo of a walk-in cooler door with a thermometer reading 48 degrees">
        <rect width="260" height="200" fill="#3b4250" />
        <rect x="40" y="18" width="150" height="182" rx="4" fill="#b9c0c8" />
        <rect x="46" y="24" width="138" height="176" rx="3" fill="#cfd5db" />
        <rect x="44" y="22" width="142" height="4" fill="#eef6fb" opacity=".9" />
        <rect x="44" y="22" width="4" height="178" fill="#eef6fb" opacity=".8" />
        <rect x="160" y="96" width="14" height="40" rx="3" fill="#6b7480" />
        <rect x="200" y="40" width="48" height="64" rx="6" fill="#111" />
        <text x="224" y="78" fill="#ff6b5a" fontFamily="monospace" fontSize="17" fontWeight="700" textAnchor="middle">{reading}</text>
        <text x="224" y="94" fill="#999" fontFamily="sans-serif" fontSize="8" textAnchor="middle">COOLER</text>
        <text x="115" y="70" fill="#7d8690" fontFamily="sans-serif" fontSize="10" fontWeight="700" textAnchor="middle">WALK-IN</text>
        <text x="115" y="84" fill="#7d8690" fontFamily="sans-serif" fontSize="10" fontWeight="700" textAnchor="middle">COOLER</text>
        <rect x="0" y="186" width="260" height="14" fill="#2b2f37" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 260 200" style={{ width: "100%", borderRadius: 10, display: "block" }} role="img" aria-label="Night photo of a parking lot with several pole lights out">
      <rect width="260" height="200" fill="#0f1726" />
      <rect y="150" width="260" height="50" fill="#262b33" />
      {[20, 70, 120, 170, 220].map((x, i) => {
        const on = i === 1 || i === 4;
        return (
          <g key={x}>
            <rect x={x + 8} y="60" width="3" height="92" fill="#4a505a" />
            <rect x={x} y="56" width="20" height="6" rx="2" fill={on ? "#ffe9a8" : "#3a3f48"} />
            {on && <path d={`M${x - 14},150 L${x + 10},62 L${x + 34},150 Z`} fill="#ffe9a8" opacity=".18" />}
          </g>
        );
      })}
      <rect x="0" y="120" width="70" height="32" fill="#1c2230" />
      <text x="35" y="140" fill="#596273" fontFamily="sans-serif" fontSize="8" textAnchor="middle">DOCK 3</text>
      <text x="250" y="20" fill="#ffe9a8" fontFamily="monospace" fontSize="10" textAnchor="end">{reading}</text>
    </svg>
  );
}
