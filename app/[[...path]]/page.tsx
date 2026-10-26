import { cookies } from "next/headers";
import Workspace from "@/components/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  let boot;
  try {
    const base = process.env.API_URL || "http://127.0.0.1:4000";
    const jar = await cookies();
    const response = await fetch(`${base}/api/bootstrap`, {
      headers: { cookie: jar.toString() },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("API unavailable");
    boot = await response.json();
  } catch {
    boot = { offline: true };
  }
  return <Workspace boot={boot} />;
}
