import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        gold: {
          DEFAULT: '#d4a54a',
          glow: 'rgba(212,165,74,0.3)',
        },
        brand: {
          bg: '#0a0a0f',
          elevated: '#0d0d14',
        },
      },
    },
  },
  plugins: [],
};

export default config;
