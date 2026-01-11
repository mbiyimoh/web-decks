import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const brainDump = await prisma.personaBrainDump.findFirst({
    where: { id: 'cmk5m6zun0005qn01tkjv0ks1' },
    select: {
      customizedQuestions: true,
    }
  });

  const data = brainDump?.customizedQuestions as Record<string, { questions?: Array<{ validationContextualizedText?: string }> }>;
  if (!data) {
    console.log('No data');
    return;
  }

  // Check both personas
  for (const personaId of Object.keys(data)) {
    const questions = data[personaId]?.questions || [];
    const hasValidation = questions.some(q => q.validationContextualizedText);
    console.log('Persona:', personaId);
    console.log('  Total questions:', questions.length);
    console.log('  Has validationContextualizedText:', hasValidation);

    if (hasValidation) {
      const sample = questions.find(q => q.validationContextualizedText);
      console.log('  Sample:', sample?.validationContextualizedText?.substring(0, 100) + '...');
    }
    console.log('');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
