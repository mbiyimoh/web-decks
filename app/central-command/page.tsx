import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getSessionOptions, SessionData, isSessionValidForCentralCommand } from '@/lib/session';
import { getProspects, getTeamCapacity } from '@/lib/central-command/queries';
import PasswordGate from '@/components/portal/PasswordGate';
import CentralCommandClient from './CentralCommandClient';

export default async function CentralCommandPage() {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());

  // If not authenticated, show password gate
  if (!isSessionValidForCentralCommand(session)) {
    return (
      <PasswordGate
        portalType="central-command"
        clientId="central-command"
        clientName="Central Command"
      />
    );
  }

  // Fetch data in parallel
  const [prospects, team] = await Promise.all([getProspects(), getTeamCapacity()]);

  return <CentralCommandClient prospects={prospects} team={team} />;
}
