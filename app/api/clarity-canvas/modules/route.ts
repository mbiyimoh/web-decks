import { NextResponse } from 'next/server';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = await prisma.clarityModule.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        estimatedMinutes: true,
        enrichesSections: true,
        isActive: true,
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
