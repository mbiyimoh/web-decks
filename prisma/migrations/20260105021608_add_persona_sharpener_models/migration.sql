-- CreateTable
CREATE TABLE "ClarityModule" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "enrichesSections" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClarityModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "demographics" JSONB,
    "jobs" JSONB,
    "goals" JSONB,
    "frustrations" JSONB,
    "behaviors" JSONB,
    "antiPatterns" TEXT[],
    "quote" TEXT,
    "clarityOverall" INTEGER NOT NULL DEFAULT 0,
    "clarityIdentity" INTEGER NOT NULL DEFAULT 0,
    "clarityGoals" INTEGER NOT NULL DEFAULT 0,
    "clarityFrustrations" INTEGER NOT NULL DEFAULT 0,
    "clarityEmotional" INTEGER NOT NULL DEFAULT 0,
    "clarityBehaviors" INTEGER NOT NULL DEFAULT 0,
    "totalAssumptions" INTEGER NOT NULL DEFAULT 0,
    "avgConfidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "isUnsure" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "additionalContext" TEXT,
    "contextSource" TEXT,
    "responseType" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "respondentRole" TEXT NOT NULL,
    "respondentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharpenerSession" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "lastQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "questionsSkipped" INTEGER NOT NULL DEFAULT 0,
    "questionsUnsure" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SharpenerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClarityModule_slug_key" ON "ClarityModule"("slug");

-- CreateIndex
CREATE INDEX "Persona_profileId_idx" ON "Persona"("profileId");

-- CreateIndex
CREATE INDEX "Response_personaId_idx" ON "Response"("personaId");

-- CreateIndex
CREATE INDEX "Response_sessionId_idx" ON "Response"("sessionId");

-- CreateIndex
CREATE INDEX "Response_questionId_idx" ON "Response"("questionId");

-- CreateIndex
CREATE INDEX "SharpenerSession_personaId_idx" ON "SharpenerSession"("personaId");

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ClarityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SharpenerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharpenerSession" ADD CONSTRAINT "SharpenerSession_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;
