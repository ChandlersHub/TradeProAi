"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/components/DemoProvider";
import { BrandChip, moneyFull } from "@/components/ui";
import { BRANDS, type BrandId } from "@/lib/brands";

interface Note {
  tech: string;
  customer: string;
  address: string;
  job: string;
  voice: string;
  summary: string;
  findings: string[];
  lines: { item: string; qty: number; rate: number }[];
  recommend: string;
  plan: { name: string; price: string; pitch: string };
}

const NOTES: Record<BrandId, Note> = {
  platinum: {
    tech: "Sam D.",
    customer: "Casa Rosa Cantina",
    address: "3010 W Van Buren St",
    job: "J-4215 · Walk-in cooler at 52°F",
    voice:
      "Okay, Casa Rosa walk-in. Box was at 52 when I got here. Condenser fan motor was seized, replaced it with a universal 1/5 horse, part number 5KCP39. Cleaned the condenser coil, it was packed with grease. Checked charge, it's good. Box pulling down, at 38 now. About two hours on site. Door gasket is torn on the bottom, they should replace it soon.",
    summary: "Walk-in cooler was at 52°F on arrival. Seized condenser fan motor replaced and greasy condenser coil cleaned. Refrigerant charge checked and normal. Box pulled down to 38°F before leaving.",
    findings: ["Condenser fan motor seized", "Condenser coil heavily loaded with grease", "Bottom door gasket torn"],
    lines: [
      { item: "Emergency service call", qty: 1, rate: 189 },
      { item: "Labor, refrigeration tech (hours)", qty: 2, rate: 135 },
      { item: "Condenser fan motor, 1/5 HP universal (5KCP39)", qty: 1, rate: 214 },
      { item: "Condenser coil cleaning", qty: 1, rate: 95 },
    ],
    recommend: "Replace the bottom door gasket within 2 weeks to stop warm air leaks and icing. Quote: $285 installed.",
    plan: { name: "Kitchen Cold-Chain Plan", price: "$129/mo", pitch: "Quarterly coil cleaning and checks on all walk-ins, priority emergency response and 15% off repairs." },
  },
  allfaze: {
    tech: "Tony V.",
    customer: "Rachel Kim",
    address: "Laveen, 85339",
    job: "J-3107 · EV charger install, 60A",
    voice:
      "Kim residence, EV charger. Installed a 60 amp two-pole breaker in the main panel, ran 6 gauge THHN in conduit about 18 feet to the garage wall. Mounted and torqued the customer's charger, set it to 48 amps. Tested, truck's charging at 11 kilowatts. Permit sticker is on the panel, inspection's Thursday. Four hours.",
    summary: "Installed a dedicated 60A circuit for the customer-supplied Level 2 charger, 18 ft conduit run to the garage. Charger set to 48A and tested at 11 kW. Permit posted; city inspection Thursday.",
    findings: ["Panel has 2 open slots after install", "Garage has no GFCI on the front receptacles"],
    lines: [
      { item: "EV charger install, 60A circuit (up to 25 ft)", qty: 1, rate: 1650 },
      { item: "Extra conduit and 6 AWG wire (ft)", qty: 0, rate: 9 },
      { item: "City permit and inspection", qty: 1, rate: 185 },
      { item: "Charger mounting and commissioning", qty: 1, rate: 145 },
    ],
    recommend: "Add GFCI protection to the garage receptacles (code update). Quote: $165.",
    plan: { name: "Home Electrical Care", price: "$19/mo", pitch: "Annual safety inspection, priority scheduling and 10% off any repair." },
  },
  ljs: {
    tech: "Maria R.",
    customer: "Sonoran Title Co.",
    address: "2390 E Camelback Rd",
    job: "J-2043 · Nightly office clean",
    voice:
      "Sonoran Title, nightly. All 14 offices done, trash and recycling out, restrooms restocked. Did the extra on the break room fridge they asked for. Carpet in the front lobby has a big coffee stain by reception, needs extraction. Also the walk-off mat at the entrance is worn out. Crew of two, three hours.",
    summary: "Nightly service completed for all 14 offices: trash and recycling removed, restrooms cleaned and restocked. Added a break room refrigerator clean-out at the client's request.",
    findings: ["Coffee stain on lobby carpet near reception", "Entrance walk-off mat worn through"],
    lines: [
      { item: "Nightly janitorial service (contract rate)", qty: 1, rate: 380 },
      { item: "Add-on: break room refrigerator clean-out", qty: 1, rate: 45 },
    ],
    recommend: "Hot-water extraction for the lobby carpet ($180) and a replacement walk-off mat ($95).",
    plan: { name: "Quarterly Deep Clean", price: "$420/qtr", pitch: "Carpet extraction, high dusting and floor machine scrub every quarter, on top of nightly service." },
  },
};

const STAGES = ["Voice note", "Transcribed", "Report written", "Invoice ready", "Sent"];

export default function FieldPage() {
  const { scope } = useDemo();
  const [brand, setBrand] = useState<BrandId>(scope.includes("platinum") ? "platinum" : scope[0]);
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState(0);
  const note = NOTES[brand];
  const b = BRANDS[brand];

  useEffect(() => {
    if (stage !== 1) return;
    if (typed >= note.voice.length) {
      const t = setTimeout(() => setStage(2), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTyped((n) => Math.min(note.voice.length, n + 6)), 18);
    return () => clearTimeout(t);
  }, [stage, typed, note.voice.length]);

  useEffect(() => {
    if (stage === 2 || stage === 3) {
      const t = setTimeout(() => setStage((s) => s + 1), 900);
      return () => clearTimeout(t);
    }
  }, [stage]);

  function choose(id: BrandId) {
    setBrand(id);
    setStage(0);
    setTyped(0);
  }

  const lines = note.lines.filter((l) => l.qty > 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const total = subtotal;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Field copilot</h1>
          <p>The tech talks for 30 seconds on the way to the truck. The report, invoice and follow-ups write themselves.</p>
        </div>
        {scope.length > 1 && (
          <div className="seg" role="group" aria-label="Company">
            {scope.map((id) => (
              <button key={id} aria-pressed={brand === id} onClick={() => choose(id)}>{BRANDS[id].short}</button>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="row wrap" style={{ justifyContent: "space-between", gap: 12 }}>
          <div>
            <BrandChip id={brand} long />
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{note.job} · {note.customer} · {note.tech}</div>
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {STAGES.map((s, i) => (
              <span key={s} className={`badge ${i < stage ? "badge-good" : i === stage ? "badge-accent" : "badge-neutral"}`}>
                <span aria-hidden>{i < stage ? "✓" : i + 1}</span>{s}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {stage === 0 ? (
            <button className="btn btn-primary" style={{ height: 44 }} onClick={() => setStage(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5.3-3a5.3 5.3 0 01-10.6 0H5a7 7 0 006 6.9V21h2v-3.1a7 7 0 006-6.9h-1.7z" /></svg>
              Play {note.tech.split(" ")[0]}&apos;s voice note
            </button>
          ) : (
            <div className="bubble bubble-caller" style={{ maxWidth: "100%", alignSelf: "stretch" }}>
              <div className="bubble-who">Voice note from {note.tech} · 0:34</div>
              {note.voice.slice(0, stage === 1 ? typed : note.voice.length)}
              {stage === 1 && <span className="typing" style={{ marginLeft: 6 }}><i /><i /><i /></span>}
            </div>
          )}
        </div>
      </div>

      {stage >= 2 && (
        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div className="card new-flash">
            <div className="card-head"><h2>Job report</h2><p>Written by AI, approved by {note.tech.split(" ")[0]}</p></div>
            <div className="stack" style={{ gap: 12 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>Work performed</h3>
                <p className="secondary">{note.summary}</p>
              </div>
              <div>
                <h3 style={{ marginBottom: 4 }}>Findings</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }} className="secondary">
                  {note.findings.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{ marginBottom: 4 }}>Recommended next</h3>
                <p className="secondary">{note.recommend}</p>
              </div>
            </div>
          </div>

          {stage >= 3 && (
            <div className="card new-flash">
              <div className="card-head">
                <h2>Invoice</h2>
                <p>{b.name} · {note.customer}</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr></thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.item}><td>{l.item}</td><td className="r">{l.qty}</td><td className="r">{moneyFull(l.rate)}</td><td className="r">{moneyFull(l.qty * l.rate)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td colSpan={3}>Total due</td><td className="r">{moneyFull(total)}</td></tr></tfoot>
                </table>
              </div>
              <div className="row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
                {stage === 3 ? (
                  <span className="muted" style={{ fontSize: 12 }}>Pricing from the {b.short} price book…</span>
                ) : stage === 4 ? (
                  <button className="btn btn-primary" onClick={() => setStage(5)}>Send invoice and follow-ups</button>
                ) : (
                  <span className="badge badge-good"><span aria-hidden>✓</span>Sent to customer</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {stage >= 5 && (
        <div className="card new-flash">
          <div className="card-head"><h2>What the customer gets</h2><p>Sent automatically after the invoice</p></div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Right away</div>
              <div className="sms">
                {b.short}: thanks for choosing us today. Your invoice for {moneyFull(total)} is here: pay.trade-pro.ai/{brand}/{note.job.split(" ")[0]}. How did {note.tech.split(" ")[0]} do? A quick Google review helps a local business a lot: g.page/r/{brand}-review
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Two days later</div>
              <div className="sms">
                {b.short}: want to avoid the next surprise? Our {note.plan.name} is {note.plan.price}: {note.plan.pitch} Reply YES to sign up.
              </div>
            </div>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn btn-sm" onClick={() => { setStage(0); setTyped(0); }}>Run it again</button>
          </div>
        </div>
      )}
    </div>
  );
}
