-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posterWideUrl" TEXT,
    "posterNarrowUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GAME_DEV',
    "level" TEXT NOT NULL DEFAULT 'N1'
);
INSERT INTO "new_Course" ("createdAt", "id", "posterNarrowUrl", "posterWideUrl", "slug", "title") SELECT "createdAt", "id", "posterNarrowUrl", "posterWideUrl", "slug", "title" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
