import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  const division = searchParams.get('division');

  const today = new Date();
  const month = monthParam ? parseInt(monthParam) - 1 : today.getMonth(); // 0-indexed
  const year = yearParam ? parseInt(yearParam) : today.getFullYear();

  const activeDate = new Date(year, month, 1);
  const calendarStart = startOfWeek(startOfMonth(activeDate), { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endOfMonth(activeDate), { weekStartsOn: 0 });

  try {
    const activities = await prisma.activity.findMany({
      where: {
        date: {
          gte: calendarStart,
          lte: calendarEnd,
        },
        user: {
          isActive: true,
          role: { not: 'ADMIN' },
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

    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: 'ADMIN' },
        ...(division && { division }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        division: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ activities, allUsers });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
