-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerified" DATETIME,
    "nickname" TEXT,
    "birthDate" DATETIME,
    "consentStatus" TEXT NOT NULL DEFAULT 'NONE',
    "guardianName" TEXT,
    "guardianEmail" TEXT,
    "consentAt" DATETIME,
    "consentMethod" TEXT,
    "consentToken" TEXT,
    "consentExpires" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "name", "passwordHash", "role") SELECT "createdAt", "email", "emailVerified", "id", "name", "passwordHash", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
