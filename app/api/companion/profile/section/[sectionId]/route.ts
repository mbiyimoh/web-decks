/**
 * GET /api/companion/profile/section/[sectionId]
 *
 * Returns a specific profile section in full detail.
 * Supports ETag caching via If-None-Match header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validateCompanionAuth,
  createAuthErrorResponse,
} from '@/lib/companion/middleware';
import { logAccess } from '@/lib/companion/logging';
import { getSectionVersion } from '@/lib/companion/cache';
import { estimateTokens } from '@/lib/companion/synthesis';
import type {
  SectionResponse,
  SectionDetail,
  SubsectionDetail,
  FieldDetail,
} from '@/lib/companion/types';

interface RouteParams {
  params: Promise<{ sectionId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { sectionId } = await params;
  const endpoint = `/api/companion/profile/section/${sectionId}`;

  // Validate auth
  const auth = await validateCompanionAuth(
    request,
    '/api/companion/profile/section'
  );
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Check If-None-Match header
  const ifNoneMatch = request.headers.get('if-none-match');
  const currentVersion = await getSectionVersion(auth.userId, sectionId);

  if (currentVersion && ifNoneMatch === `"${currentVersion}"`) {
    logAccess({
      userId: auth.userId,
      productId: auth.clientId,
      endpoint,
      section: sectionId,
      tokenCount: 0,
      cacheHit: true,
      latencyMs: Date.now() - startTime,
    });

    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: `"${currentVersion}"`,
        'Cache-Control': 'private, max-age=1800',
      },
    });
  }

  // Fetch profile with specific section
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [{ userId: auth.userId }, { userRecordId: auth.userId }],
    },
    include: {
      sections: {
        where: { key: sectionId },
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

  if (!profile || profile.sections.length === 0) {
    return NextResponse.json(
      { error: `Section '${sectionId}' not found` },
      { status: 404 }
    );
  }

  const dbSection = profile.sections[0];

  // Build section detail
  const subsections: SubsectionDetail[] = dbSection.subsections.map((sub) => ({
    id: sub.key,
    title: sub.name,
    fields: sub.fields.map(
      (field) =>
        ({
          key: field.key,
          summary: field.summary,
          fullContext: field.fullContext,
          confidence: field.confidence,
          lastUpdated: field.lastUpdated.toISOString(),
        }) as FieldDetail
    ),
  }));

  const section: SectionDetail = {
    id: dbSection.key,
    title: dbSection.name,
    subsections,
  };

  // Calculate token count
  const tokenCount = estimateTokens(JSON.stringify(section));

  // Determine cache hint based on completeness
  const filledFields = subsections.reduce(
    (sum, sub) =>
      sum + sub.fields.filter((f) => f.summary || f.fullContext).length,
    0
  );
  const totalFields = subsections.reduce(
    (sum, sub) => sum + sub.fields.length,
    0
  );
  const completeness = totalFields > 0 ? filledFields / totalFields : 0;

  const response: SectionResponse = {
    section,
    tokenCount,
    version: currentVersion || `${sectionId}-v0`,
    cacheHint: completeness > 0.8 ? 'stable' : 'volatile',
  };

  const latencyMs = Date.now() - startTime;

  // Log access (fire-and-forget)
  logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    section: sectionId,
    tokenCount,
    cacheHit: false,
    latencyMs,
  });

  return NextResponse.json(response, {
    headers: {
      ETag: `"${response.version}"`,
      'Cache-Control': 'private, max-age=1800',
    },
  });
}
