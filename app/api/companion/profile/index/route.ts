/**
 * GET /api/companion/profile/index
 *
 * Returns lightweight metadata about all profile sections (~200 tokens).
 * Includes section titles, token counts, and last updated dates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validateCompanionAuth,
  createAuthErrorResponse,
} from '@/lib/companion/middleware';
import { logAccess } from '@/lib/companion/logging';
import { estimateTokens, generateVersion } from '@/lib/companion/synthesis';
import type { SectionMetadata, ProfileIndexResponse } from '@/lib/companion/types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/companion/profile/index';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Fetch profile with sections
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [{ userId: auth.userId }, { userRecordId: auth.userId }],
    },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            orderBy: { order: 'asc' },
            include: {
              fields: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: 'No profile found for user' },
      { status: 404 }
    );
  }

  // Build section metadata
  const sections: SectionMetadata[] = profile.sections.map((section) => {
    // Calculate token count for section
    let sectionText = section.name + ' ';
    let filledFields = 0;
    let totalFields = 0;

    for (const subsection of section.subsections) {
      sectionText += subsection.name + ' ';
      for (const field of subsection.fields) {
        totalFields++;
        if (field.summary || field.fullContext) {
          filledFields++;
          sectionText += (field.summary || '') + ' ';
          sectionText += (field.fullContext || '') + ' ';
        }
      }
    }

    const tokenCount = estimateTokens(sectionText);
    const completeness =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    // Find most recent update from fields
    let lastUpdated = profile.updatedAt;
    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        if (field.lastUpdated && field.lastUpdated > lastUpdated) {
          lastUpdated = field.lastUpdated;
        }
      }
    }

    return {
      id: section.key,
      title: section.name,
      subsections: section.subsections.map((sub) => sub.key),
      tokenCount,
      lastUpdated: lastUpdated.toISOString(),
      cacheHint: completeness > 80 ? 'stable' : 'volatile',
      completeness,
    };
  });

  // Calculate total tokens
  const totalTokens = sections.reduce((sum, s) => sum + s.tokenCount, 0);

  const response: ProfileIndexResponse = {
    sections,
    totalTokens,
    version: generateVersion(),
  };

  const latencyMs = Date.now() - startTime;
  const responseTokens = estimateTokens(JSON.stringify(response));

  // Log access (fire-and-forget)
  logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    tokenCount: responseTokens,
    cacheHit: false,
    latencyMs,
  });

  return NextResponse.json(response);
}
