import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClient, getClientContent } from '@/lib/clients';

export const runtime = 'nodejs';

const size = { width: 1200, height: 630 };

/**
 * GET /api/og/share?slug=...
 *
 * Generates dynamic OG images for share links.
 * The slug is passed as a query parameter (URL-encoded if it contains slashes).
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');

  if (!slug) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0a0a0f',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#888', fontSize: 32 }}>Invalid Request</div>
        </div>
      ),
      size
    );
  }

  const link = await prisma.artifactShareLink.findUnique({
    where: { slug },
  });

  if (!link) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0a0a0f',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#888', fontSize: 32 }}>Content Not Found</div>
        </div>
      ),
      size
    );
  }

  const client = getClient(link.clientId);
  const content = client ? getClientContent(link.clientId, link.artifactSlug) : null;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #111114 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Lock icon circle */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            background: 'rgba(212, 165, 74, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4a54a" strokeWidth="1.5">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Client name */}
        <div style={{ color: '#d4a54a', fontSize: 18, marginBottom: 16, letterSpacing: '0.2em' }}>
          {client?.name?.toUpperCase() || 'SHARED CONTENT'}
        </div>

        {/* Artifact title */}
        <div
          style={{
            color: '#f5f5f5',
            fontSize: 48,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          {content?.title || 'Protected Content'}
        </div>

        {/* Password required notice */}
        <div style={{ color: '#888', fontSize: 20 }}>
          Password required to view
        </div>

        {/* 33 Strategies branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#d4a54a', fontSize: 24 }}>33</span>
          <span style={{ color: '#555', fontSize: 16 }}>Strategies</span>
        </div>
      </div>
    ),
    size
  );
}
