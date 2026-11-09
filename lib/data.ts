// Deterministic sample data for the demo. Everything here is made up.
import { BRANDS, BRAND_IDS, type BrandId } from "./brands";

export type Channel = "voice" | "sms" | "chat";
export type Outcome = "booked" | "emergency" | "quoted" | "info" | "referral";

export interface CallRecord {
  id: string;
  brand: BrandId;
  ts: number; // ms epoch
  channel: Channel;
  caller: string;
  company?: string;
  intent: string;
  outcome: Outcome;
  value: number; // booked or quoted value, $
  responseSec: number;
  afterHours: boolean;
  transcript?: { who: "ai" | "caller"; text: string }[];
  isNew?: boolean;
}

export type JobStatus = "scheduled" | "en route" | "on site" | "done";

export interface Job {
  id: string;
  brand: BrandId;
  title: string;
  customer: string;
  address: string;
  start: number; // ms epoch
  durationHrs: number;
  tech: string;
  status: JobStatus;
  value: number;
  emergency?: boolean;
  source: "AI call" | "AI text" | "Web chat" | "Cross-sell" | "Recurring plan";
  isNew?: boolean;
}

export interface Referral {
  id: string;
  from: BrandId;
  to: BrandId;
  ts: number;
  spottedBy: string;
  site: string;
  finding: string;
  status: "New ticket" | "Customer texted" | "Booked" | "Won";
  value: number;
  isNew?: boolean;
}

// Small seeded PRNG so server and browser render the same numbers.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

// Phoenix is UTC-7 all year (no DST).
export const PHX_OFFSET_MS = -7 * HOUR;

/** Midnight in Phoenix for the given date, as a UTC epoch. */
export function phxMidnight(ms: number): number {
  const local = ms + PHX_OFFSET_MS;
  return local - (((local % DAY) + DAY) % DAY) - PHX_OFFSET_MS;
}

export function phxHour(ms: number): number {
  return new Date(ms + PHX_OFFSET_MS).getUTCHours();
}

const FIRST = ["Dana", "Luis", "Priya", "Marcus", "Elena", "Tom", "Keisha", "Jorge", "Amy", "Rick", "Sofia", "Brandon", "Nina", "Omar", "Carla", "Derek", "Yvette", "Sean"];
const LAST = ["Alvarez", "Brooks", "Chen", "Duarte", "Ellis", "Fuentes", "Garcia", "Hughes", "Ibarra", "Jensen", "Kim", "Lopez", "Morales", "Nguyen", "Ortiz", "Patel"];

interface Intent {
  intent: string;
  outcome: Outcome;
  min: number;
  max: number;
  weight: number;
  company: string[];
}

const INTENTS: Record<BrandId, Intent[]> = {
  ljs: [
    { intent: "Office janitorial walkthrough", outcome: "booked", min: 900, max: 2600, weight: 3, company: ["Desert Ridge Dental", "Sonoran Title Co.", "Camelback Law Group", "Westgate Medical Suites"] },
    { intent: "Warehouse deep clean quote", outcome: "quoted", min: 3800, max: 9500, weight: 3, company: ["Buckeye Logistics", "I-10 Cold Storage", "Copper State Distributors"] },
    { intent: "Post-construction cleanup", outcome: "booked", min: 900, max: 3200, weight: 2, company: ["Pinnacle Builders", "Red Mesa Construction"] },
    { intent: "Fleet detailing estimate", outcome: "quoted", min: 900, max: 2600, weight: 2, company: ["Valley Shuttle", "Metro Charter Lines"] },
    { intent: "Supply order question", outcome: "info", min: 0, max: 0, weight: 2, company: [""] },
    { intent: "Existing client: schedule change", outcome: "info", min: 0, max: 0, weight: 4, company: ["Sonoran Title Co.", "Westgate Medical Suites", "Buckeye Logistics"] },
  ],
  allfaze: [
    { intent: "EV charger install", outcome: "quoted", min: 1600, max: 3200, weight: 4, company: [""] },
    { intent: "Panel upgrade", outcome: "booked", min: 2200, max: 4200, weight: 2, company: [""] },
    { intent: "Power out, part of building", outcome: "emergency", min: 450, max: 1400, weight: 2, company: ["Laveen Plaza", "Maryvale Auto Care"] },
    { intent: "Parking lot lighting repair", outcome: "booked", min: 600, max: 2400, weight: 2, company: ["59th Ave Business Park", "Estrella Storage"] },
    { intent: "Generator question", outcome: "info", min: 0, max: 0, weight: 2, company: [""] },
    { intent: "Job status or invoice question", outcome: "info", min: 0, max: 0, weight: 4, company: [""] },
  ],
  platinum: [
    { intent: "Walk-in cooler warm", outcome: "emergency", min: 450, max: 1800, weight: 4, company: ["Casa Rosa Cantina", "Southside Smokehouse", "Mesa Verde Grill", "La Plaza Market"] },
    { intent: "Freezer not holding temp", outcome: "emergency", min: 600, max: 2200, weight: 2, company: ["Golden Wok", "Fresh Fields Grocery"] },
    { intent: "AC not cooling", outcome: "booked", min: 250, max: 1200, weight: 3, company: [""] },
    { intent: "Ice machine service", outcome: "booked", min: 250, max: 900, weight: 2, company: ["Desert Brew Co.", "Sunrise Diner"] },
    { intent: "Preventive maintenance plan", outcome: "quoted", min: 1800, max: 4800, weight: 2, company: ["Barrio Bistro Group", "Valley Food Hall"] },
    { intent: "Tech ETA or invoice question", outcome: "info", min: 0, max: 0, weight: 5, company: [""] },
  ],
};

const PER_DAY: Record<BrandId, [number, number]> = {
  ljs: [4, 8],
  allfaze: [3, 7],
  platinum: [5, 10],
};

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weighted(rng: () => number, items: Intent[]): Intent {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const i of items) {
    if ((r -= i.weight) <= 0) return i;
  }
  return items[items.length - 1];
}

// Hour-of-day weights (Phoenix time). Office closes at 4pm, so 16:00+ is after hours.
const HOUR_W = [0.15, 0.1, 0.08, 0.06, 0.1, 0.25, 0.7, 1.4, 1.7, 1.6, 1.5, 1.4, 1.3, 1.3, 1.4, 1.4, 1.1, 0.9, 0.75, 0.6, 0.5, 0.4, 0.3, 0.2];

function randomHour(rng: () => number, weekend: boolean): number {
  const w = HOUR_W.map((x, h) => (weekend && h >= 7 && h < 16 ? x * 0.8 : x));
  const total = w.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let h = 0; h < 24; h++) if ((r -= w[h]) <= 0) return h;
  return 12;
}

export function isAfterHours(ms: number): boolean {
  const d = new Date(ms + PHX_OFFSET_MS);
  const day = d.getUTCDay();
  const h = d.getUTCHours();
  return day === 0 || day === 6 || h < 7 || h >= 16;
}

export function generateCalls(anchorMs: number, days = 30): CallRecord[] {
  const rng = mulberry32(20261109);
  const today = phxMidnight(anchorMs);
  const out: CallRecord[] = [];
  let n = 1;
  for (let d = days - 1; d >= 0; d--) {
    const dayStart = today - d * DAY;
    const dow = new Date(dayStart + PHX_OFFSET_MS + 12 * HOUR).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    for (const b of BRAND_IDS) {
      const [lo, hi] = PER_DAY[b];
      const count = Math.round(lo + rng() * (hi - lo)) - (weekend ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const h = randomHour(rng, weekend);
        const ts = dayStart + h * HOUR + Math.floor(rng() * 60) * 60_000;
        if (ts > anchorMs) continue;
        const it = weighted(rng, INTENTS[b]);
        const channel: Channel = rng() < 0.62 ? "voice" : rng() < 0.7 ? "sms" : "chat";
        const value = it.max ? Math.round((it.min + rng() * (it.max - it.min)) / 10) * 10 : 0;
        // Most quotes get booked as a walkthrough; info calls never carry value.
        out.push({
          id: `C${String(n++).padStart(4, "0")}`,
          brand: b,
          ts,
          channel,
          caller: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
          company: pick(rng, it.company) || undefined,
          intent: it.intent,
          outcome: it.outcome,
          value,
          responseSec: channel === "voice" ? 1 + Math.round(rng() * 2) : 3 + Math.round(rng() * 9),
          afterHours: isAfterHours(ts),
        });
      }
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}

export function generateJobs(anchorMs: number): Job[] {
  const today = phxMidnight(anchorMs);
  const at = (dayOffset: number, h: number, m = 0) => today + dayOffset * DAY + h * HOUR + m * 60_000;
  const status = (start: number, hrs: number): JobStatus =>
    anchorMs > start + hrs * HOUR ? "done" : anchorMs > start ? "on site" : anchorMs > start - HOUR ? "en route" : "scheduled";
  const raw: Omit<Job, "status">[] = [
    { id: "J-2041", brand: "ljs", title: "Janitorial walkthrough", customer: "Desert Ridge Dental", address: "4120 N 44th St", start: at(0, 9), durationHrs: 1, tech: "Lupe G.", value: 3600, source: "AI call" },
    { id: "J-2042", brand: "ljs", title: "Warehouse floor scrub", customer: "Buckeye Logistics", address: "5800 W Buckeye Rd", start: at(0, 18), durationHrs: 5, tech: "Andre T.", value: 4200, source: "AI text" },
    { id: "J-2043", brand: "ljs", title: "Nightly office clean", customer: "Sonoran Title Co.", address: "2390 E Camelback Rd", start: at(0, 19), durationHrs: 3, tech: "Maria R.", value: 380, source: "Recurring plan" },
    { id: "J-2044", brand: "ljs", title: "Bus interior detail (6)", customer: "Valley Shuttle", address: "1702 S 52nd St", start: at(1, 7), durationHrs: 4, tech: "Kevin S.", value: 1450, source: "Web chat" },
    { id: "J-3107", brand: "allfaze", title: "EV charger install, 60A", customer: "Rachel Kim", address: "Laveen, 85339", start: at(0, 8), durationHrs: 4, tech: "Tony V.", value: 2350, source: "AI call" },
    { id: "J-3108", brand: "allfaze", title: "200A panel upgrade", customer: "Omar Patel", address: "Maryvale, 85033", start: at(0, 12, 30), durationHrs: 5, tech: "Chris L.", value: 3900, source: "AI call" },
    { id: "J-3109", brand: "allfaze", title: "Lot lights out (8 poles)", customer: "59th Ave Business Park", address: "1550 S 59th Ave", start: at(1, 9), durationHrs: 3, tech: "Ray M.", value: 2800, source: "Cross-sell" },
    { id: "J-4215", brand: "platinum", title: "Walk-in cooler at 52°F", customer: "Casa Rosa Cantina", address: "3010 W Van Buren St", start: at(0, 7, 30), durationHrs: 2, tech: "Sam D.", value: 768, emergency: true, source: "AI call" },
    { id: "J-4216", brand: "platinum", title: "Ice machine descale", customer: "Desert Brew Co.", address: "720 N 7th St", start: at(0, 11), durationHrs: 1.5, tech: "Jess K.", value: 420, source: "AI text" },
    { id: "J-4217", brand: "platinum", title: "Rooftop unit not cooling", customer: "La Plaza Market", address: "6700 W Indian School Rd", start: at(0, 14), durationHrs: 3, tech: "Hector P.", value: 1300, source: "AI call" },
    { id: "J-4218", brand: "platinum", title: "Quarterly PM, 3 walk-ins", customer: "Barrio Bistro Group", address: "Downtown Phoenix", start: at(1, 8), durationHrs: 4, tech: "Jess K.", value: 960, source: "Recurring plan" },
  ];
  return raw.map((j) => ({ ...j, status: status(j.start, j.durationHrs) }));
}

export function generateReferrals(anchorMs: number): Referral[] {
  const d = (days: number, h: number) => phxMidnight(anchorMs) - days * DAY + h * HOUR;
  return [
    { id: "R-118", from: "ljs", to: "allfaze", ts: d(1, 22), spottedBy: "Maria R. (LJ's night crew)", site: "59th Ave Business Park", finding: "8 parking lot poles dark on the east side", status: "Booked", value: 2800 },
    { id: "R-117", from: "ljs", to: "platinum", ts: d(3, 21), spottedBy: "Andre T. (LJ's warehouse crew)", site: "I-10 Cold Storage", finding: "Ice buildup on freezer evaporator, door gasket torn", status: "Won", value: 3400 },
    { id: "R-116", from: "platinum", to: "ljs", ts: d(5, 15), spottedBy: "Sam D. (Platinum)", site: "Southside Smokehouse", finding: "Kitchen hood and floors need a deep clean before inspection", status: "Customer texted", value: 1900 },
    { id: "R-115", from: "allfaze", to: "platinum", ts: d(8, 11), spottedBy: "Tony V. (All Faze)", site: "Fresh Fields Grocery", finding: "Compressor short-cycling on reach-in cases", status: "Won", value: 2250 },
    { id: "R-114", from: "ljs", to: "allfaze", ts: d(12, 20), spottedBy: "Lupe G. (LJ's day porter)", site: "Westgate Medical Suites", finding: "Flickering ballasts in 2nd floor hallway", status: "Won", value: 1150 },
  ];
}

export const SAMPLE_TRANSCRIPTS: Record<BrandId, { caller: string; company: string; intent: string; outcome: Outcome; value: number; lines: { who: "ai" | "caller"; text: string }[]; job: Omit<Job, "id" | "start" | "status" | "isNew"> }> = {
  platinum: {
    caller: "Marco Ruiz",
    company: "Mesa Verde Grill",
    intent: "Walk-in cooler warm",
    outcome: "emergency",
    value: 1650,
    lines: [
      { who: "ai", text: "Thanks for calling Platinum Refrigeration, this is the after-hours service line. What's going on tonight?" },
      { who: "caller", text: "Our walk-in cooler is reading 50 degrees and we close in two hours. I've got about four thousand dollars of product in there." },
      { who: "ai", text: "I'm sorry, that's urgent. Food in a walk-in above 41°F needs attention fast, so I'm treating this as an emergency. Is the compressor running, and is the fan inside the box blowing?" },
      { who: "caller", text: "Fan's blowing but it feels warm. I can hear something clicking outside." },
      { who: "ai", text: "Got it, that sounds like a condenser or compressor issue. Keep the door closed as much as you can and move the most valuable product to a reach-in if you have room. What's the address?" },
      { who: "caller", text: "Mesa Verde Grill, 4410 W Thomas Road." },
      { who: "ai", text: "Thank you. I'm sending Sam, our on-call refrigeration tech, now. His ETA is about 40 minutes. The emergency service call is $189, and he'll quote the repair before doing any work. I'm texting you a confirmation with his name and a tracking link." },
      { who: "caller", text: "Perfect, thank you." },
    ],
    job: { brand: "platinum", title: "EMERGENCY: walk-in at 50°F", customer: "Mesa Verde Grill", address: "4410 W Thomas Rd", durationHrs: 2, tech: "Sam D.", value: 1650, emergency: true, source: "AI call" },
  },
  ljs: {
    caller: "Jennifer Walsh",
    company: "Arcadia Family Dental",
    intent: "Office janitorial walkthrough",
    outcome: "booked",
    value: 4100,
    lines: [
      { who: "ai", text: "Thanks for calling LJ's Cleaning Solutions. Our office is closed, but I can help you right now. What can I do for you?" },
      { who: "caller", text: "Hi, we're a dental office and our cleaning company keeps missing nights. I want a quote for nightly cleaning." },
      { who: "ai", text: "We do a lot of medical and dental offices, including disinfection of operatories and break rooms. Roughly how many square feet, and how many nights a week?" },
      { who: "caller", text: "About 4,500 square feet, five nights a week." },
      { who: "ai", text: "For a 4,500 square foot dental office five nights a week, most clients land between $3,800 and $4,400 a month. Our supervisor would do a free 20-minute walkthrough to give you an exact number. I have Thursday at 9am or Friday at 2pm open." },
      { who: "caller", text: "Thursday at 9 works." },
      { who: "ai", text: "You're booked for Thursday at 9am with Lupe, our day lead. I'll text you a confirmation and a short checklist so we can quote it the same day." },
    ],
    job: { brand: "ljs", title: "Janitorial walkthrough (4,500 sq ft)", customer: "Arcadia Family Dental", address: "3800 E Indian School Rd", durationHrs: 1, tech: "Lupe G.", value: 4100, source: "AI call" },
  },
  allfaze: {
    caller: "Derek Jensen",
    company: "",
    intent: "EV charger install",
    outcome: "booked",
    value: 2150,
    lines: [
      { who: "ai", text: "Thanks for calling All Faze Electric. Our office is closed, but I can get you a quote. What do you need?" },
      { who: "caller", text: "I just bought an electric truck and need a charger put in my garage." },
      { who: "ai", text: "Congrats on the truck. A few quick questions so the quote is accurate. Do you already have the charger, and how far is your main panel from where you'd park?" },
      { who: "caller", text: "I have the charger. The panel is on the same wall, maybe 15 feet." },
      { who: "ai", text: "That's an easy run. Can you text me a photo of your panel with the door open? That tells us if you have room for a 60 amp breaker." },
      { who: "caller", text: "Sent it." },
      { who: "ai", text: "Thanks. You have a 200 amp panel with two open slots, so no upgrade needed. A 60 amp install with a 15 foot run is $1,950 to $2,250, permit included. I can book Tony for Tuesday at 8am." },
      { who: "caller", text: "Book it." },
    ],
    job: { brand: "allfaze", title: "EV charger install, 60A", customer: "Derek Jensen", address: "Laveen, 85339", durationHrs: 4, tech: "Tony V.", value: 2150, source: "AI call" },
  },
};
