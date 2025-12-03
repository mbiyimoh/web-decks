import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, SessionData } from '@/lib/session';
import TradeblockDeck from '@/components/TradeblockDeck';

export default async function Home() {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return <TradeblockDeck />;
}
