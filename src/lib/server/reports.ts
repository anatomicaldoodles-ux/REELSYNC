import { prisma } from "./db";
import { gateReport, type GatedReport, type ProfileReport } from "@/lib/profile";

export async function createReport(params: { report: ProfileReport; username: string; provider: string; snapshotId?: string; ipHash?: string }) {
  const { report, username, provider, snapshotId, ipHash } = params;
  return prisma.report.create({
    data: {
      username,
      provider,
      snapshotId: snapshotId ?? null,
      ipHash: ipHash ?? null,
      data: JSON.stringify(report),
      analyzerVersion: report.version,
    },
    select: { id: true, deleteToken: true },
  });
}

export async function getGatedReport(id: string): Promise<GatedReport | null> {
  const row = await prisma.report.findUnique({ where: { id } });
  if (!row) return null;
  const report = JSON.parse(row.data) as ProfileReport;
  return gateReport(report, {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    tier: row.tier === "pro" ? "pro" : "free",
  });
}

export async function getReportTier(id: string) {
  return prisma.report.findUnique({ where: { id }, select: { id: true, tier: true, username: true } });
}

export async function createPendingPayment(params: { reportId: string; provider: string; providerOrderId: string; amount: number; currency: string }) {
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
      create: { reportId, provider, providerOrderId, providerPaymentId: providerPaymentId ?? null, amount, currency, status: "paid", email: email ?? null },
      update: { status: "paid", providerPaymentId: providerPaymentId ?? null, email: email ?? undefined },
    }),
    prisma.report.update({ where: { id: reportId }, data: { tier: "pro", paidAt: new Date(), email: email ?? undefined } }),
  ]);
}

export async function deleteReport(id: string, deleteToken: string): Promise<boolean> {
  const result = await prisma.report.deleteMany({ where: { id, deleteToken } });
  return result.count > 0;
}
