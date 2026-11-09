"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemo } from "@/components/DemoProvider";
import { LineChart, Legend, StackedBars } from "@/components/charts";
import { BrandChip, OutcomeBadge, fmtShortDate, fmtWhen, money, moneyFull, CHANNEL_LABEL } from "@/components/ui";
import { BRANDS } from "@/lib/brands";
import { phxHour, phxMidnight } from "@/lib/data";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
];

export default function DashboardPage() {
  const { calls, referrals, scope, anchor, role } = useDemo();
  const [days, setDays] = useState(30);

  const since = phxMidnight(anchor) - (days - 1) * 86400_000;
  const inRange = useMemo(() => calls.filter((c) => c.ts >= since), [calls, since]);

  const rows = scope.map((b) => {
    const cs = inRange.filter((c) => c.brand === b);
    const after = cs.filter((c) => c.afterHours);
    const booked = cs.filter((c) => c.outcome === "booked" || c.outcome === "emergency");
    const revenue = booked.reduce((s, c) => s + c.value, 0);
    const pipeline = cs.filter((c) => c.outcome === "quoted").reduce((s, c) => s + c.value, 0);
    const resp = cs.length ? cs.reduce((s, c) => s + c.responseSec, 0) / cs.length : 0;
    const refIn = referrals.filter((r) => r.to === b && r.ts >= since).length;
    return { b, calls: cs.length, after: after.length, booked: booked.length, revenue, pipeline, resp, refIn };
  });
  const tot = rows.reduce(
    (a, r) => ({
      calls: a.calls + r.calls,
      after: a.after + r.after,
      booked: a.booked + r.booked,
      revenue: a.revenue + r.revenue,
      pipeline: a.pipeline + r.pipeline,
      respSum: a.respSum + r.resp * r.calls,
      refIn: a.refIn + r.refIn,
    }),
    { calls: 0, after: 0, booked: 0, revenue: 0, pipeline: 0, respSum: 0, refIn: 0 },
  );
  const avgResp = tot.calls ? tot.respSum / tot.calls : 0;
  const afterRevenue = inRange
    .filter((c) => c.afterHours && (c.outcome === "booked" || c.outcome === "emergency"))
    .reduce((s, c) => s + c.value, 0);

  const dayLabels = Array.from({ length: days }, (_, i) => fmtShortDate(since + i * 86400_000 + 12 * 3600_000));
  const daily = scope.map((b) => ({
    key: b,
    label: BRANDS[b].short,
    color: BRANDS[b].color,
    values: Array.from({ length: days }, (_, i) => {
      const start = since + i * 86400_000;
      return inRange.filter((c) => c.brand === b && c.ts >= start && c.ts < start + 86400_000).length;
    }),
  }));

  const hourLabels = Array.from({ length: 24 }, (_, h) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`));
  const hourly = scope.map((b) => ({
    key: b,
    label: BRANDS[b].short,
    color: BRANDS[b].color,
    values: Array.from({ length: 24 }, (_, h) => inRange.filter((c) => c.brand === b && phxHour(c.ts) === h).length),
  }));

  const recent = calls.slice(0, 7);
  const title = role === "owner" ? "All three companies" : BRANDS[role].name;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{role === "owner" ? "Owner dashboard" : "Dashboard"}</h1>
          <p>{title}: every call and text the AI handled in the last {days} days.</p>
        </div>
        <div className="seg" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.days} aria-pressed={days === r.days} onClick={() => setDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card">
          <div className="stat-label">Calls and texts answered</div>
          <div className="stat-value">{tot.calls.toLocaleString()}</div>
          <div className="stat-sub"><span className="delta-good">100%</span> answered, none sent to voicemail</div>
        </div>
        <div className="card">
          <div className="stat-label">Caught after hours</div>
          <div className="stat-value">{tot.after.toLocaleString()}</div>
          <div className="stat-sub">{tot.calls ? Math.round((tot.after / tot.calls) * 100) : 0}% came in after 4pm or on weekends</div>
        </div>
        <div className="card">
          <div className="stat-label">Jobs booked</div>
          <div className="stat-value">{tot.booked.toLocaleString()}</div>
          <div className="stat-sub">{moneyFull(tot.revenue)} booked · {money(tot.pipeline)} more quoted</div>
        </div>
        <div className="card">
          <div className="stat-label">Average response time</div>
          <div className="stat-value">{avgResp.toFixed(1)} sec</div>
          <div className="stat-sub">Before: voicemail, callback next morning</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>By company</h2>
          <p>{moneyFull(afterRevenue)} of the booked work came in while the office was closed</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th className="r">Calls caught</th>
                <th className="r">After hours</th>
                <th className="r">Jobs booked</th>
                <th className="r">Revenue booked</th>
                <th className="r">Quoted</th>
                <th className="r">Avg response</th>
                <th className="r">Referrals in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.b}>
                  <td><BrandChip id={r.b} long /></td>
                  <td className="r">{r.calls}</td>
                  <td className="r">{r.after}</td>
                  <td className="r">{r.booked}</td>
                  <td className="r">{moneyFull(r.revenue)}</td>
                  <td className="r">{moneyFull(r.pipeline)}</td>
                  <td className="r">{r.resp.toFixed(1)} sec</td>
                  <td className="r">{r.refIn}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 1 && (
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="r">{tot.calls}</td>
                  <td className="r">{tot.after}</td>
                  <td className="r">{tot.booked}</td>
                  <td className="r">{moneyFull(tot.revenue)}</td>
                  <td className="r">{moneyFull(tot.pipeline)}</td>
                  <td className="r">{avgResp.toFixed(1)} sec</td>
                  <td className="r">{tot.refIn}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Calls and texts per day</h2>
            <Legend series={daily} />
          </div>
          <LineChart series={daily} labels={dayLabels} />
        </div>
        <div className="card">
          <div className="card-head">
            <h2>When customers reach out</h2>
            <Legend series={hourly} />
          </div>
          <StackedBars series={hourly} labels={hourLabels} shade={[[0, 7], [16, 24]]} shadeLabel="Office closed" tickEvery={3} />
        </div>
      </div>

      <div className="grid grid-3-1">
        <div className="card">
          <div className="card-head">
            <h2>Latest activity</h2>
            <Link href="/calls" className="btn btn-sm">All calls</Link>
          </div>
          <ul className="feed">
            {recent.map((c) => (
              <li key={c.id} className={c.isNew ? "new-flash" : undefined}>
                <BrandChip id={c.brand} />
                <div>
                  <div style={{ fontWeight: 550 }}>
                    {c.intent}
                    {c.company ? ` · ${c.company}` : ""}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {CHANNEL_LABEL[c.channel]} from {c.caller} · answered in {c.responseSec} sec{c.afterHours ? " · after hours" : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <OutcomeBadge outcome={c.outcome} />
                  <div className="t" style={{ marginTop: 4 }}>{fmtWhen(c.ts, anchor)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="card-head">
            <h2>Partner referrals</h2>
            <Link href="/cross-sell" className="btn btn-sm">Open</Link>
          </div>
          <ul className="feed">
            {referrals.slice(0, 5).map((r) => (
              <li key={r.id} style={{ gridTemplateColumns: "1fr auto" }} className={r.isNew ? "new-flash" : undefined}>
                <div>
                  <div className="row" style={{ gap: 6, fontSize: 12 }}>
                    <BrandChip id={r.from} /> <span className="muted">→</span> <BrandChip id={r.to} />
                  </div>
                  <div style={{ marginTop: 3 }}>{r.finding}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{r.site}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="num" style={{ fontWeight: 600 }}>{moneyFull(r.value)}</div>
                  <div className="t">{r.status}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
