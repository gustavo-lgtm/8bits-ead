-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
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
    CONSTRAINT "Unit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Module_courseId_sortIndex_idx" ON "Module"("courseId", "sortIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Module_courseId_slug_key" ON "Module"("courseId", "slug");

-- CreateIndex
CREATE INDEX "Unit_moduleId_sortIndex_idx" ON "Unit"("moduleId", "sortIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_moduleId_slug_key" ON "Unit"("moduleId", "slug");
