import { cookies } from "next/headers";
import Workspace from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  let boot;
  try {
    const base = process.env.API_URL || "http://127.0.0.1:4000";
    const status = await fetch(`${base}/api/setup`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!status.ok) throw new Error("API unavailable");
    const setup = await status.json();
    if (setup.required) boot = { setup: true };
    else {
      const jar = await cookies();
      const response = await fetch(`${base}/api/auth/me`, {
        headers: { cookie: jar.toString() },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      boot = response.ok ? await response.json() : {};
      if (boot.user && !boot.user.mustChangePassword) {
        const policy = await fetch(`${base}/api/policy`, {
          headers: { cookie: jar.toString() },
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
        if (policy?.ok) boot.company = await policy.json();
      }
    }
  } catch {
    boot = { offline: true };
  }
  return <Workspace boot={boot} />;
}
