'use client';

import { ProspectWithRecord } from '@/lib/central-command/types';
import { formatCurrency, calculatePriority } from '@/lib/central-command/utils';
import {
  SCORE_KEYS,
  SCORE_LABELS,
  getScoreColor,
} from '@/lib/central-command/score-display';
import {
  BG_SURFACE,
  GOLD,
  GREEN,
  RED,
  BLUE,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/components/portal/design-tokens';
import type { PipelineRecord } from '@prisma/client';

// Map score key to PipelineRecord field name
const SCORE_FIELD_MAP: Record<string, keyof PipelineRecord> = {
  strategic: 'scoreStrategic',
  value: 'scoreValue',
  readiness: 'scoreReadiness',
  timeline: 'scoreTimeline',
  bandwidth: 'scoreBandwidth',
};

interface FunnelTableProps {
  clients: ProspectWithRecord[];
  onSelectClient: (id: string) => void;
}

export default function FunnelTable({
  clients,
  onSelectClient,
}: FunnelTableProps) {
  // Decision stoplight color
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'yes':
        return GREEN;
      case 'no':
        return RED;
      case 'pending':
      default:
        return GOLD;
    }
  };

  if (clients.length === 0) {
    return (
      <div>
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase mb-4"
          style={{ color: GOLD }}
        >
          2 — TOP OF FUNNEL
        </p>
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: BG_SURFACE }}
        >
          <p style={{ color: TEXT_MUTED }}>No prospects in funnel yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p
        className="text-xs font-mono tracking-[0.2em] uppercase mb-4"
        style={{ color: GOLD }}
      >
        2 — TOP OF FUNNEL
      </p>
      <div
        className="rounded-lg overflow-hidden overflow-x-auto"
        style={{ backgroundColor: BG_SURFACE }}
      >
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Client
              </th>
              {/* 5 Score Columns */}
              {SCORE_KEYS.map((key) => (
                <th
                  key={key}
                  className="text-center px-2 py-3 text-xs font-mono uppercase"
                  style={{ color: TEXT_MUTED }}
                  title={SCORE_LABELS[key].long}
                >
                  {SCORE_LABELS[key].short}
                </th>
              ))}
              <th
                className="text-center px-2 py-3 text-xs font-mono uppercase"
                style={{ color: BLUE }}
                title="Combined Priority Score"
              >
                PRI
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Decision
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              if (!client.pipelineRecord) return null;

              const record = client.pipelineRecord;

              // Use PipelineRecord scores (consistent with PipelineTable)
              const priority = calculatePriority({
                strategic: record.scoreStrategic,
                value: record.scoreValue,
                readiness: record.scoreReadiness,
                timeline: record.scoreTimeline,
                bandwidth: record.scoreBandwidth,
              });

              return (
                <tr
                  key={client.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onClick={() => onSelectClient(client.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Client */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: client.color || GOLD }}
                      />
                      <span
                        className="truncate max-w-[180px]"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        {client.name}
                      </span>
                      {record.isNew && (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase"
                          style={{
                            color: GOLD,
                            border: `1px solid ${GOLD}`,
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5 Score Columns */}
                  {SCORE_KEYS.map((key) => {
                    const fieldName = SCORE_FIELD_MAP[key];
                    const score = record[fieldName] as number;
                    return (
                      <td
                        key={key}
                        className="px-2 py-3 text-center font-mono text-sm"
                        style={{ color: getScoreColor(score) }}
                      >
                        {score}
                      </td>
                    );
                  })}

                  {/* Priority Score (combined) */}
                  <td
                    className="px-2 py-3 text-center font-mono text-sm font-medium"
                    style={{ color: BLUE }}
                  >
                    {priority.toFixed(1)}
                  </td>

                  {/* Decision - inline stoplight dot */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getDecisionColor(record.decision),
                        }}
                        title={record.decision}
                      />
                    </div>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3" style={{ color: TEXT_PRIMARY }}>
                    {record.potentialValue
                      ? formatCurrency(record.potentialValue)
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
