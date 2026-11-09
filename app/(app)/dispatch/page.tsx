"use client";

import { useMemo, useState } from "react";
import { useDemo } from "@/components/DemoProvider";
import { BrandChip, fmtDay, fmtTime, moneyFull } from "@/components/ui";
import { BRANDS } from "@/lib/brands";
import { phxMidnight, type Job, type JobStatus } from "@/lib/data";

const START_H = 6;
const END_H = 23;
const STATUS: Record<JobStatus, { cls: string; icon: string }> = {
  scheduled: { cls: "badge-neutral", icon: "○" },
  "en route": { cls: "badge-accent", icon: "➜" },
  "on site": { cls: "badge-warn", icon: "◐" },
  done: { cls: "badge-good", icon: "✓" },
};

export default function DispatchPage() {
  const { jobs, scope, anchor } = useDemo();
  const today = phxMidnight(anchor);

  const days = useMemo(() => {
    const set = new Set<number>([today]);
    jobs.forEach((j) => {
      const d = phxMidnight(j.start);
      if (d >= today) set.add(d);
    });
    return [...set].sort((a, b) => a - b).slice(0, 4);
  }, [jobs, today]);

  const newest = jobs.find((j) => j.isNew);
  const [day, setDay] = useState<number>(newest ? phxMidnight(newest.start) : today);
  const dayJobs = jobs.filter((j) => phxMidnight(j.start) === day).sort((a, b) => a.start - b.start);
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const pct = (ms: number) => {
    const h = (ms - day) / 3600_000;
    return Math.max(0, Math.min(100, ((h - START_H) / (END_H - START_H)) * 100));
  };
  const nowPct = day === today ? pct(anchor) : null;
  const dayLabel = (d: number) => (d === today ? "Today" : d === today + 86400_000 ? "Tomorrow" : fmtDay(d + 12 * 3600_000));

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Dispatch board</h1>
          <p>Jobs the AI booked land here with the right tech or crew already assigned.</p>
        </div>
        <div className="seg" role="group" aria-label="Day">
          {days.map((d) => (
            <button key={d} aria-pressed={day === d} onClick={() => setDay(d)}>{dayLabel(d)}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{dayLabel(day)} · {fmtDay(day + 12 * 3600_000)}</h2>
          <p>{dayJobs.length} jobs · {moneyFull(dayJobs.reduce((s, j) => s + j.value, 0))} scheduled</p>
        </div>
        <div className="table-wrap">
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", alignItems: "end" }}>
              <div />
              <div style={{ position: "relative", height: 18 }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="muted"
                    style={{ position: "absolute", left: `${((h - START_H) / (END_H - START_H)) * 100}%`, fontSize: 11, transform: "translateX(-50%)" }}
                  >
                    {h % 2 === 0 ? (h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`) : ""}
                  </span>
                ))}
              </div>
            </div>
            {scope.map((b) => (
              <div key={b} style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, padding: "4px 0" }}><BrandChip id={b} long /></div>
                {BRANDS[b].techs.map((t) => {
                  const mine = dayJobs.filter((j) => j.brand === b && j.tech === t.name);
                  return (
                    <div key={t.name} style={{ display: "grid", gridTemplateColumns: "170px 1fr", borderTop: "1px solid var(--border)", minHeight: 52 }}>
                      <div style={{ padding: "8px 8px 8px 0" }}>
                        <div style={{ fontWeight: 550 }}>{t.name}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{t.role}{t.onCall ? " · on call tonight" : ""}</div>
                      </div>
                      <div style={{ position: "relative", background: "repeating-linear-gradient(90deg, transparent 0, transparent calc(100%/17 - 1px), var(--grid) calc(100%/17 - 1px), var(--grid) calc(100%/17))" }}>
                        {nowPct !== null && (
                          <div style={{ position: "absolute", left: `${nowPct}%`, top: 0, bottom: 0, width: 2, background: "var(--critical)", opacity: 0.6 }} />
                        )}
                        {mine.map((j) => (
                          <JobBlock key={j.id} j={j} left={pct(j.start)} width={Math.max(6, pct(j.start + j.durationHrs * 3600_000) - pct(j.start))} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {nowPct !== null && <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Red line is now ({fmtTime(anchor)}).</p>}
      </div>

      <div className="card">
        <div className="card-head"><h2>Job list</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Company</th><th>Job</th><th>Customer</th><th>Tech</th><th>Source</th><th>Status</th><th className="r">Value</th>
              </tr>
            </thead>
            <tbody>
              {dayJobs.map((j) => (
                <tr key={j.id} className={j.isNew ? "new-flash" : undefined}>
                  <td className="num">{fmtTime(j.start)}</td>
                  <td><BrandChip id={j.brand} /></td>
                  <td>
                    <div style={{ fontWeight: 550 }}>{j.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{j.id}</div>
                  </td>
                  <td>{j.customer}<div className="muted" style={{ fontSize: 12 }}>{j.address}</div></td>
                  <td>{j.tech}</td>
                  <td>{j.source}</td>
                  <td>
                    <span className={`badge ${STATUS[j.status].cls}`}><span aria-hidden>{STATUS[j.status].icon}</span>{cap(j.status)}</span>
                    {j.emergency && <span className="badge badge-critical" style={{ marginLeft: 4 }}><span aria-hidden>!</span>Emergency</span>}
                  </td>
                  <td className="r">{moneyFull(j.value)}</td>
                </tr>
              ))}
              {dayJobs.length === 0 && (
                <tr><td colSpan={8} className="muted">Nothing scheduled.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function JobBlock({ j, left, width }: { j: Job; left: number; width: number }) {
  return (
    <div
      className={j.isNew ? "new-flash" : undefined}
      title={`${j.title} · ${j.customer} · ${fmtTime(j.start)}`}
      style={{
        position: "absolute",
        left: `${left}%`,
        width: `${width}%`,
        top: 6,
        bottom: 6,
        borderRadius: 6,
        background: "var(--surface-2)",
        borderLeft: `4px solid ${BRANDS[j.brand].color}`,
        outline: j.emergency ? "1.5px solid var(--critical)" : undefined,
        padding: "3px 6px",
        overflow: "hidden",
        fontSize: 11.5,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{j.emergency ? "! " : ""}{j.title}</div>
      <div className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{fmtTime(j.start)} · {j.customer}</div>
    </div>
  );
}
