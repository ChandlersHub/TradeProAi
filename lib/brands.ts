export type BrandId = "ljs" | "allfaze" | "platinum";

export interface Brand {
  id: BrandId;
  name: string;
  short: string;
  trade: string;
  phone: string;
  address: string;
  hours: string;
  /** CSS custom property holding this brand's series color. */
  color: string;
  services: string[];
  techs: { name: string; role: string; onCall?: boolean }[];
  aiName: string;
}

export const BRANDS: Record<BrandId, Brand> = {
  ljs: {
    id: "ljs",
    name: "LJ's Cleaning Solutions",
    short: "LJ's",
    trade: "Commercial cleaning",
    phone: "(480) 219-5167",
    address: "1619 S 59th Ave, Phoenix 85043",
    hours: "Mon–Fri 7am–4pm",
    color: "var(--series-1)",
    services: [
      "Commercial janitorial",
      "Warehouse cleaning",
      "Data center cleaning",
      "Fleet and bus detailing",
      "Post-construction cleanup",
      "Janitorial supply shop",
    ],
    techs: [
      { name: "Maria R.", role: "Night crew supervisor", onCall: true },
      { name: "Andre T.", role: "Warehouse crew lead" },
      { name: "Lupe G.", role: "Day porter lead" },
      { name: "Kevin S.", role: "Fleet detailing" },
    ],
    aiName: "LJ's front desk",
  },
  allfaze: {
    id: "allfaze",
    name: "All Faze Electric",
    short: "All Faze",
    trade: "Electrical",
    phone: "(480) 801-6000",
    address: "1615 S 59th Ave, Phoenix 85043",
    hours: "Mon–Fri 7am–4pm",
    color: "var(--series-2)",
    services: [
      "EV charger installs",
      "Panel upgrades",
      "Commercial and parking lot lighting",
      "Generators",
      "Troubleshooting and repairs",
      "Maintenance packages",
    ],
    techs: [
      { name: "Ray M.", role: "Master electrician", onCall: true },
      { name: "Tony V.", role: "Journeyman" },
      { name: "Chris L.", role: "Journeyman" },
    ],
    aiName: "All Faze dispatch",
  },
  platinum: {
    id: "platinum",
    name: "Platinum Refrigeration",
    short: "Platinum",
    trade: "Refrigeration and HVAC",
    phone: "(602) 675-3906",
    address: "1611 S 59th Ave, Phoenix 85043",
    hours: "Mon–Fri 7am–4pm, emergencies 24/7",
    color: "var(--series-3)",
    services: [
      "Walk-in cooler and freezer repair",
      "Reach-in and ice machine service",
      "Commercial HVAC",
      "Residential AC",
      "Preventive maintenance plans",
      "Appliance and plumbing repair",
    ],
    techs: [
      { name: "Sam D.", role: "Refrigeration lead", onCall: true },
      { name: "Hector P.", role: "HVAC tech" },
      { name: "Jess K.", role: "Refrigeration tech" },
    ],
    aiName: "Platinum service line",
  },
};

export const BRAND_IDS: BrandId[] = ["ljs", "allfaze", "platinum"];
