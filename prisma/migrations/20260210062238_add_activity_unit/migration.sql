-- CreateEnum
CREATE TYPE "public"."ActivityAttachmentKind" AS ENUM ('FILE', 'IMAGE', 'VIDEO');

-- AlterEnum
ALTER TYPE "public"."UnitType" ADD VALUE 'ACTIVITY';

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

-- AddForeignKey
ALTER TABLE "public"."ActivitySubmission" ADD CONSTRAINT "ActivitySubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivitySubmission" ADD CONSTRAINT "ActivitySubmission_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityAttachment" ADD CONSTRAINT "ActivityAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."ActivitySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
