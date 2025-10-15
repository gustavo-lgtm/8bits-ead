-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "youtubeId" TEXT,
    "driveFileId" TEXT,
    "url" TEXT,
    "durationSec" INTEGER,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "requiresCompletedPrevious" BOOLEAN NOT NULL DEFAULT false,
    "isWelcome" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "posterUrl" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "xpMode" TEXT NOT NULL DEFAULT 'FIXED',
    "xpValue" INTEGER DEFAULT 30,
    "xpMax" INTEGER,
    "thresholdPct" INTEGER NOT NULL DEFAULT 85,
    CONSTRAINT "Unit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("description", "driveFileId", "durationSec", "id", "isExtra", "isOptional", "isWelcome", "moduleId", "posterUrl", "requiresCompletedPrevious", "slug", "sortIndex", "title", "type", "url", "xpMax", "xpMode", "xpValue", "youtubeId") SELECT "description", "driveFileId", "durationSec", "id", "isExtra", "isOptional", "isWelcome", "moduleId", "posterUrl", "requiresCompletedPrevious", "slug", "sortIndex", "title", "type", "url", "xpMax", "xpMode", "xpValue", "youtubeId" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE INDEX "Unit_moduleId_sortIndex_idx" ON "Unit"("moduleId", "sortIndex");
CREATE UNIQUE INDEX "Unit_moduleId_slug_key" ON "Unit"("moduleId", "slug");
CREATE TABLE "new_UserUnitProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "watchedPct" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "UserUnitProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserUnitProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserUnitProgress" ("completedAt", "id", "lastViewedAt", "status", "unitId", "userId") SELECT "completedAt", "id", "lastViewedAt", "status", "unitId", "userId" FROM "UserUnitProgress";
DROP TABLE "UserUnitProgress";
ALTER TABLE "new_UserUnitProgress" RENAME TO "UserUnitProgress";
CREATE INDEX "UserUnitProgress_userId_idx" ON "UserUnitProgress"("userId");
CREATE INDEX "UserUnitProgress_unitId_idx" ON "UserUnitProgress"("unitId");
CREATE UNIQUE INDEX "UserUnitProgress_userId_unitId_key" ON "UserUnitProgress"("userId", "unitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
