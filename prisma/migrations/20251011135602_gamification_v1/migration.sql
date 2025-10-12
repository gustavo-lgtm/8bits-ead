-- CreateTable
CREATE TABLE "CourseGamificationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "countExtraInPrimary" BOOLEAN NOT NULL DEFAULT true,
    "xpWelcome" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CourseGamificationConfig_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserXPEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT,
    "unitId" TEXT,
    "eventType" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "xpType" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserXPEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserXPEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserXPEvent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserXPEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserXPBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "xpMandatory" INTEGER NOT NULL DEFAULT 0,
    "xpExtra" INTEGER NOT NULL DEFAULT 0,
    "xpOptional" INTEGER NOT NULL DEFAULT 0,
    "xpBonus" INTEGER NOT NULL DEFAULT 0,
    "xpWelcome" INTEGER NOT NULL DEFAULT 0,
    "xpPrimary" INTEGER NOT NULL DEFAULT 0,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserXPBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserXPBalance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "bonusPercent" INTEGER NOT NULL DEFAULT 10,
    CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Module" ("courseId", "icon", "id", "slug", "sortIndex", "title") SELECT "courseId", "icon", "id", "slug", "sortIndex", "title" FROM "Module";
DROP TABLE "Module";
ALTER TABLE "new_Module" RENAME TO "Module";
CREATE INDEX "Module_courseId_sortIndex_idx" ON "Module"("courseId", "sortIndex");
CREATE UNIQUE INDEX "Module_courseId_slug_key" ON "Module"("courseId", "slug");
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
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "xpMode" TEXT NOT NULL DEFAULT 'FIXED',
    "xpValue" INTEGER,
    "xpMax" INTEGER,
    CONSTRAINT "Unit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("driveFileId", "durationSec", "id", "moduleId", "requiresCompletedPrevious", "slug", "sortIndex", "title", "type", "url", "youtubeId") SELECT "driveFileId", "durationSec", "id", "moduleId", "requiresCompletedPrevious", "slug", "sortIndex", "title", "type", "url", "youtubeId" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE INDEX "Unit_moduleId_sortIndex_idx" ON "Unit"("moduleId", "sortIndex");
CREATE UNIQUE INDEX "Unit_moduleId_slug_key" ON "Unit"("moduleId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CourseGamificationConfig_courseId_key" ON "CourseGamificationConfig"("courseId");

-- CreateIndex
CREATE INDEX "UserXPEvent_userId_courseId_createdAt_idx" ON "UserXPEvent"("userId", "courseId", "createdAt");

-- CreateIndex
CREATE INDEX "UserXPEvent_courseId_moduleId_unitId_idx" ON "UserXPEvent"("courseId", "moduleId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPEvent_userId_unitId_eventType_key" ON "UserXPEvent"("userId", "unitId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPEvent_userId_moduleId_eventType_key" ON "UserXPEvent"("userId", "moduleId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPEvent_userId_courseId_eventType_key" ON "UserXPEvent"("userId", "courseId", "eventType");

-- CreateIndex
CREATE INDEX "UserXPBalance_courseId_xpPrimary_idx" ON "UserXPBalance"("courseId", "xpPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPBalance_userId_courseId_key" ON "UserXPBalance"("userId", "courseId");
