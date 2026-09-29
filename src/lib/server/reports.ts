import { z } from "zod";
import { prisma } from "./db";
import { gateReport, type AnalysisReport, type GatedReport } from "@/lib/instagram";

/** Loose structural validation of an uploaded report. Deep shape is trusted from our own analyzer. */
const reportSchema = z.object({
  version: z.string().min(1).max(20),
  generatedAt: z.string().min(1).max(40),
  timeZone: z.string().min(1).max(64),
  free: z.object({
    overview: z.object({ username: z.string().max(80).optional() }).passthrough(),
    followersSnapshot: z.object({}).passthrough(),
    activitySnapshot: z.object({}).passthrough(),
    topPeopleTeaser: z.object({}).passthrough(),
  }),
  pro: z.object({
    followers: z.object({}).passthrough(),
    engagement: z.object({}).passthrough(),
    content: z.object({}).passthrough(),
    messages: z.object({}).passthrough(),
    stories: z.object({}).passthrough(),
    saved: z.object({}).passthrough(),
    interests: z.object({}).passthrough(),
    searches: z.object({}).passthrough(),
    security: z.object({}).passthrough(),
    people: z.object({}).passthrough(),
  }),
});

export function validateReport(input: unknown): AnalysisReport {
  return reportSchema.parse(input) as unknown as AnalysisReport;
}

export async function createReport(report: AnalysisReport) {
  return prisma.report.create({
    data: {
      username: report.free.overview.username ?? null,
      data: JSON.stringify(report),
      analyzerVersion: report.version,
    },
    select: { id: true, deleteToken: true },
  });
}

export async function getGatedReport(id: string): Promise<GatedReport | null> {
  const row = await prisma.report.findUnique({ where: { id } });
  if (!row) return null;
  const report = JSON.parse(row.data) as AnalysisReport;
  return gateReport(report, {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    tier: row.tier === "pro" ? "pro" : "free",
  });
}

export async function getReportTier(id: string) {
  return prisma.report.findUnique({ where: { id }, select: { id: true, tier: true, username: true } });
}

export async function createPendingPayment(params: {
  reportId: string;
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
}) {
  return prisma.payment.create({ data: { ...params, status: "pending" } });
}

export async function getPaymentByOrder(providerOrderId: string) {
  return prisma.payment.findUnique({ where: { providerOrderId } });
}

export async function markReportPaid(params: {
  reportId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string | null;
  amount: number;
  currency: string;
  email?: string | null;
}) {
  const { reportId, provider, providerOrderId, providerPaymentId, amount, currency, email } = params;
  await prisma.$transaction([
    prisma.payment.upsert({
      where: { providerOrderId },
      create: {
        reportId,
        provider,
        providerOrderId,
        providerPaymentId: providerPaymentId ?? null,
        amount,
        currency,
        status: "paid",
        email: email ?? null,
      },
      update: { status: "paid", providerPaymentId: providerPaymentId ?? null, email: email ?? undefined },
    }),
    prisma.report.update({
      where: { id: reportId },
      data: { tier: "pro", paidAt: new Date(), email: email ?? undefined },
    }),
  ]);
}

export async function deleteReport(id: string, deleteToken: string): Promise<boolean> {
  const result = await prisma.report.deleteMany({ where: { id, deleteToken } });
  return result.count > 0;
}
