import { createHash } from "node:crypto";
import { prisma } from "./db";
import { env } from "./env";
import { createReport } from "./reports";
import { analyzeProfile, providerFromEnv, type FollowerPoint, type PublicProfile } from "@/lib/profile";

export class RateLimitedError extends Error {
  constructor() {
    super("You have reached today's lookup limit. Try again tomorrow.");
    this.name = "RateLimitedError";
  }
}

export function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256").update(`${env.ipSalt}:${ip}`).digest("hex").slice(0, 32);
}

async function assertUnderLimit(ipHash: string | undefined) {
  if (!ipHash) return;
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const count = await prisma.report.count({ where: { ipHash, createdAt: { gte: since } } });
  if (count >= env.lookupsPerIpPerDay) throw new RateLimitedError();
}

/** Returns a recent snapshot for the username if one is fresh enough, else fetches and stores a new one. */
async function getOrFetchSnapshot(username: string) {
  const provider = providerFromEnv();
  const fresh = await prisma.profileSnapshot.findFirst({
    where: { username, provider: provider.name, fetchedAt: { gte: new Date(Date.now() - env.snapshotTtlHours * 3600 * 1000) } },
    orderBy: { fetchedAt: "desc" },
  });
  if (fresh) return { snapshot: fresh, profile: JSON.parse(fresh.data) as PublicProfile, cached: true };
  const profile = await provider.fetchProfile(username, { postsLimit: env.postsLimit });
  const snapshot = await prisma.profileSnapshot.create({
    data: {
      username,
      provider: provider.name,
      followers: profile.followers,
      following: profile.following,
      postsCount: profile.postsCount,
      data: JSON.stringify(profile),
    },
  });
  return { snapshot, profile, cached: false };
}

async function followerHistory(username: string, provider: string): Promise<FollowerPoint[]> {
  const rows = await prisma.profileSnapshot.findMany({
    where: { username, provider },
    orderBy: { fetchedAt: "asc" },
    select: { fetchedAt: true, followers: true, following: true, postsCount: true },
    take: 400,
  });
  // One point per day (the last snapshot of that day).
  const byDay = new Map<string, FollowerPoint>();
  for (const r of rows) byDay.set(r.fetchedAt.toISOString().slice(0, 10), { at: r.fetchedAt.toISOString(), followers: r.followers, following: r.following, postsCount: r.postsCount });
  return [...byDay.values()];
}

export async function lookupAndAnalyse(params: { username: string; timeZone?: string; ip?: string }) {
  const ipHash = hashIp(params.ip);
  await assertUnderLimit(ipHash);
  const { snapshot, profile, cached } = await getOrFetchSnapshot(params.username);
  const history = await followerHistory(params.username, profile.provider);
  const report = analyzeProfile(profile, { timeZone: params.timeZone, history });
  const created = await createReport({ report, username: params.username, provider: profile.provider, snapshotId: snapshot.id, ipHash });
  return { id: created.id, deleteToken: created.deleteToken, cached, provider: profile.provider };
}
