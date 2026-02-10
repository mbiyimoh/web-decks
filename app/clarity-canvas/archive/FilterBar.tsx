'use client';

import type { InputType } from '@prisma/client';
import type { InputSessionFilters } from '@/lib/input-session/types';
import { GOLD, TEXT_MUTED, BG_SURFACE } from '@/components/portal/design-tokens';
import { PROFILE_STRUCTURE } from '@/lib/clarity-canvas/profile-structure';

const PILLARS = Object.entries(PROFILE_STRUCTURE).map(([key, value]) => ({
  key,
  label: value.name,
}));

const INPUT_TYPES: { value: InputType; label: string }[] = [
  { value: 'VOICE_TRANSCRIPT', label: 'Voice' },
  { value: 'TEXT_INPUT', label: 'Text' },
  { value: 'FILE_UPLOAD', label: 'File' },
];

interface FilterBarProps {
  filters: InputSessionFilters;
  onChange: (filters: InputSessionFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const selectStyle = {
    background: BG_SURFACE,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: TEXT_MUTED,
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono uppercase" style={{ color: GOLD }}>
        Filter:
      </span>

      <select
        value={filters.inputType || ''}
        onChange={(e) =>
          onChange({
            ...filters,
            inputType: (e.target.value as InputType) || null,
          })
        }
        className="px-3 py-1.5 rounded border text-sm"
        style={selectStyle}
      >
        <option value="">All Types</option>
        {INPUT_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <select
        value={filters.pillar || ''}
        onChange={(e) =>
          onChange({
            ...filters,
            pillar: e.target.value || null,
          })
        }
        className="px-3 py-1.5 rounded border text-sm"
        style={selectStyle}
      >
        <option value="">All Pillars</option>
        {PILLARS.map((pillar) => (
          <option key={pillar.key} value={pillar.key}>
            {pillar.label}
          </option>
        ))}
      </select>
    </div>
  );
}
