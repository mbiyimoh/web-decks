-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('VOICE', 'TEXT', 'QUESTION');

-- CreateTable
CREATE TABLE "ClarityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClarityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSection" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,

    CONSTRAINT "ProfileSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSubsection" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,

    CONSTRAINT "ProfileSubsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileField" (
    "id" TEXT NOT NULL,
    "subsectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "fullContext" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "flaggedForValidation" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldSource" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "rawContent" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionId" TEXT,
    "userConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "FieldSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClarityProfile_userId_key" ON "ClarityProfile"("userId");

-- CreateIndex
CREATE INDEX "ClarityProfile_userId_idx" ON "ClarityProfile"("userId");

-- CreateIndex
CREATE INDEX "ProfileSection_profileId_idx" ON "ProfileSection"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSection_profileId_key_key" ON "ProfileSection"("profileId", "key");

-- CreateIndex
CREATE INDEX "ProfileSubsection_sectionId_idx" ON "ProfileSubsection"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSubsection_sectionId_key_key" ON "ProfileSubsection"("sectionId", "key");

-- CreateIndex
CREATE INDEX "ProfileField_subsectionId_idx" ON "ProfileField"("subsectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileField_subsectionId_key_key" ON "ProfileField"("subsectionId", "key");

-- CreateIndex
CREATE INDEX "FieldSource_fieldId_idx" ON "FieldSource"("fieldId");

-- AddForeignKey
ALTER TABLE "ProfileSection" ADD CONSTRAINT "ProfileSection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ClarityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSubsection" ADD CONSTRAINT "ProfileSubsection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ProfileSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileField" ADD CONSTRAINT "ProfileField_subsectionId_fkey" FOREIGN KEY ("subsectionId") REFERENCES "ProfileSubsection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldSource" ADD CONSTRAINT "FieldSource_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ProfileField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
