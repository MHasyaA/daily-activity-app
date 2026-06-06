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
  const dateParam = searchParams.get('date');
  const division = searchParams.get('division');

  try {
    const filterDate = dateParam ? new Date(dateParam) : new Date();

    const activities = await prisma.activity.findMany({
      where: {
        date: filterDate,
        user: {
          ...(division && { division }),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            division: true,
            role: true,
          },
        },
        planItems: {
          where: { type: 'PLAN' },
        },
        actualItems: {
          where: { type: 'ACTUAL' },
        },
      },
    });

    // Fetch all active users to show who hasn't submitted yet
    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(division && { division }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        division: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Map users to their activity
    const reportData = allUsers.map((user) => {
      const userActivity = activities.find((act) => act.userId === user.id);
      return {
        user,
        activity: userActivity || null,
      };
    });

    return NextResponse.json({ reportData });
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
