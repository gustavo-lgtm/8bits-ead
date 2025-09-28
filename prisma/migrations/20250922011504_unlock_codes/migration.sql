-- CreateTable
CREATE TABLE "CourseUnlockCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    CONSTRAINT "CourseUnlockCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseUnlockCode_code_key" ON "CourseUnlockCode"("code");

-- CreateIndex
CREATE INDEX "CourseUnlockCode_courseId_idx" ON "CourseUnlockCode"("courseId");
