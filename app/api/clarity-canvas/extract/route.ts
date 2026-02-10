import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { brainDumpExtractionSchema, buildScopedExtractionSchema } from '@/lib/clarity-canvas/extraction-schema';
import { BRAIN_DUMP_EXTRACTION_PROMPT, EXTRACTION_SYSTEM_PROMPT, buildScopedExtractionPrompt, GAP_ANALYSIS_PROMPT } from '@/lib/clarity-canvas/prompts';
import { buildKeyLookups, fuzzyMatchKey } from '@/lib/clarity-canvas/key-matching';
import type { ExtractOnlyResponse, ExtractionChunk, ExtractionMetadata, GapAnalysisChange } from '@/lib/clarity-canvas/types';

interface ExtractRequestBody {
  transcript: string;
  sourceType: 'VOICE' | 'TEXT';
  scope?: {
    section: string;
    subsection?: string;
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExtractOnlyResponse | { error: string }>> {
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ExtractRequestBody;
    const { transcript, sourceType, scope } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    console.log(`[extract] Processing ${sourceType} brain dump (${transcript.length} chars)${scope ? ` [scoped to ${scope.section}${scope.subsection ? `.${scope.subsection}` : ''}]` : ''}`);

    // Get user's profile
    const profile = await prisma.clarityProfile.findFirst({
      where: { userRecordId: user.id },
      include: {
        sections: {
          include: {
            subsections: {
              include: {
                fields: {
                  include: {
                    sources: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please create a profile first.' }, { status: 404 });
    }

    // Determine schema and prompt based on scope
    const schema = scope
      ? buildScopedExtractionSchema(scope.section)
      : brainDumpExtractionSchema;

    const prompt = scope
      ? buildScopedExtractionPrompt(scope.section, scope.subsection)
      : BRAIN_DUMP_EXTRACTION_PROMPT;

    // First pass: Initial extraction
    const { object: firstPassExtraction } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: `${prompt}\n\nTRANSCRIPT:\n${transcript}`,
    });

    console.log(`[extract] First pass: ${firstPassExtraction.chunks.length} chunks, ${firstPassExtraction.overallThemes.length} themes`);

    // Second pass: Gap analysis - critically audit first pass against original transcript
    let extraction = firstPassExtraction;
    let gapAnalysisApplied = false;
    const changes: GapAnalysisChange[] = [];

    try {
      const { object: secondPassExtraction } = await generateObject({
        model: openai('gpt-4o'),
        schema, // Same schema - outputs complete chunk set
        system: EXTRACTION_SYSTEM_PROMPT,
        prompt: `${GAP_ANALYSIS_PROMPT}

ORIGINAL TRANSCRIPT:
${transcript}

FIRST PASS EXTRACTION:
${JSON.stringify(firstPassExtraction, null, 2)}

Now return the complete, final set of chunks.`,
      });

      extraction = secondPassExtraction;
      gapAnalysisApplied = true;

      console.log(`[extract] Second pass (gap analysis): ${extraction.chunks.length} chunks (first pass had ${firstPassExtraction.chunks.length})`);

      // Analyze changes between first and second pass
      const firstPassFields = new Set(firstPassExtraction.chunks.map(c => `${c.targetSection}.${c.targetSubsection}.${c.targetField}`));
      const secondPassFields = new Set(extraction.chunks.map(c => `${c.targetSection}.${c.targetSubsection}.${c.targetField}`));

      // Find added chunks (in second pass but not first)
      for (const chunk of extraction.chunks) {
        const key = `${chunk.targetSection}.${chunk.targetSubsection}.${chunk.targetField}`;
        if (!firstPassFields.has(key)) {
          changes.push({
            type: 'added',
            description: `Added insight for ${chunk.targetField.replace(/_/g, ' ')}`,
            fieldKey: chunk.targetField,
          });
        }
      }

      // Find improved/replaced chunks (same field, different content)
      for (const secondChunk of extraction.chunks) {
        const key = `${secondChunk.targetSection}.${secondChunk.targetSubsection}.${secondChunk.targetField}`;
        if (firstPassFields.has(key)) {
          const firstChunk = firstPassExtraction.chunks.find(
            c => `${c.targetSection}.${c.targetSubsection}.${c.targetField}` === key
          );
          if (firstChunk) {
            // Check if content changed significantly
            if (firstChunk.content !== secondChunk.content) {
              if (secondChunk.content.length > firstChunk.content.length * 1.2) {
                changes.push({
                  type: 'improved',
                  description: `Enriched ${secondChunk.targetField.replace(/_/g, ' ')} with more detail`,
                  fieldKey: secondChunk.targetField,
                });
              }
            }
            // Check if confidence was adjusted
            if (Math.abs(firstChunk.confidence - secondChunk.confidence) > 0.1) {
              changes.push({
                type: 'confidence_adjusted',
                description: `Adjusted confidence for ${secondChunk.targetField.replace(/_/g, ' ')} (${Math.round(firstChunk.confidence * 100)}% → ${Math.round(secondChunk.confidence * 100)}%)`,
                fieldKey: secondChunk.targetField,
              });
            }
          }
        }
      }

      // Find consolidated chunks (in first pass but not second - likely merged)
      const removedCount = firstPassExtraction.chunks.length - extraction.chunks.length + changes.filter(c => c.type === 'added').length;
      if (removedCount > 0) {
        changes.push({
          type: 'consolidated',
          description: `Consolidated ${removedCount} redundant or fragmented insight${removedCount > 1 ? 's' : ''}`,
        });
      }

      if (changes.length > 0) {
        console.log(`[extract] Gap analysis made ${changes.length} changes`);
      }
    } catch (error) {
      console.warn('[extract] Gap analysis failed, using first-pass results:', error);
      // extraction already set to firstPassExtraction
    }

    // Build key lookups for fuzzy matching
    const { sectionKeys, subsectionKeys, fieldKeys } = buildKeyLookups();

    // Validate extracted chunks (no DB writes)
    let validCount = 0;
    let droppedCount = 0;
    const droppedChunks: { reason: string; chunk: { targetSection: string; targetSubsection: string; targetField: string; summary: string } }[] = [];
    const validChunks: ExtractionChunk[] = [];

    for (const chunk of extraction.chunks) {
      // Fuzzy-match section
      const matchedSectionKey = fuzzyMatchKey(chunk.targetSection, sectionKeys);
      if (!matchedSectionKey) {
        droppedCount++;
        droppedChunks.push({ reason: `Unknown section: "${chunk.targetSection}"`, chunk: { targetSection: chunk.targetSection, targetSubsection: chunk.targetSubsection, targetField: chunk.targetField, summary: chunk.summary } });
        continue;
      }

      const section = profile.sections.find((s) => s.key === matchedSectionKey);
      if (!section) {
        droppedCount++;
        droppedChunks.push({ reason: `Section not in profile: "${matchedSectionKey}"`, chunk: { targetSection: chunk.targetSection, targetSubsection: chunk.targetSubsection, targetField: chunk.targetField, summary: chunk.summary } });
        continue;
      }

      // Fuzzy-match subsection
      const validSubsections = subsectionKeys.get(matchedSectionKey);
      const matchedSubsectionKey = validSubsections ? fuzzyMatchKey(chunk.targetSubsection, validSubsections) : null;
      if (!matchedSubsectionKey) {
        droppedCount++;
        droppedChunks.push({ reason: `Unknown subsection: "${chunk.targetSubsection}" in section "${matchedSectionKey}"`, chunk: { targetSection: chunk.targetSection, targetSubsection: chunk.targetSubsection, targetField: chunk.targetField, summary: chunk.summary } });
        continue;
      }

      const subsection = section.subsections.find((ss) => ss.key === matchedSubsectionKey);
      if (!subsection) {
        droppedCount++;
        continue;
      }

      // Fuzzy-match field
      const compositeKey = `${matchedSectionKey}.${matchedSubsectionKey}`;
      const validFields = fieldKeys.get(compositeKey);
      const matchedFieldKey = validFields ? fuzzyMatchKey(chunk.targetField, validFields) : null;
      if (!matchedFieldKey) {
        droppedCount++;
        droppedChunks.push({ reason: `Unknown field: "${chunk.targetField}" in ${matchedSectionKey}.${matchedSubsectionKey}`, chunk: { targetSection: chunk.targetSection, targetSubsection: chunk.targetSubsection, targetField: chunk.targetField, summary: chunk.summary } });
        continue;
      }

      const field = subsection.fields.find((f) => f.key === matchedFieldKey);
      if (!field) {
        droppedCount++;
        continue;
      }

      // Chunk passed all validations
      validChunks.push(chunk);
      validCount++;
    }

    console.log(`[extract] Validated ${validCount} chunks, dropped ${droppedCount} chunks`);
    if (droppedChunks.length > 0) {
      console.log('[extract] Dropped chunks:', JSON.stringify(droppedChunks, null, 2));
    }

    // Build extraction metadata
    const extractionMetadata: ExtractionMetadata = {
      firstPassChunkCount: firstPassExtraction.chunks.length,
      finalChunkCount: extraction.chunks.length,
      gapAnalysisApplied,
      changes,
    };

    return NextResponse.json({
      extractedChunks: validChunks,
      overallThemes: extraction.overallThemes,
      suggestedFollowUps: extraction.suggestedFollowUps,
      extractionMetadata,
      // Echo back original input for archive creation
      originalInput: transcript,
      sourceType,
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract information from transcript' }, { status: 500 });
  }
}
