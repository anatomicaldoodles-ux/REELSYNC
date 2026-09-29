-- CreateTable
CREATE TABLE "ProfileSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "postsCount" INTEGER NOT NULL,
    "data" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "username" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'demo',
    "snapshotId" TEXT,
    "ipHash" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "paidAt" DATETIME,
    "email" TEXT,
    "data" TEXT NOT NULL,
    "analyzerVersion" TEXT NOT NULL,
    "deleteToken" TEXT NOT NULL
);
INSERT INTO "new_Report" ("analyzerVersion", "createdAt", "data", "deleteToken", "email", "id", "paidAt", "tier", "updatedAt", "username") SELECT "analyzerVersion", "createdAt", "data", "deleteToken", "email", "id", "paidAt", "tier", "updatedAt", "username" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE UNIQUE INDEX "Report_deleteToken_key" ON "Report"("deleteToken");
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");
CREATE INDEX "Report_ipHash_createdAt_idx" ON "Report"("ipHash", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProfileSnapshot_username_fetchedAt_idx" ON "ProfileSnapshot"("username", "fetchedAt");
