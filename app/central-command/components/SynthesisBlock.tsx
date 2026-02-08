'use client';

import { TEXT_PRIMARY, TEXT_DIM } from '@/components/portal/design-tokens';

interface SynthesisBlockProps {
  label: string;
  content: string | null | undefined;
  color?: string;
}

export default function SynthesisBlock({ label, content, color }: SynthesisBlockProps) {
  if (!content) return null;

  return (
    <div>
      <p
        className="text-xs font-mono tracking-[0.2em] uppercase mb-2"
        style={{ color: color || TEXT_DIM }}
      >
        {label}
      </p>
      <p
        className="text-sm leading-relaxed font-body"
        style={{ color: TEXT_PRIMARY, whiteSpace: 'pre-wrap' }}
      >
        {content}
      </p>
    </div>
  );
}
