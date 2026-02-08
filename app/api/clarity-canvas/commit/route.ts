import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { buildKeyLookups, fuzzyMatchKey, CONTEXT_DELIMITER } from '@/lib/clarity-canvas/key-matching';
import { calculateAllScores } from '@/lib/clarity-canvas/scoring';
import { invalidateSynthesis } from '@/lib/companion/cache';
import { SourceType } from '@prisma/client';
import type {
  ProfileWithSections,
  CommitRecommendationsRequest,
  CommitRecommendationsResponse
} from '@/lib/clarity-canvas/types';

/**
 * POST /api/clarity-canvas/commit
 *
 * Commits approved recommendations to the user's clarity profile.
 * This endpoint is called after the user reviews and approves recommendations
 * from the extract-only brain dump flow.
 *
 * Request Body: CommitRecommendationsRequest
 * Response: CommitRecommendationsResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CommitRecommendationsResponse | { error: string }>> {
  // 1. Authenticate user
  const user = await ensureUserFromUnifiedSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse request body
    const body = (await request.json()) as CommitRecommendationsRequest;

    if (!body.recommendations || body.recommendations.length === 0) {
      return NextResponse.json(
        { error: 'No recommendations provided' },
        { status: 400 }
      );
    }

    console.log(`[commit] Processing ${body.recommendations.length} recommendations for user ${user.id}`);

    // 3. Fetch user's profile with full nested includes
    const profile = await prisma.clarityProfile.findFirst({
      where: { userRecordId: user.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
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

    // 4. Return 404 if no profile
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // 5. Capture pre-commit scores for celebration delta
    const typedProfileBefore = profile as ProfileWithSections;
    const previousScores = calculateAllScores(typedProfileBefore.sections);

    // 6. Build key lookups for fuzzy matching
    const { sectionKeys, subsectionKeys, fieldKeys } = buildKeyLookups();

    let savedCount = 0;
    let droppedCount = 0;
    const droppedChunks: {
      reason: string;
      chunk: {
        targetSection: string;
        targetSubsection: string;
        targetField: string;
        summary: string;
      }
    }[] = [];

    // 7. Process recommendations in parallel
    const commitPromises = body.recommendations.map(async (rec) => {
      // Fuzzy-match section key
      const matchedSectionKey = fuzzyMatchKey(rec.targetSection, sectionKeys);
      if (!matchedSectionKey) {
        droppedCount++;
        droppedChunks.push({
          reason: `Unknown section: "${rec.targetSection}"`,
          chunk: {
            targetSection: rec.targetSection,
            targetSubsection: rec.targetSubsection,
            targetField: rec.targetField,
            summary: rec.summary
          }
        });
        return null;
      }

      const section = profile.sections.find((s) => s.key === matchedSectionKey);
      if (!section) {
        droppedCount++;
        droppedChunks.push({
          reason: `Section not in profile: "${matchedSectionKey}"`,
          chunk: {
            targetSection: rec.targetSection,
            targetSubsection: rec.targetSubsection,
            targetField: rec.targetField,
            summary: rec.summary
          }
        });
        return null;
      }

      // Fuzzy-match subsection key
      const validSubsections = subsectionKeys.get(matchedSectionKey);
      const matchedSubsectionKey = validSubsections
        ? fuzzyMatchKey(rec.targetSubsection, validSubsections)
        : null;
      if (!matchedSubsectionKey) {
        droppedCount++;
        droppedChunks.push({
          reason: `Unknown subsection: "${rec.targetSubsection}" in section "${matchedSectionKey}"`,
          chunk: {
            targetSection: rec.targetSection,
            targetSubsection: rec.targetSubsection,
            targetField: rec.targetField,
            summary: rec.summary
          }
        });
        return null;
      }

      const subsection = section.subsections.find((ss) => ss.key === matchedSubsectionKey);
      if (!subsection) {
        droppedCount++;
        droppedChunks.push({
          reason: `Subsection not in section: "${matchedSubsectionKey}" in "${matchedSectionKey}"`,
          chunk: {
            targetSection: rec.targetSection,
            targetSubsection: rec.targetSubsection,
            targetField: rec.targetField,
            summary: rec.summary
          }
        });
        return null;
      }

      // Fuzzy-match field key
      const compositeKey = `${matchedSectionKey}.${matchedSubsectionKey}`;
      const validFields = fieldKeys.get(compositeKey);
      const matchedFieldKey = validFields
        ? fuzzyMatchKey(rec.targetField, validFields)
        : null;
      if (!matchedFieldKey) {
        droppedCount++;
        droppedChunks.push({
          reason: `Unknown field: "${rec.targetField}" in ${matchedSectionKey}.${matchedSubsectionKey}`,
          chunk: {
            targetSection: rec.targetSection,
            targetSubsection: rec.targetSubsection,
            targetField: rec.targetField,
            summary: rec.summary
          }
        });
        return null;
      }

      const field = subsection.fields.find((f) => f.key === matchedFieldKey);
      if (!field) {
        droppedCount++;
        droppedChunks.push({
          reason: `Field not in subsection: "${matchedFieldKey}" in ${matchedSectionKey}.${matchedSubsectionKey}`,
          chunk: {
            targetSection: rec.targetSection,
            targetSubsection: rec.targetSubsection,
            targetField: rec.targetField,
            summary: rec.summary
          }
        });
        return null;
      }

      // Update field with new content
      const existingContext = field.fullContext || '';
      const newContext = existingContext
        ? `${existingContext}${CONTEXT_DELIMITER}${rec.content}`
        : rec.content;

      // Create source record and update field in parallel
      await Promise.all([
        prisma.fieldSource.create({
          data: {
            fieldId: field.id,
            type: rec.sourceType === 'VOICE' ? SourceType.VOICE : SourceType.TEXT,
            rawContent: rec.content,
            userConfidence: rec.confidence,
          },
        }),
        prisma.profileField.update({
          where: { id: field.id },
          data: {
            summary: rec.summary,
            fullContext: newContext,
            confidence: rec.confidence,
          },
        }),
      ]);

      savedCount++;
      return rec;
    });

    await Promise.all(commitPromises);

    console.log(`[commit] Saved ${savedCount} recommendations, dropped ${droppedCount}`);
    if (droppedChunks.length > 0) {
      console.log('[commit] Dropped chunks:', JSON.stringify(droppedChunks, null, 2));
    }

    // 8. Re-fetch profile with same includes after all writes
    const updatedProfile = await prisma.clarityProfile.findFirst({
      where: { userRecordId: user.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            subsections: {
              orderBy: { order: 'asc' },
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

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    // 9. Calculate scores
    const typedProfile = updatedProfile as ProfileWithSections;
    const scores = calculateAllScores(typedProfile.sections);

    // 10. Invalidate Companion API cache (fire-and-forget)
    invalidateSynthesis(user.id).catch((err) =>
      console.error('[commit] Companion cache invalidation failed:', err)
    );

    // 11. Return response
    return NextResponse.json({
      updatedProfile: typedProfile,
      scores,
      previousScores,
      savedCount,
      droppedCount,
    });
  } catch (error) {
    console.error('[commit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to commit recommendations' },
      { status: 500 }
    );
  }
}
