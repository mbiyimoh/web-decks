'use client';

import { useState } from 'react';
import { ProspectWithRecord } from '@/lib/central-command/types';
import { STAGES, formatCurrency } from '@/lib/central-command/utils';
import { BG_SURFACE, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM, GOLD } from '@/components/portal/design-tokens';

interface ClosedDealsProps {
  deals: ProspectWithRecord[];
}

export default function ClosedDeals({ deals }: ClosedDealsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDealIds, setExpandedDealIds] = useState<Set<string>>(new Set());

  const toggleDeal = (dealId: string) => {
    setExpandedDealIds((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.add(dealId);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{ color: GOLD }}
        >
          3 — CLOSED / LOST
        </p>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono"
          style={{ color: TEXT_DIM }}
        >
          {isExpanded ? '[Hide Details ▲]' : '[Show Details ▼]'}
        </button>
      </div>

      {/* Deals List */}
      {isExpanded && (
        <div className="space-y-2">
          {deals.length === 0 ? (
            <p className="text-sm font-body" style={{ color: TEXT_MUTED }}>
              No closed deals
            </p>
          ) : (
            deals.map((deal) => {
              const record = deal.pipelineRecord;
              const isDealExpanded = expandedDealIds.has(deal.id);
              const stageReached = record?.stageIndex !== undefined && record.stageIndex !== null
                ? STAGES[record.stageIndex]
                : null;

              return (
                <div
                  key={deal.id}
                  className="rounded-lg p-4"
                  style={{ backgroundColor: BG_SURFACE }}
                >
                  {/* Deal Header */}
                  <div className="flex items-start gap-3 mb-2">
                    {/* Color Dot */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: deal.color }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Name & Industry */}
                      <h3
                        className="text-lg font-display mb-1"
                        style={{ color: TEXT_PRIMARY }}
                      >
                        {deal.name}
                      </h3>
                      <p className="text-sm font-body mb-2" style={{ color: TEXT_MUTED }}>
                        {deal.industry}
                      </p>

                      {/* Value & Stage Reached */}
                      <div className="flex flex-wrap gap-4 text-sm font-body mb-2">
                        {record?.value && (
                          <div>
                            <span style={{ color: TEXT_DIM }}>Value: </span>
                            <span style={{ color: TEXT_MUTED }}>
                              {formatCurrency(record.value)}
                            </span>
                          </div>
                        )}
                        {stageReached && (
                          <div>
                            <span style={{ color: TEXT_DIM }}>Stage Reached: </span>
                            <span style={{ color: TEXT_MUTED }}>
                              {stageReached.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Close Info */}
                      {record?.closedReason && (
                        <div className="text-sm font-body mb-1">
                          <span style={{ color: TEXT_DIM }}>Reason: </span>
                          <span style={{ color: TEXT_MUTED }}>
                            {record.closedReason}
                          </span>
                        </div>
                      )}
                      {record?.closedAt && (
                        <div className="text-sm font-body">
                          <span style={{ color: TEXT_DIM }}>Closed: </span>
                          <span style={{ color: TEXT_MUTED }}>
                            {new Date(record.closedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}

                      {/* Expandable Lessons Learned */}
                      {record?.lessonsLearned && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleDeal(deal.id)}
                            className="text-xs font-mono"
                            style={{ color: GOLD }}
                          >
                            {isDealExpanded ? '[Hide Lessons ▲]' : '[Show Lessons ▼]'}
                          </button>
                          {isDealExpanded && (
                            <div
                              className="mt-2 text-sm font-body whitespace-pre-wrap"
                              style={{ color: TEXT_MUTED }}
                            >
                              {record.lessonsLearned}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
