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
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "xpMode" TEXT NOT NULL DEFAULT 'FIXED',
    "xpValue" INTEGER,
    "xpMax" INTEGER,
    CONSTRAINT "Unit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("driveFileId", "durationSec", "id", "isExtra", "isOptional", "moduleId", "requiresCompletedPrevious", "slug", "sortIndex", "title", "type", "url", "xpMax", "xpMode", "xpValue", "youtubeId") SELECT "driveFileId", "durationSec", "id", "isExtra", "isOptional", "moduleId", "requiresCompletedPrevious", "slug", "sortIndex", "title", "type", "url", "xpMax", "xpMode", "xpValue", "youtubeId" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE INDEX "Unit_moduleId_sortIndex_idx" ON "Unit"("moduleId", "sortIndex");
CREATE UNIQUE INDEX "Unit_moduleId_slug_key" ON "Unit"("moduleId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
