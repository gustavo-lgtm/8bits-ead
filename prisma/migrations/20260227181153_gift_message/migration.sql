-- CreateTable
CREATE TABLE "public"."GiftMessage" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shownAt" TIMESTAMP(3),

    CONSTRAINT "GiftMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftMessage_courseId_code_idx" ON "public"."GiftMessage"("courseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "GiftMessage_courseId_code_key" ON "public"."GiftMessage"("courseId", "code");

-- AddForeignKey
ALTER TABLE "public"."GiftMessage" ADD CONSTRAINT "GiftMessage_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
