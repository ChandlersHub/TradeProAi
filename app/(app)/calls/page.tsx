"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDemo } from "@/components/DemoProvider";
import { BrandChip, CHANNEL_LABEL, OutcomeBadge, fmtTime, fmtWhen, moneyFull } from "@/components/ui";
import { BRANDS, type BrandId } from "@/lib/brands";
import { SAMPLE_TRANSCRIPTS, isAfterHours, type CallRecord } from "@/lib/data";

type Live = { brand: BrandId; shown: number; done: boolean; callId: string; jobId: string; start: number };

const SCENARIO_LABEL: Record<BrandId, string> = {
  platinum: "Restaurant walk-in reading 50°F at 8pm",
  ljs: "Dental office wants nightly cleaning",
  allfaze: "Homeowner needs an EV charger",
};

export default function CallsPage() {
  const { calls, scope, anchor, addCall, addJob } = useDemo();
  const [filter, setFilter] = useState<"all" | BrandId>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const list = useMemo(() => calls.filter((c) => filter === "all" || c.brand === filter).slice(0, 60), [calls, filter]);
  const current = selected ? calls.find((c) => c.id === selected) : null;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!live || live.done) return;
    const script = SAMPLE_TRANSCRIPTS[live.brand];
    if (live.shown >= script.lines.length) {
      finish(live);
      return;
    }
    const next = script.lines[live.shown];
    const delay = live.shown === 0 ? 700 : Math.min(2600, 700 + next.text.length * 14);
    timer.current = setTimeout(() => setLive((l) => (l ? { ...l, shown: l.shown + 1 } : l)), delay);
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  function start(brand: BrandId) {
    if (timer.current) clearTimeout(timer.current);
    setSelected(null);
    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    setLive({ brand, shown: 0, done: false, callId: `L${stamp}`, jobId: `J-${stamp}`, start: Date.now() });
  }

  function finish(l: Live) {
    const s = SAMPLE_TRANSCRIPTS[l.brand];
    const now = Date.now();
    const call: CallRecord = {
      id: l.callId,
      brand: l.brand,
      ts: now,
      channel: "voice",
      caller: s.caller,
      company: s.company || undefined,
      intent: s.intent,
      outcome: s.outcome,
      value: s.value,
      responseSec: 1,
      afterHours: true,
      transcript: s.lines,
      isNew: true,
    };
    addCall(call);
    const startAt = s.outcome === "emergency" ? now + 40 * 60_000 : nextSlot(now, l.brand === "allfaze" ? 8 : 9);
    addJob({ ...s.job, id: l.jobId, start: startAt, status: s.outcome === "emergency" ? "en route" : "scheduled", isNew: true });
    setLive({ ...l, done: true, shown: s.lines.length });
  }

  const liveScript = live ? SAMPLE_TRANSCRIPTS[live.brand] : null;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Calls and texts</h1>
          <p>The AI answers every line 24/7 in each company&apos;s name, then books the job or dispatches on-call.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Try it: simulate an after-hours call</h2>
          <p>Plays a real call flow. The job lands on the dispatch board when it ends.</p>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          {scope.map((b) => (
            <button key={b} className="btn" onClick={() => start(b)} disabled={!!live && !live.done}>
              <BrandChip id={b} />
              <span className="muted" style={{ fontWeight: 500 }}>{SCENARIO_LABEL[b]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 1.6fr)", alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }} className="row wrap">
            {scope.length > 1 && (
              <div className="seg" role="group" aria-label="Filter by company">
                <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
                {scope.map((b) => (
                  <button key={b} aria-pressed={filter === b} onClick={() => setFilter(b)}>{BRANDS[b].short}</button>
                ))}
              </div>
            )}
            <span className="muted" style={{ fontSize: 12, marginLeft: "auto" }}>Latest 60</span>
          </div>
          <div style={{ maxHeight: 620, overflowY: "auto" }}>
            {list.map((c) => (
              <button
                key={c.id}
                className={`list-item${c.isNew ? " new-flash" : ""}`}
                aria-selected={selected === c.id && !(live && !live.done)}
                onClick={() => { setSelected(c.id); setLive(null); }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <BrandChip id={c.brand} />
                  <span className="muted" style={{ fontSize: 12 }}>{fmtWhen(c.ts, Math.max(anchor, Date.now()))}</span>
                </div>
                <div style={{ fontWeight: 550, marginTop: 3 }}>{c.intent}</div>
                <div className="row" style={{ justifyContent: "space-between", marginTop: 3 }}>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {CHANNEL_LABEL[c.channel]} · {c.company ?? c.caller}
                    {c.afterHours ? " · after hours" : ""}
                  </span>
                  <OutcomeBadge outcome={c.outcome} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ minHeight: 420 }}>
          {live && liveScript ? (
            <LiveCall live={live} script={liveScript} bottomRef={bottom} />
          ) : current ? (
            <CallDetail c={current} />
          ) : (
            <div className="muted" style={{ display: "grid", placeItems: "center", minHeight: 380, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 600 }}>Pick a call, or run a simulation above</div>
                <div style={{ marginTop: 4 }}>Each call shows the AI&apos;s conversation and what it did next.</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 860px){ .stack > .grid[style] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function nextSlot(now: number, hour: number) {
  // Next business morning at `hour` Phoenix time.
  const PHX = 7 * 3600_000;
  const d = new Date(now - PHX + 86400_000);
  d.setUTCHours(hour, 0, 0, 0);
  while (isAfterHours(d.getTime() + PHX)) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime() + PHX;
}

function LiveCall({
  live,
  script,
  bottomRef,
}: {
  live: Live;
  script: (typeof SAMPLE_TRANSCRIPTS)[BrandId];
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const b = BRANDS[live.brand];
  const lines = script.lines.slice(0, live.shown);
  const typing = !live.done && live.shown < script.lines.length ? script.lines[live.shown] : null;
  const emergency = script.outcome === "emergency";
  const onCall = b.techs.find((t) => t.name === script.job.tech) ?? b.techs[0];

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span className={`badge ${live.done ? "badge-good" : "badge-critical"}`}>
              <span aria-hidden>{live.done ? "✓" : "●"}</span>
              {live.done ? "Call ended" : "Live call"}
            </span>
            <BrandChip id={live.brand} long />
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Incoming to {b.phone} · {script.caller}
            {script.company ? `, ${script.company}` : ""} · answered on the first ring
          </div>
        </div>
        <span className="muted num" style={{ fontSize: 12 }}>{fmtTime(live.start)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((l, i) => (
          <div key={i} className={`bubble ${l.who === "ai" ? "bubble-ai" : "bubble-caller"}`}>
            <div className="bubble-who">{l.who === "ai" ? `AI · ${b.aiName}` : script.caller}</div>
            {l.text}
          </div>
        ))}
        {typing && (
          <div className={`bubble ${typing.who === "ai" ? "bubble-ai" : "bubble-caller"}`}>
            <span className="typing" aria-label="Speaking"><i /><i /><i /></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {live.done && (
        <div className="stack" style={{ gap: 10, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <h3>What the AI did next</h3>
          <div className="grid grid-2" style={{ gap: 10 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Text to {onCall.name} ({onCall.role})</div>
              <div className="sms">
                {emergency ? "🚨 " : "New job: "}
                {script.job.title} at {script.job.customer}, {script.job.address}. Contact {script.caller}.{" "}
                {emergency ? "Customer told ETA 40 min. Tap to accept." : "Added to your schedule."}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Text to {script.caller}</div>
              <div className="sms">
                {b.short}: you&apos;re confirmed. {onCall.name.split(" ")[0]} {emergency ? "is on the way, ETA about 40 min" : "will see you at the booked time"}. Reply here with any questions.
              </div>
            </div>
          </div>
          <div className="row wrap">
            <OutcomeBadge outcome={script.outcome} />
            <span className="badge badge-neutral">Est. value {moneyFull(script.value)}</span>
            <Link className="btn btn-sm btn-primary" href="/dispatch" style={{ marginLeft: "auto" }}>See it on the dispatch board →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CallDetail({ c }: { c: CallRecord }) {
  const b = BRANDS[c.brand];
  const lines =
    c.transcript ??
    [
      { who: "ai" as const, text: `Thanks for contacting ${b.name}. ${c.afterHours ? "Our office is closed, but I can help right now." : "How can I help?"}` },
      { who: "caller" as const, text: `${c.intent}${c.company ? ` for ${c.company}` : ""}.` },
      {
        who: "ai" as const,
        text:
          c.outcome === "emergency"
            ? "I've flagged this as an emergency and paged our on-call tech. You'll get a text with their ETA."
            : c.outcome === "booked"
              ? "You're booked. I'll text you a confirmation with the time and your tech's name."
              : c.outcome === "quoted"
                ? `Based on what you described, the estimate is about ${moneyFull(c.value)}. I've emailed it over and can book a visit when you're ready.`
                : "Happy to help. I've texted you the details.",
      },
    ];
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <div>
          <BrandChip id={c.brand} long />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {CHANNEL_LABEL[c.channel]} from {c.caller}
            {c.company ? `, ${c.company}` : ""} · answered in {c.responseSec} sec
          </div>
        </div>
        <OutcomeBadge outcome={c.outcome} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((l, i) => (
          <div key={i} className={`bubble ${l.who === "ai" ? "bubble-ai" : "bubble-caller"}`}>
            <div className="bubble-who">{l.who === "ai" ? `AI · ${b.aiName}` : c.caller}</div>
            {l.text}
          </div>
        ))}
      </div>
      <div className="row wrap" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        {c.afterHours && <span className="badge badge-warn"><span aria-hidden>☾</span>After hours</span>}
        {c.value > 0 && <span className="badge badge-neutral">Value {moneyFull(c.value)}</span>}
        {!c.transcript && <span className="muted" style={{ fontSize: 12 }}>Summary of the conversation</span>}
      </div>
    </div>
  );
}
