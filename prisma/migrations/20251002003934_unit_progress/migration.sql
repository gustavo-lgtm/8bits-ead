-- CreateTable
CREATE TABLE "UserUnitProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "UserUnitProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserUnitProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserUnitProgress_userId_idx" ON "UserUnitProgress"("userId");

-- CreateIndex
CREATE INDEX "UserUnitProgress_unitId_idx" ON "UserUnitProgress"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserUnitProgress_userId_unitId_key" ON "UserUnitProgress"("userId", "unitId");
