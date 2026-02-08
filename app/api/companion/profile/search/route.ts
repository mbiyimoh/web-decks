/**
 * POST /api/companion/profile/search
 *
 * Search across the user's profile using text matching.
 * V1: Simple text-based search with relevance scoring.
 * V2 (future): Semantic search with embeddings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validateCompanionAuth,
  createAuthErrorResponse,
} from '@/lib/companion/middleware';
import { logAccess } from '@/lib/companion/logging';
import { estimateTokens } from '@/lib/companion/synthesis';
import type {
  SearchRequest,
  SearchResponse,
  SearchResult,
} from '@/lib/companion/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/companion/profile/search';

  // Validate auth
  const auth = await validateCompanionAuth(request, endpoint);
  if (!auth.success) {
    return createAuthErrorResponse(auth);
  }

  // Parse request body
  let body: SearchRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, maxResults = 5, sections: sectionFilter } = body;

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // Validate query length and term count to prevent abuse
  if (query.length > 200) {
    return NextResponse.json(
      { error: 'Query too long (max 200 characters)' },
      { status: 400 }
    );
  }

  // Fetch profile
  const profile = await prisma.clarityProfile.findFirst({
    where: {
      OR: [{ userId: auth.userId }, { userRecordId: auth.userId }],
    },
    include: {
      sections: {
        include: {
          subsections: {
            include: {
              fields: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: 'No profile found' }, { status: 404 });
  }

  // Perform text-based search
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean).slice(0, 20); // Max 20 terms

  if (queryTerms.length === 0) {
    return NextResponse.json(
      { error: 'Query must contain at least one term' },
      { status: 400 }
    );
  }

  for (const section of profile.sections) {
    // Apply section filter if provided
    if (sectionFilter && sectionFilter.length > 0) {
      if (!sectionFilter.includes(section.key)) {
        continue;
      }
    }

    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        const content = [
          field.key,
          field.name,
          field.summary || '',
          field.fullContext || '',
        ]
          .join(' ')
          .toLowerCase();

        // Calculate relevance score based on term matches
        let matchedTerms = 0;
        for (const term of queryTerms) {
          if (content.includes(term)) {
            matchedTerms++;
          }
        }

        if (matchedTerms > 0) {
          const relevance = matchedTerms / queryTerms.length;

          // Create snippet from matching content
          const snippet = field.fullContext || field.summary || field.name;
          const tokenCount = estimateTokens(snippet);

          results.push({
            section: section.key,
            subsection: subsection.key,
            field: field.key,
            snippet: snippet.slice(0, 300), // Limit snippet length
            relevance: Math.round(relevance * 100) / 100,
            tokenCount,
          });
        }
      }
    }
  }

  // Sort by relevance and limit results
  results.sort((a, b) => b.relevance - a.relevance);
  const limitedResults = results.slice(0, maxResults);

  const totalTokens = limitedResults.reduce((sum, r) => sum + r.tokenCount, 0);

  const response: SearchResponse = {
    results: limitedResults,
    totalTokens,
    query,
  };

  const latencyMs = Date.now() - startTime;

  // Log access (fire-and-forget)
  logAccess({
    userId: auth.userId,
    productId: auth.clientId,
    endpoint,
    tokenCount: totalTokens,
    cacheHit: false,
    latencyMs,
  });

  return NextResponse.json(response);
}
