import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const division = searchParams.get('division');
  const userId = searchParams.get('userId');

  try {
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const activities = await prisma.activity.findMany({
      where: {
        ...(userId && { userId }),
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
        user: {
          ...(division && { division }),
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            division: true,
          },
        },
        planItems: {
          where: { type: 'PLAN' },
        },
        actualItems: {
          where: { type: 'ACTUAL' },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching admin report preview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
