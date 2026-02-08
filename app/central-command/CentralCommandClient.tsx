'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TeamCapacity } from '@prisma/client';
import { ProspectsData, ProspectWithRecord } from '@/lib/central-command/types';
import { BG_PRIMARY } from '@/components/portal/design-tokens';

import DashboardHeader from './components/DashboardHeader';
import PipelineTable from './components/PipelineTable';
import FunnelTable from './components/FunnelTable';
import ClosedDeals from './components/ClosedDeals';
import TeamCapacitySection from './components/TeamCapacity';
import IntakeModal from './components/IntakeModal';
import ClientDetailModal from './components/ClientDetailModal';

interface CentralCommandClientProps {
  prospects: ProspectsData;
  team: TeamCapacity[];
}

export default function CentralCommandClient({ prospects, team }: CentralCommandClientProps) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  // Find the selected prospect across all lists
  const selectedProspect: ProspectWithRecord | null = selectedClientId
    ? [...prospects.intentClients, ...prospects.funnelClients, ...prospects.closedDeals]
        .find((c) => c.id === selectedClientId) ?? null
    : null;

  const handleProspectCreated = useCallback(() => {
    setShowIntakeModal(false);
    router.refresh();
  }, [router]);

  const handleUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div
      className="min-h-screen"
      style={{ background: BG_PRIMARY }}
    >
      {/* Dashboard Header */}
      <DashboardHeader
        stats={prospects.stats}
        onNewProspect={() => setShowIntakeModal(true)}
      />

      {/* Page Container */}
      <div className="max-w-[1800px] mx-auto px-8 py-12 space-y-16">
        {/* Section 1: Intent → Money Pipeline */}
        <section>
          <PipelineTable
            clients={prospects.intentClients}
            onSelectClient={setSelectedClientId}
          />
        </section>

        {/* Section 2: Top of Funnel */}
        <section>
          <FunnelTable
            clients={prospects.funnelClients}
            onSelectClient={setSelectedClientId}
          />
        </section>

        {/* Section 3: Closed / Lost */}
        <section>
          <ClosedDeals deals={prospects.closedDeals} />
        </section>

        {/* Section 4: Team Capacity */}
        <section>
          <TeamCapacitySection members={team} />
        </section>
      </div>

      {/* Modals */}
      <IntakeModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        onProspectCreated={handleProspectCreated}
      />

      <ClientDetailModal
        prospect={selectedProspect}
        isOpen={selectedClientId !== null}
        onClose={() => setSelectedClientId(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
