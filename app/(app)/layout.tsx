import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, getSecret, verifySession } from "@/lib/auth";
import { DemoProvider } from "@/components/DemoProvider";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value, getSecret());
  if (!session) redirect("/login");

  // Round to the minute so the sample data is stable across quick reloads.
  const anchor = Math.floor(Date.now() / 60_000) * 60_000;

  return (
    <DemoProvider username={session.u} role={session.r} anchor={anchor}>
      <Shell>{children}</Shell>
    </DemoProvider>
  );
}
