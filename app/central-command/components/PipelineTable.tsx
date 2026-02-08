'use client';

import { ProspectWithRecord } from '@/lib/central-command/types';
import { formatCurrency, calculatePriority } from '@/lib/central-command/utils';
import {
  BG_SURFACE,
  GOLD,
  GREEN,
  RED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import StageDots from './StageDots';

interface PipelineTableProps {
  clients: ProspectWithRecord[];
  onSelectClient: (id: string) => void;
}

export default function PipelineTable({
  clients,
  onSelectClient,
}: PipelineTableProps) {
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return GREEN;
      case 'paused':
        return GOLD;
      case 'at-risk':
        return RED;
      default:
        return TEXT_DIM;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'paused':
        return 'PAUSED';
      case 'at-risk':
        return 'AT RISK';
      default:
        return status.toUpperCase();
    }
  };

  if (clients.length === 0) {
    return (
      <div>
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase mb-4"
          style={{ color: GOLD }}
        >
          1 — INTENT → MONEY
        </p>
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: BG_SURFACE }}
        >
          <p style={{ color: TEXT_MUTED }}>No active pipeline clients</p>
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
        1 — INTENT → MONEY
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
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Stage
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Value
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Score
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Days
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Next Action
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-mono uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              if (!client.pipelineRecord) return null;

              const record = client.pipelineRecord;
              const priority = calculatePriority({
                strategic: record.scoreStrategic,
                value: record.scoreValue,
                readiness: record.scoreReadiness,
                timeline: record.scoreTimeline,
                bandwidth: record.scoreBandwidth,
              });
              const daysInStage = Math.floor(
                (Date.now() - new Date(record.stageEnteredAt).getTime()) /
                  86400000
              );

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
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="px-4 py-3">
                    <StageDots currentIndex={record.stageIndex} />
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3" style={{ color: TEXT_PRIMARY }}>
                    {record.value !== null ? formatCurrency(record.value) : '—'}
                  </td>

                  {/* Score */}
                  <td
                    className="px-4 py-3 font-mono"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {priority.toFixed(1)}
                  </td>

                  {/* Days */}
                  <td
                    className="px-4 py-3 font-mono"
                    style={{ color: TEXT_MUTED }}
                  >
                    {daysInStage}
                  </td>

                  {/* Next Action */}
                  <td className="px-4 py-3">
                    <span
                      className="truncate max-w-[250px] block"
                      style={{ color: TEXT_MUTED }}
                    >
                      {record.nextAction || '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-mono uppercase"
                      style={{
                        color: getStatusColor(record.clientStatus),
                        backgroundColor: `${getStatusColor(record.clientStatus)}15`,
                      }}
                    >
                      {getStatusLabel(record.clientStatus)}
                    </span>
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
