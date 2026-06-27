import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDuration } from '@/lib/utils';
import { isIndonesianHoliday } from '@/lib/holidays';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const today = new Date();
  const year = yearParam ? parseInt(yearParam) : today.getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: 'ADMIN' },
      },
      select: {
        id: true,
        name: true,
        division: true,
      },
    });

    const activities = await prisma.activity.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
        user: {
          isActive: true,
          role: { not: 'ADMIN' },
        },
      },
      include: {
        planItems: {
          where: { type: 'PLAN' },
        },
        actualItems: {
          where: { type: 'ACTUAL' },
        },
      },
    });

    // Calculate overtime for each user
    const userOvertimeList = users.map(user => {
      const userActivities = activities.filter(act => act.userId === user.id);
      
      let totalPlanHours = 0;
      let totalEffectiveActualHours = 0;

      for (const act of userActivities) {
        const planH = act.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0) + (act.status === 'GANTI_LIBUR' ? 8 : 0);
        const actualH = act.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);

        // Apply new logic: only include plan if actual is filled
        const hasActualItems = act.actualItems && act.actualItems.length > 0;
        if (hasActualItems) {
          totalPlanHours += planH;
        }

        const actDate = new Date(act.date);
        const dayOfWeek = actDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = isIndonesianHoliday(actDate);
        const isWeekendOrHoliday = isWeekend || isHoliday;
        totalEffectiveActualHours += isWeekendOrHoliday ? (actualH * 2) : actualH;
      }

      const overtimeHours = totalEffectiveActualHours > totalPlanHours ? totalEffectiveActualHours - totalPlanHours : 0;
      const overtimeDays = overtimeHours / 8;

      return {
        id: user.id,
        name: user.name,
        division: user.division,
        overtimeHours,
        overtimeDays,
      };
    });

    // Sort descending by overtimeDays and filter those with overtimeDays > 1 (i.e. > 8 hours)
    const filteredList = userOvertimeList
      .filter(item => item.overtimeDays > 1)
      .sort((a, b) => b.overtimeDays - a.overtimeDays);

    return NextResponse.json({ yearlyOvertime: filteredList });
  } catch (error) {
    console.error('Error fetching yearly overtime overview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
