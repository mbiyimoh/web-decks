-- AlterTable
ALTER TABLE "Persona" ADD COLUMN     "brainDumpId" TEXT,
ADD COLUMN     "extractionConfidence" DOUBLE PRECISION,
ADD COLUMN     "skippedQuestionIds" TEXT[];

-- CreateTable
CREATE TABLE "PersonaBrainDump" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "rawTranscript" TEXT NOT NULL,
    "audioBlobUrl" TEXT,
    "durationSeconds" INTEGER,
    "extractedData" JSONB NOT NULL,
    "personaCount" INTEGER NOT NULL,
    "overallContext" JSONB NOT NULL,
    "customizedQuestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingMs" INTEGER,

    CONSTRAINT "PersonaBrainDump_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonaBrainDump_profileId_idx" ON "PersonaBrainDump"("profileId");

-- CreateIndex
CREATE INDEX "Persona_brainDumpId_idx" ON "Persona"("brainDumpId");

-- AddForeignKey
ALTER TABLE "PersonaBrainDump" ADD CONSTRAINT "PersonaBrainDump_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ClarityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_brainDumpId_fkey" FOREIGN KEY ("brainDumpId") REFERENCES "PersonaBrainDump"("id") ON DELETE SET NULL ON UPDATE CASCADE;
