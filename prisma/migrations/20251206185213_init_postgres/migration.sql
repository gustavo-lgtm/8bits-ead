-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ConsentStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."CourseCategory" AS ENUM ('GAME_DEV', 'ROBOTIC', 'MAKER', 'AI', 'DIGITAL');

-- CreateEnum
CREATE TYPE "public"."CourseLevel" AS ENUM ('N1', 'N2', 'N3');

-- CreateEnum
CREATE TYPE "public"."UnitType" AS ENUM ('VIDEO', 'DOC', 'LINK');

-- CreateEnum
CREATE TYPE "public"."ProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."UnlockStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."XPMode" AS ENUM ('FIXED', 'QUIZ_PARTIAL');

-- CreateEnum
CREATE TYPE "public"."XPType" AS ENUM ('MANDATORY', 'EXTRA', 'OPTIONAL', 'BONUS', 'WELCOME');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "emailVerified" TIMESTAMP(3),
    "nickname" TEXT,
    "birthDate" TIMESTAMP(3),
    "consentStatus" "public"."ConsentStatus" NOT NULL DEFAULT 'NONE',
    "guardianName" TEXT,
    "guardianEmail" TEXT,
    "consentAt" TIMESTAMP(3),
    "consentMethod" TEXT,
    "consentToken" TEXT,
    "consentExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posterWideUrl" TEXT,
    "posterNarrowUrl" TEXT,
    "description" TEXT,
    "category" "public"."CourseCategory" NOT NULL DEFAULT 'GAME_DEV',
    "level" "public"."CourseLevel" NOT NULL DEFAULT 'N1',

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "posterUrl" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "bonusPercent" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Unit" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."UnitType" NOT NULL,
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
    "xpMode" "public"."XPMode" NOT NULL DEFAULT 'FIXED',
    "xpValue" INTEGER DEFAULT 30,
    "xpMax" INTEGER,
    "thresholdPct" INTEGER NOT NULL DEFAULT 85,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserUnitProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" "public"."ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "watchedPct" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "UserUnitProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCourse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseUnlockCode" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "public"."UnlockStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "CourseUnlockCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseGamificationConfig" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "countExtraInPrimary" BOOLEAN NOT NULL DEFAULT true,
    "xpWelcome" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CourseGamificationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserXPEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT,
    "unitId" TEXT,
    "eventType" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "xpType" "public"."XPType" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserXPEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserXPBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "xpMandatory" INTEGER NOT NULL DEFAULT 0,
    "xpExtra" INTEGER NOT NULL DEFAULT 0,
    "xpOptional" INTEGER NOT NULL DEFAULT 0,
    "xpBonus" INTEGER NOT NULL DEFAULT 0,
    "xpWelcome" INTEGER NOT NULL DEFAULT 0,
    "xpPrimary" INTEGER NOT NULL DEFAULT 0,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserXPBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AuthEvent_userId_createdAt_idx" ON "public"."AuthEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "public"."Course"("slug");

-- CreateIndex
CREATE INDEX "Module_courseId_sortIndex_idx" ON "public"."Module"("courseId", "sortIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Module_courseId_slug_key" ON "public"."Module"("courseId", "slug");

-- CreateIndex
CREATE INDEX "Unit_moduleId_sortIndex_idx" ON "public"."Unit"("moduleId", "sortIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_moduleId_slug_key" ON "public"."Unit"("moduleId", "slug");

-- CreateIndex
CREATE INDEX "UserUnitProgress_userId_idx" ON "public"."UserUnitProgress"("userId");

-- CreateIndex
CREATE INDEX "UserUnitProgress_unitId_idx" ON "public"."UserUnitProgress"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserUnitProgress_userId_unitId_key" ON "public"."UserUnitProgress"("userId", "unitId");

-- CreateIndex
CREATE INDEX "UserCourse_userId_idx" ON "public"."UserCourse"("userId");

-- CreateIndex
CREATE INDEX "UserCourse_courseId_idx" ON "public"."UserCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCourse_userId_courseId_key" ON "public"."UserCourse"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseUnlockCode_code_key" ON "public"."CourseUnlockCode"("code");

-- CreateIndex
CREATE INDEX "CourseUnlockCode_courseId_idx" ON "public"."CourseUnlockCode"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseGamificationConfig_courseId_key" ON "public"."CourseGamificationConfig"("courseId");

-- CreateIndex
CREATE INDEX "UserXPEvent_userId_courseId_createdAt_idx" ON "public"."UserXPEvent"("userId", "courseId", "createdAt");

-- CreateIndex
CREATE INDEX "UserXPEvent_courseId_moduleId_unitId_idx" ON "public"."UserXPEvent"("courseId", "moduleId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPEvent_userId_unitId_eventType_key" ON "public"."UserXPEvent"("userId", "unitId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPEvent_userId_moduleId_eventType_key" ON "public"."UserXPEvent"("userId", "moduleId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPEvent_userId_courseId_eventType_key" ON "public"."UserXPEvent"("userId", "courseId", "eventType");

-- CreateIndex
CREATE INDEX "UserXPBalance_courseId_xpPrimary_idx" ON "public"."UserXPBalance"("courseId", "xpPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserXPBalance_userId_courseId_key" ON "public"."UserXPBalance"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuthEvent" ADD CONSTRAINT "AuthEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserUnitProgress" ADD CONSTRAINT "UserUnitProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserUnitProgress" ADD CONSTRAINT "UserUnitProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCourse" ADD CONSTRAINT "UserCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCourse" ADD CONSTRAINT "UserCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseUnlockCode" ADD CONSTRAINT "CourseUnlockCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseGamificationConfig" ADD CONSTRAINT "CourseGamificationConfig_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXPEvent" ADD CONSTRAINT "UserXPEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXPEvent" ADD CONSTRAINT "UserXPEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXPEvent" ADD CONSTRAINT "UserXPEvent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXPEvent" ADD CONSTRAINT "UserXPEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXPBalance" ADD CONSTRAINT "UserXPBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXPBalance" ADD CONSTRAINT "UserXPBalance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
