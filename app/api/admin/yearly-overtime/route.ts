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

    // Calculate stats for each user
    const userStatsList = users.map(user => {
      const userActivities = activities.filter(act => act.userId === user.id);
      
      let totalPlanHours = 0;
      let totalEffectiveActualHours = 0;
      let wfoCount = 0;
      let wfhCount = 0;
      let gantiLiburCount = 0;

      for (const act of userActivities) {
        // Overtime calculations
        const planH = act.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0) + (act.status === 'GANTI_LIBUR' ? 8 : 0);
        const actualH = act.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);

        const hasActualItems = act.actualItems && act.actualItems.length > 0;
        const isGantiLibur = act.status === 'GANTI_LIBUR';
        if (hasActualItems || isGantiLibur) {
          totalPlanHours += planH;
        }

        const actDate = new Date(act.date);
        const dayOfWeek = actDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = isIndonesianHoliday(actDate);
        const isWeekendOrHoliday = isWeekend || isHoliday;
        totalEffectiveActualHours += isWeekendOrHoliday ? (actualH * 2) : actualH;

        // Activity status counts
        if (act.status === 'WFO') wfoCount++;
        if (act.status === 'WFH') wfhCount++;
        if (act.status === 'GANTI_LIBUR') gantiLiburCount++;
      }

      const overtimeHours = totalEffectiveActualHours > totalPlanHours ? totalEffectiveActualHours - totalPlanHours : 0;
      const overtimeDays = overtimeHours / 8;

      return {
        id: user.id,
        name: user.name,
        division: user.division,
        overtimeHours,
        overtimeDays,
        wfoCount,
        wfhCount,
        gantiLiburCount,
      };
    });

    // Yearly overtime leaderboard (filtered > 1 day)
    const yearlyOvertime = userStatsList
      .filter(item => item.overtimeDays > 1)
      .sort((a, b) => b.overtimeDays - a.overtimeDays)
      .map(item => ({
        id: item.id,
        name: item.name,
        division: item.division,
        overtimeHours: item.overtimeHours,
        overtimeDays: item.overtimeDays,
      }));

    // WFO leaderboard (sorted descending by wfoCount)
    const wfoList = [...userStatsList]
      .sort((a, b) => b.wfoCount - a.wfoCount)
      .map(item => ({
        id: item.id,
        name: item.name,
        division: item.division,
        count: item.wfoCount,
      }));

    // WFH leaderboard (sorted descending by wfhCount)
    const wfhList = [...userStatsList]
      .sort((a, b) => b.wfhCount - a.wfhCount)
      .map(item => ({
        id: item.id,
        name: item.name,
        division: item.division,
        count: item.wfhCount,
      }));

    // Ganti Libur leaderboard (sorted descending by gantiLiburCount)
    const gantiLiburList = [...userStatsList]
      .sort((a, b) => b.gantiLiburCount - a.gantiLiburCount)
      .map(item => ({
        id: item.id,
        name: item.name,
        division: item.division,
        count: item.gantiLiburCount,
      }));

    // Sum totals for headers
    const totalWfo = userStatsList.reduce((acc, item) => acc + item.wfoCount, 0);
    const totalWfh = userStatsList.reduce((acc, item) => acc + item.wfhCount, 0);
    const totalGantiLibur = userStatsList.reduce((acc, item) => acc + item.gantiLiburCount, 0);

    return NextResponse.json({
      yearlyOvertime,
      wfoList,
      wfhList,
      gantiLiburList,
      totalWfo,
      totalWfh,
      totalGantiLibur,
    });
  } catch (error) {
    console.error('Error fetching yearly overtime overview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
