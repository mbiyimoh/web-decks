import { ImageResponse } from 'next/og';
import { getStrategist } from '@/lib/strategists';

// Image metadata - using Node.js runtime because lib/strategists uses next/dynamic
export const alt = 'Strategist Portal - 33 Strategies';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Brand colors from 33 Strategies design system
const GOLD = '#d4a54a';
const BG_PRIMARY = '#0a0a0f';
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#888888';
const TEXT_DIM = '#555555';

// Load brand fonts
async function loadFonts() {
  const [instrumentSerifResponse, dmSansResponse, jetBrainsMonoResponse] = await Promise.all([
    fetch(new URL('https://fonts.gstatic.com/s/instrumentserif/v4/jizBRFtNs2ka5fXjeivQ4LroWlx-2zIZj1bIkNo.woff2')),
    fetch(new URL('https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.woff2')),
    fetch(new URL('https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2')),
  ]);

  const [instrumentSerifFont, dmSansFont, jetBrainsMonoFont] = await Promise.all([
    instrumentSerifResponse.arrayBuffer(),
    dmSansResponse.arrayBuffer(),
    jetBrainsMonoResponse.arrayBuffer(),
  ]);

  return { instrumentSerifFont, dmSansFont, jetBrainsMonoFont };
}

export default async function Image({ params }: { params: { strategist: string } }) {
  const strategist = getStrategist(params.strategist);
  const strategistName = strategist?.name || 'Strategist Portal';

  // Load fonts
  const { instrumentSerifFont, dmSansFont, jetBrainsMonoFont } = await loadFonts();

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
          overflow: 'hidden',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {/* Background glow effect - top right */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}15 0%, transparent 60%)`,
          }}
        />

        {/* Subtle bottom-left glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-200px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}08 0%, transparent 70%)`,
          }}
        />

        {/* Top section - 33 Strategies branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '48px',
              fontFamily: 'Instrument Serif, Georgia, serif',
              color: GOLD,
            }}
          >
            33
          </span>
          <span
            style={{
              fontSize: '20px',
              fontFamily: 'JetBrains Mono, monospace',
              color: TEXT_MUTED,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Strategies
          </span>
        </div>

        {/* Middle section - Strategist name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontFamily: 'JetBrains Mono, monospace',
              color: GOLD,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Strategist Portal
          </span>
          <span
            style={{
              fontSize: '120px',
              fontFamily: 'Instrument Serif, Georgia, serif',
              color: TEXT_PRIMARY,
              lineHeight: 1.0,
            }}
          >
            {strategistName}
          </span>
        </div>

        {/* Bottom section - Domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: GOLD,
            }}
          />
          <span
            style={{
              fontSize: '28px',
              fontFamily: 'DM Sans, sans-serif',
              color: TEXT_DIM,
            }}
          >
            33strategies.ai
          </span>
        </div>

        {/* Decorative gold line at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD}40, transparent)`,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Instrument Serif',
          data: instrumentSerifFont,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: dmSansFont,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'JetBrains Mono',
          data: jetBrainsMonoFont,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
