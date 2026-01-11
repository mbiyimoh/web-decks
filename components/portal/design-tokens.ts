// ============================================================================
// PORTAL DESIGN TOKENS
// ============================================================================

// Primary accent colors (canonical values from CLAUDE.md design system)
export const GOLD = '#d4a54a';
export const GOLD_DIM = 'rgba(212, 165, 74, 0.15)';
export const GREEN = '#4ade80';
export const GREEN_DIM = 'rgba(74, 222, 128, 0.15)';
export const BLUE = '#60a5fa';
export const BLUE_DIM = 'rgba(96, 165, 250, 0.15)';
export const RED = '#f87171';
export const RED_DIM = 'rgba(248, 113, 113, 0.15)';

// Background colors (canonical values from CLAUDE.md design system)
export const BG_PRIMARY = '#0a0a0f';
export const BG_SURFACE = '#111114';
export const BG_ELEVATED = '#0d0d14';

// Status colors
export const STATUS_COLORS = {
  'on-track': { color: GREEN, bg: GREEN_DIM, label: 'ON TRACK' },
  'ahead': { color: BLUE, bg: BLUE_DIM, label: 'AHEAD' },
  'attention': { color: RED, bg: RED_DIM, label: 'NEEDS ATTENTION' },
} as const;

// Track colors
export const TRACK_COLORS = {
  gold: GOLD,
  green: GREEN,
} as const;
