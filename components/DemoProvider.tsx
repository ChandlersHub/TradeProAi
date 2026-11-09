"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BRAND_IDS, type BrandId } from "@/lib/brands";
import type { Role } from "@/lib/auth";
import {
  generateCalls,
  generateJobs,
  generateReferrals,
  type CallRecord,
  type Job,
  type Referral,
} from "@/lib/data";

interface Added {
  calls: CallRecord[];
  jobs: Job[];
  referrals: Referral[];
}

interface DemoState {
  username: string;
  role: Role;
  scope: BrandId[];
  anchor: number;
  calls: CallRecord[];
  jobs: Job[];
  referrals: Referral[];
  addCall: (c: CallRecord) => void;
  addJob: (j: Job) => void;
  addReferral: (r: Referral) => void;
  updateReferral: (id: string, patch: Partial<Referral>) => void;
  reset: () => void;
  addedCount: number;
}

const Ctx = createContext<DemoState | null>(null);
const EMPTY: Added = { calls: [], jobs: [], referrals: [] };

export function DemoProvider({
  username,
  role,
  anchor,
  children,
}: {
  username: string;
  role: Role;
  anchor: number;
  children: React.ReactNode;
}) {
  const storageKey = `tp-demo:${username}`;
  const [added, setAdded] = useState<Added>(EMPTY);
  const [patches, setPatches] = useState<Record<string, Partial<Referral>>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAdded({ ...EMPTY, ...parsed.added });
        setPatches(parsed.patches ?? {});
      }
    } catch {
      /* storage unavailable: run without persistence */
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ added, patches }));
    } catch {
      /* ignore */
    }
  }, [storageKey, added, patches]);

  const scope = useMemo<BrandId[]>(() => (role === "owner" ? BRAND_IDS : [role]), [role]);

  const base = useMemo(
    () => ({ calls: generateCalls(anchor), jobs: generateJobs(anchor), referrals: generateReferrals(anchor) }),
    [anchor],
  );

  const inScope = useCallback((b: BrandId) => scope.includes(b), [scope]);

  const value = useMemo<DemoState>(
    () => ({
      username,
      role,
      scope,
      anchor,
      calls: [...added.calls, ...base.calls].filter((c) => inScope(c.brand)),
      jobs: [...added.jobs, ...base.jobs].filter((j) => inScope(j.brand)),
      referrals: [...added.referrals, ...base.referrals]
        .map((r) => ({ ...r, ...patches[r.id] }))
        .filter((r) => inScope(r.from) || inScope(r.to)),
      addCall: (c) => setAdded((a) => ({ ...a, calls: [c, ...a.calls] })),
      addJob: (j) => setAdded((a) => ({ ...a, jobs: [j, ...a.jobs] })),
      addReferral: (r) => setAdded((a) => ({ ...a, referrals: [r, ...a.referrals] })),
      updateReferral: (id, patch) => setPatches((p) => ({ ...p, [id]: { ...p[id], ...patch } })),
      reset: () => {
        setAdded(EMPTY);
        setPatches({});
      },
      addedCount: added.calls.length + added.jobs.length + added.referrals.length,
    }),
    [username, role, scope, anchor, added, base, patches, inScope],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo(): DemoState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo outside DemoProvider");
  return v;
}
