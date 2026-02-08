'use client';

import { TeamCapacity } from '@prisma/client';
import { BG_SURFACE, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM, GOLD, GREEN, RED } from '@/components/portal/design-tokens';

interface TeamCapacityProps {
  members: TeamCapacity[];
}

interface TeamAllocation {
  client: string;
  percent: number;
}

export default function TeamCapacitySection({ members }: TeamCapacityProps) {
  // Determine utilization bar color
  const getUtilizationColor = (utilization: number): string => {
    if (utilization < 50) return GREEN;
    if (utilization <= 80) return GOLD;
    return RED;
  };

  return (
    <div>
      {/* Section Header */}
      <div className="mb-4">
        <p
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{ color: GOLD }}
        >
          4 — TEAM CAPACITY
        </p>
      </div>

      {/* Team Grid */}
      {members.length === 0 ? (
        <p className="text-sm font-body" style={{ color: TEXT_MUTED }}>
          No team members configured
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {members.map((member) => {
            // Parse allocations
            let allocations: TeamAllocation[] = [];
            try {
              if (member.allocations) {
                allocations = JSON.parse(member.allocations as string) as TeamAllocation[];
              }
            } catch (error) {
              console.error('Failed to parse allocations for', member.name, error);
            }

            const utilizationColor = getUtilizationColor(member.utilization);

            return (
              <div
                key={member.id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: BG_SURFACE }}
              >
                {/* Color Accent Bar */}
                <div
                  className="h-1"
                  style={{ backgroundColor: member.color }}
                />

                {/* Card Content */}
                <div className="p-4">
                  {/* Name */}
                  <h3
                    className="text-lg font-display mb-1"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {member.name}
                  </h3>

                  {/* Role */}
                  <p className="text-sm font-body mb-3" style={{ color: TEXT_MUTED }}>
                    {member.role}
                  </p>

                  {/* Utilization Bar Container */}
                  <div className="mb-2">
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      {/* Utilization Fill */}
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(member.utilization, 100)}%`,
                          backgroundColor: utilizationColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Utilization Text */}
                  <p className="text-xs font-body mb-3" style={{ color: TEXT_MUTED }}>
                    {member.utilization}% utilized
                  </p>

                  {/* Allocations List */}
                  {allocations.length > 0 && (
                    <div className="space-y-1">
                      {allocations.map((allocation, index) => (
                        <div
                          key={index}
                          className="text-xs font-mono"
                          style={{ color: TEXT_DIM }}
                        >
                          {allocation.client}: {allocation.percent}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
