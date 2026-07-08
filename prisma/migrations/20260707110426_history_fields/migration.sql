-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResumeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'balanced',
    "inputHash" TEXT NOT NULL,
    "costUsd" REAL NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "scoreOverall" INTEGER NOT NULL DEFAULT 0,
    "resume" TEXT,
    "jobDescription" TEXT,
    "instruction" TEXT,
    "resultJson" TEXT,
    CONSTRAINT "ResumeRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResumeRun" ("cached", "costUsd", "createdAt", "creditsUsed", "id", "inputHash", "inputTokens", "mode", "outputTokens", "userId") SELECT "cached", "costUsd", "createdAt", "creditsUsed", "id", "inputHash", "inputTokens", "mode", "outputTokens", "userId" FROM "ResumeRun";
DROP TABLE "ResumeRun";
ALTER TABLE "new_ResumeRun" RENAME TO "ResumeRun";
CREATE INDEX "ResumeRun_userId_createdAt_idx" ON "ResumeRun"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
