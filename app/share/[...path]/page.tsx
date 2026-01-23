import { Metadata } from 'next';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getShareLinkSessionOptions, ShareLinkSessionData, isShareSessionValid } from '@/lib/session';
import { getClient, getClientContent } from '@/lib/clients';
import SharePasswordGate from '@/components/share/SharePasswordGate';

/**
 * Reconstruct slug from path segments
 * Path: ["tradeblock-artifacts", "the-120-day-sprint", "x7k9m2p3"]
 * Slug: "tradeblock-artifacts/the-120-day-sprint/x7k9m2p3"
 */
function pathToSlug(path: string[]): string {
  return path.join('/');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string[] }>;
}): Promise<Metadata> {
  const { path } = await params;
  const slug = pathToSlug(path);

  const link = await prisma.artifactShareLink.findUnique({
    where: { slug },
  });

  if (!link) {
    return { title: 'Link Not Found' };
  }

  const client = getClient(link.clientId);
  const content = client ? getClientContent(link.clientId, link.artifactSlug) : null;

  if (!client || !content) {
    return { title: 'Link Not Found' };
  }

  // Format: "Client Name: Artifact Title"
  const title = `${client.name}: ${content.title}`;

  return {
    title,
    openGraph: {
      title,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const slug = pathToSlug(path);

  // 1. Fetch share link to get metadata (for password gate display)
  const link = await prisma.artifactShareLink.findUnique({
    where: { slug },
  });

  if (!link) {
    return <ShareNotFound />;
  }

  // 2. Get client and content info
  const client = getClient(link.clientId);
  const content = client ? getClientContent(link.clientId, link.artifactSlug) : null;

  if (!client || !content) {
    return <ShareNotFound />;
  }

  // 3. Check session
  const session = await getIronSession<ShareLinkSessionData>(
    await cookies(),
    getShareLinkSessionOptions(slug)
  );

  const isAuthenticated = isShareSessionValid(session, slug);

  // 4. If not authenticated, show password gate
  if (!isAuthenticated) {
    return (
      <SharePasswordGate
        slug={slug}
        clientName={client.name}
        artifactTitle={content.title}
        isLocked={link.lockedUntil ? link.lockedUntil > new Date() : false}
        lockedUntil={link.lockedUntil}
      />
    );
  }

  // 5. Authenticated - render the artifact
  const Component = content.component;
  return <Component />;
}

function ShareNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-display text-white mb-4">
          Link Not Found
        </h1>
        <p className="text-[#888] text-sm">
          This share link may have expired or been removed.
        </p>
      </div>
    </div>
  );
}
