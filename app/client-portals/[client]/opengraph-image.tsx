import { ImageResponse } from 'next/og';
import { getClient } from '@/lib/clients';

// Image metadata
export const runtime = 'edge';
export const alt = 'Client Portal';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Brand colors
const GOLD = '#d4a54a';
const BG_PRIMARY = '#0a0a0f';
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#888888';

export default async function Image({ params }: { params: { client: string } }) {
  const client = getClient(params.client);
  const clientName = client?.name || 'Client Portal';

  // Load fonts
  const instrumentSerifData = await fetch(
    new URL('https://fonts.gstatic.com/s/instrumentserif/v4/jizBRFtNs2ka5fXjeivQ4LroWlx-2zIZj1bIkNo.woff2')
  ).then((res) => res.arrayBuffer());

  const dmSansData = await fetch(
    new URL('https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZOIHTWEBlw.woff2')
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: BG_PRIMARY,
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* Background glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}20 0%, transparent 70%)`,
          }}
        />

        {/* Top section - 33 Strategies branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '42px',
              fontFamily: 'Instrument Serif',
              color: GOLD,
            }}
          >
            33
          </span>
          <span
            style={{
              fontSize: '14px',
              fontFamily: 'DM Sans',
              color: TEXT_MUTED,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Strategies
          </span>
        </div>

        {/* Middle section - Client name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'DM Sans',
              color: GOLD,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Client Portal
          </span>
          <span
            style={{
              fontSize: '72px',
              fontFamily: 'Instrument Serif',
              color: TEXT_PRIMARY,
              lineHeight: 1.1,
            }}
          >
            {clientName}
          </span>
        </div>

        {/* Bottom section - Domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: GOLD,
            }}
          />
          <span
            style={{
              fontSize: '18px',
              fontFamily: 'DM Sans',
              color: TEXT_MUTED,
            }}
          >
            33strategies.ai
          </span>
        </div>

        {/* Decorative line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD}50, transparent)`,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Instrument Serif',
          data: instrumentSerifData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: dmSansData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
