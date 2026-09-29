import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupAndAnalyse, RateLimitedError } from "@/lib/server/lookup";
import { normaliseUsername, ProfileNotFoundError, ProfilePrivateError, ProviderError } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 180;

const bodySchema = z.object({
  username: z.string().min(1).max(200),
  timeZone: z.string().max(64).optional(),
});

function clientIp(request: Request): string | undefined {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? undefined;
}

/** Looks up a public Instagram profile, analyses it, and returns the new report id. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const username = normaliseUsername(parsed.data.username);
  if (!username) {
    return NextResponse.json({ error: "That doesn't look like an Instagram username. Use letters, numbers, dots and underscores." }, { status: 400 });
  }
  try {
    const result = await lookupAndAnalyse({ username, timeZone: parsed.data.timeZone, ip: clientIp(request) });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof RateLimitedError) return NextResponse.json({ error: err.message }, { status: 429 });
    if (err instanceof ProfileNotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof ProfilePrivateError) return NextResponse.json({ error: err.message }, { status: 422 });
    if (err instanceof ProviderError) return NextResponse.json({ error: `We could not fetch this profile right now. ${err.message}` }, { status: 502 });
    console.error("lookup failed", err);
    return NextResponse.json({ error: "Something went wrong while analysing this profile. Please try again." }, { status: 500 });
  }
}
