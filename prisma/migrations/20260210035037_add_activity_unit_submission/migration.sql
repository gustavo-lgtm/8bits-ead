/*
  Warnings:

  - The values [USED,REVOKED] on the enum `UnlockStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `posterNarrowUrl` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `posterWideUrl` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `bonusPercent` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `isOptional` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `unlockedAt` on the `UserCourse` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `UserUnitProgress` table. All the data in the column will be lost.
  - You are about to drop the column `watchedPct` on the `UserUnitProgress` table. All the data in the column will be lost.
  - You are about to drop the column `watchedSeconds` on the `UserUnitProgress` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpBonus` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpExtra` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpMandatory` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpOptional` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpPrimary` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpTotal` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `xpWelcome` on the `UserXPBalance` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `UserXPEvent` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `UserXPEvent` table. All the data in the column will be lost.
  - You are about to drop the column `moduleId` on the `UserXPEvent` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `UserXPEvent` table. All the data in the column will be lost.
  - You are about to drop the column `xpType` on the `UserXPEvent` table. All the data in the column will be lost.
  - You are about to drop the `CourseGamificationConfig` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserXPBalance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `UserXPEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kind` to the `UserXPEvent` table without a default value. This is not possible if the table is not empty.
  - Made the column `unitId` on table `UserXPEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ActivityAttachmentKind" AS ENUM ('FILE', 'IMAGE', 'VIDEO');

-- AlterEnum
ALTER TYPE "public"."UnitType" ADD VALUE 'ACTIVITY';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UnlockStatus_new" AS ENUM ('ACTIVE', 'DISABLED');
ALTER TABLE "public"."CourseUnlockCode" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."CourseUnlockCode" ALTER COLUMN "status" TYPE "public"."UnlockStatus_new" USING ("status"::text::"public"."UnlockStatus_new");
ALTER TYPE "public"."UnlockStatus" RENAME TO "UnlockStatus_old";
ALTER TYPE "public"."UnlockStatus_new" RENAME TO "UnlockStatus";
DROP TYPE "public"."UnlockStatus_old";
ALTER TABLE "public"."CourseUnlockCode" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."CourseGamificationConfig" DROP CONSTRAINT "CourseGamificationConfig_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserXPBalance" DROP CONSTRAINT "UserXPBalance_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserXPEvent" DROP CONSTRAINT "UserXPEvent_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserXPEvent" DROP CONSTRAINT "UserXPEvent_moduleId_fkey";

-- DropIndex
DROP INDEX "public"."UserCourse_userId_idx";

-- DropIndex
DROP INDEX "public"."UserUnitProgress_userId_idx";

-- DropIndex
DROP INDEX "public"."UserXPBalance_courseId_xpPrimary_idx";

-- DropIndex
DROP INDEX "public"."UserXPBalance_userId_courseId_key";

-- DropIndex
DROP INDEX "public"."UserXPEvent_courseId_moduleId_unitId_idx";

-- DropIndex
DROP INDEX "public"."UserXPEvent_userId_courseId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."UserXPEvent_userId_courseId_eventType_key";

-- DropIndex
DROP INDEX "public"."UserXPEvent_userId_moduleId_eventType_key";

-- DropIndex
DROP INDEX "public"."UserXPEvent_userId_unitId_eventType_key";

-- AlterTable
ALTER TABLE "public"."Course" DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "level",
DROP COLUMN "posterNarrowUrl",
DROP COLUMN "posterWideUrl",
ADD COLUMN     "posterUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Module" DROP COLUMN "bonusPercent",
DROP COLUMN "icon",
DROP COLUMN "isOptional";

-- AlterTable
ALTER TABLE "public"."UserCourse" DROP COLUMN "unlockedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."UserUnitProgress" DROP COLUMN "status",
DROP COLUMN "watchedPct",
DROP COLUMN "watchedSeconds",
ADD COLUMN     "watchedSec" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."UserXPBalance" DROP COLUMN "courseId",
DROP COLUMN "xpBonus",
DROP COLUMN "xpExtra",
DROP COLUMN "xpMandatory",
DROP COLUMN "xpOptional",
DROP COLUMN "xpPrimary",
DROP COLUMN "xpTotal",
DROP COLUMN "xpWelcome",
ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."UserXPEvent" DROP COLUMN "courseId",
DROP COLUMN "eventType",
DROP COLUMN "moduleId",
DROP COLUMN "xp",
DROP COLUMN "xpType",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "kind" TEXT NOT NULL,
ALTER COLUMN "unitId" SET NOT NULL;

-- DropTable
DROP TABLE "public"."CourseGamificationConfig";

-- DropEnum
DROP TYPE "public"."CourseCategory";

-- DropEnum
DROP TYPE "public"."CourseLevel";

-- DropEnum
DROP TYPE "public"."ProgressStatus";

-- DropEnum
DROP TYPE "public"."XPType";

-- CreateTable
CREATE TABLE "public"."ActivitySubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivitySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "kind" "public"."ActivityAttachmentKind" NOT NULL DEFAULT 'FILE',
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivitySubmission_unitId_createdAt_idx" ON "public"."ActivitySubmission"("unitId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivitySubmission_userId_createdAt_idx" ON "public"."ActivitySubmission"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivitySubmission_userId_unitId_key" ON "public"."ActivitySubmission"("userId", "unitId");

-- CreateIndex
CREATE INDEX "ActivityAttachment_submissionId_createdAt_idx" ON "public"."ActivityAttachment"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "AuthEvent_type_createdAt_idx" ON "public"."AuthEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Course_slug_idx" ON "public"."Course"("slug");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "UserUnitProgress_userId_lastViewedAt_idx" ON "public"."UserUnitProgress"("userId", "lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPBalance_userId_key" ON "public"."UserXPBalance"("userId");

-- CreateIndex
CREATE INDEX "UserXPEvent_userId_createdAt_idx" ON "public"."UserXPEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserXPEvent_unitId_createdAt_idx" ON "public"."UserXPEvent"("unitId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ActivitySubmission" ADD CONSTRAINT "ActivitySubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivitySubmission" ADD CONSTRAINT "ActivitySubmission_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityAttachment" ADD CONSTRAINT "ActivityAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."ActivitySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
