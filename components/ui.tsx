import { BRANDS, type BrandId } from "@/lib/brands";
import { PHX_OFFSET_MS, type Outcome } from "@/lib/data";

export function BrandChip({ id, long = false }: { id: BrandId; long?: boolean }) {
  const b = BRANDS[id];
  return (
    <span className="brand-chip">
      <span className="brand-dot" style={{ background: b.color }} aria-hidden />
      {long ? b.name : b.short}
    </span>
  );
}

const OUTCOME: Record<Outcome, { label: string; cls: string; icon: string }> = {
  booked: { label: "Booked", cls: "badge-good", icon: "✓" },
  emergency: { label: "Emergency dispatched", cls: "badge-critical", icon: "!" },
  quoted: { label: "Quoted", cls: "badge-accent", icon: "$" },
  info: { label: "Answered", cls: "badge-neutral", icon: "i" },
  referral: { label: "Referred", cls: "badge-warn", icon: "↔" },
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const o = OUTCOME[outcome];
  return (
    <span className={`badge ${o.cls}`}>
      <span aria-hidden>{o.icon}</span>
      {o.label}
    </span>
  );
}

export const money = (n: number) =>
  n >= 10000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `$${n.toLocaleString("en-US")}`;
export const moneyFull = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function phx(ms: number) {
  return new Date(ms + PHX_OFFSET_MS);
}

export function fmtTime(ms: number) {
  const d = phx(ms);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")}${ap}`;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(ms: number) {
  const d = phx(ms);
  return `${DOW[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtShortDate(ms: number) {
  const d = phx(ms);
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtWhen(ms: number, now: number) {
  const diff = now - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} min ago`;
  const sameDay = fmtDay(ms) === fmtDay(now);
  if (sameDay) return `Today ${fmtTime(ms)}`;
  if (fmtDay(ms + 86400_000) === fmtDay(now)) return `Yesterday ${fmtTime(ms)}`;
  return `${fmtDay(ms)} ${fmtTime(ms)}`;
}

export const CHANNEL_LABEL = { voice: "Phone call", sms: "Text", chat: "Web chat" } as const;
