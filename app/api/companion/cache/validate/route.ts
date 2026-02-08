/**
 * POST /api/companion/cache/validate
 *
 * Check if cached synthesis and sections are still valid.
 * Returns staleness status for each cached version.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateCompanionAuth,
  createAuthErrorResponse,
} from '@/lib/companion/middleware';
import { isSynthesisStale, getSectionVersion } from '@/lib/companion/cache';
import type {
  CacheValidateRequest,
  CacheValidateResponse,
} from '@/lib/companion/types';

export async function POST(request: NextRequest) {
  const endpoint = '/api/companion/cache/validate';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Parse request body
  let body: CacheValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { cachedVersion, sections = {} } = body;

  // Check synthesis staleness
  const { stale: synthesisStale, currentVersion: currentSynthesisVersion } =
    await isSynthesisStale(auth.userId, cachedVersion);

  // Check section staleness
  const sectionsStale: Record<string, boolean> = {};
  const currentVersions: { synthesis: string; [sectionId: string]: string } = {
    synthesis: currentSynthesisVersion,
  };

  for (const [sectionId, cachedSectionVersion] of Object.entries(sections)) {
    const currentSectionVersion = await getSectionVersion(
      auth.userId,
      sectionId
    );

    if (currentSectionVersion) {
      sectionsStale[sectionId] = cachedSectionVersion !== currentSectionVersion;
      currentVersions[sectionId] = currentSectionVersion;
    } else {
      sectionsStale[sectionId] = true;
      currentVersions[sectionId] = '';
    }
  }

  const response: CacheValidateResponse = {
    synthesisStale,
    sectionsStale,
    currentVersions,
  };

  return NextResponse.json(response);
}
