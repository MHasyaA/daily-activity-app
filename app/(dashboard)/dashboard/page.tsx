import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { 
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays, 
  format,
  differenceInDays
} from 'date-fns';
import { id } from 'date-fns/locale';
import Topbar from '@/components/layout/Topbar';
import MonthCalendar, { CalendarDay } from '@/components/dashboard/MonthCalendar';
import { Calendar as CalendarIcon, MapPin, Home, CheckCircle2 } from 'lucide-react';
import { calculateDuration } from '@/lib/utils';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; userId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  // Determine target user
  let targetUserId = session.user.id;
  let targetUser = null;

  if (searchParams.userId && searchParams.userId !== session.user.id) {
    if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
      targetUserId = searchParams.userId;
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true },
      });
      if (!targetUser) {
        redirect('/dashboard');
      }
    } else {
      redirect('/dashboard');
    }
  }

  // Parse parameters or set defaults
  const today = new Date();
  const yearVal = searchParams.year ? parseInt(searchParams.year) : today.getFullYear();
  const monthVal = searchParams.month ? parseInt(searchParams.month) - 1 : today.getMonth(); // 0-indexed

  const activeDate = new Date(yearVal, monthVal, 1);
  const startMonthDate = startOfMonth(activeDate);
  const endMonthDate = endOfMonth(activeDate);

  // Calendar grid boundary dates (Sunday to Saturday)
  const calendarStart = startOfWeek(startMonthDate, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endMonthDate, { weekStartsOn: 0 });

  // Fetch activities in range
  const activities = await prisma.activity.findMany({
    where: {
      userId: targetUserId,
      date: {
        gte: calendarStart,
        lte: calendarEnd,
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

  // Calculate calendar days
  const days: CalendarDay[] = [];
  const daysDiff = differenceInDays(calendarEnd, calendarStart) + 1;

  let monthPlanHours = 0;
  let monthActualHours = 0;
  let wfoCount = 0;
  let wfhCount = 0;

  for (let i = 0; i < daysDiff; i++) {
    const currentDate = addDays(calendarStart, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isCurrentMonth = currentDate.getMonth() === monthVal;

    // Find if user has logged daily activity
    const activity = activities.find(act => format(new Date(act.date), 'yyyy-MM-dd') === dateStr);

    const totalPlanHours = activity
      ? activity.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0)
      : 0;

    const totalActualHours = activity
      ? activity.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0)
      : 0;

    // Accumulate metrics for current month only
    if (activity && isCurrentMonth) {
      monthPlanHours += totalPlanHours;
      monthActualHours += totalActualHours;
      if (activity.status === 'WFO') wfoCount++;
      if (activity.status === 'WFH') wfhCount++;
    }

    days.push({
      date: currentDate,
      dateStr,
      dayNumber: currentDate.getDate(),
      isCurrentMonth,
      isWeekend,
      activity: activity ? {
        id: activity.id,
        status: activity.status,
        totalPlanHours,
        totalActualHours,
      } : null,
    });
  }

  // Next and Prev month links
  const prevMonthDate = new Date(yearVal, monthVal - 1, 1);
  const nextMonthDate = new Date(yearVal, monthVal + 1, 1);

  const userIdParam = searchParams.userId ? `&userId=${searchParams.userId}` : '';
  const prevMonthUrl = `/dashboard?month=${prevMonthDate.getMonth() + 1}&year=${prevMonthDate.getFullYear()}${userIdParam}`;
  const nextMonthUrl = `/dashboard?month=${nextMonthDate.getMonth() + 1}&year=${nextMonthDate.getFullYear()}${userIdParam}`;
  const todayUrl = `/dashboard${searchParams.userId ? `?userId=${searchParams.userId}` : ''}`;

  const currentMonthLabel = format(activeDate, 'MMMM yyyy', { locale: id });

  return (
    <>
      <Topbar title={targetUser ? `Dashboard Karyawan: ${targetUser.name}` : "Dashboard Karyawan"} />
      
      <div className="p-8 space-y-8">
        
        {/* Admin Viewing Banner */}
        {targetUser && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm font-semibold">
                Anda sedang melihat kalender aktivitas dari <strong>{targetUser.name}</strong>.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Kembali ke Dashboard Tim
            </Link>
          </div>
        )}
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Plan hours card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <CalendarIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Bulan Ini</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{monthPlanHours.toFixed(1)} jam</h3>
            </div>
          </div>

          {/* Actual hours card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Bulan Ini</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{monthActualHours.toFixed(1)} jam</h3>
            </div>
          </div>

          {/* WFO card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran WFO</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{wfoCount} hari</h3>
            </div>
          </div>

          {/* WFH card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Home size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran WFH</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{wfhCount} hari</h3>
            </div>
          </div>
        </div>

        {/* MonthCalendar Grid */}
        <div className="space-y-4">
          <MonthCalendar
            days={days}
            currentMonthLabel={currentMonthLabel}
            userId={targetUser?.id}
            onPrevMonth={async () => {
              'use server';
              redirect(prevMonthUrl);
            }}
            onNextMonth={async () => {
              'use server';
              redirect(nextMonthUrl);
            }}
            onToday={async () => {
              'use server';
              redirect(todayUrl);
            }}
          />
        </div>

      </div>
    </>
  );
}
