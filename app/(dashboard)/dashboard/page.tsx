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
import CategoryPieChart from '@/components/dashboard/CategoryPieChart';
import { Calendar as CalendarIcon, MapPin, Home, CheckCircle2, Clock } from 'lucide-react';
import { calculateDuration } from '@/lib/utils';
import { isIndonesianHoliday, getHolidayInfo } from '@/lib/holidays';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; userId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  if ((session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && !searchParams.userId) {
    redirect('/admin/overview');
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
  let monthOvertimeHours = 0;

  for (let i = 0; i < daysDiff; i++) {
    const currentDate = addDays(calendarStart, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isCurrentMonth = currentDate.getMonth() === monthVal;


    const isHoliday = isIndonesianHoliday(currentDate);
    const holidayName = getHolidayInfo(currentDate);

    // Find if user has logged daily activity
    const activity = activities.find(act => format(new Date(act.date), 'yyyy-MM-dd') === dateStr);

    const totalPlanHours = activity
      ? activity.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0)
      : 0;

    const totalActualHours = activity
      ? activity.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0)
      : 0;

    // Accumulate metrics for current month only
    if (isCurrentMonth) {
      if (activity) {
        monthPlanHours += totalPlanHours;
        monthActualHours += totalActualHours;
        if (activity.status === 'WFO') wfoCount++;
        if (activity.status === 'WFH') wfhCount++;
      }
    }

    const hasActualItems = activity && activity.actualItems && activity.actualItems.length > 0;
    const hasPlanItems = activity && activity.planItems && activity.planItems.length > 0;
    const previewItems = hasActualItems
      ? activity.actualItems
      : (hasPlanItems ? activity.planItems : []);
    const previewType = hasActualItems ? 'ACTUAL' : (hasPlanItems ? 'PLAN' : undefined);

    days.push({
      date: currentDate,
      dateStr,
      dayNumber: currentDate.getDate(),
      isCurrentMonth,
      isWeekend,
      isHoliday,
      holidayName,
      activity: activity ? {
        id: activity.id,
        status: activity.status,
        totalPlanHours,
        totalActualHours,
        previewType,
        items: previewItems.map(item => ({
          id: item.id,
          description: item.description,
          startTime: item.startTime,
          endTime: item.endTime,
          category: item.category,
        })),
      } : null,
    });
  }

  monthOvertimeHours = monthActualHours > monthPlanHours ? monthActualHours - monthPlanHours : 0;

  // Calculate category distributions for the month
  const categoryHours: Record<string, number> = {
    MEETING: 0,
    TASK: 0,
    REVIEW: 0,
    TRAINING: 0,
    OTHER: 0,
    FINANCE: 0,
    MARKETING: 0,
    LOGISTICS: 0,
  };
  let totalActualWithCategories = 0;
  activities.forEach(act => {
    const actDate = new Date(act.date);
    if (actDate.getMonth() === monthVal && actDate.getFullYear() === yearVal && act.status !== 'LIBUR') {
      act.actualItems.forEach(item => {
        const duration = calculateDuration(item.startTime, item.endTime);
        const cat = item.category || 'OTHER';
        if (categoryHours[cat] !== undefined) {
          categoryHours[cat] += duration;
        } else {
          categoryHours['OTHER'] += duration;
        }
        totalActualWithCategories += duration;
      });
    }
  });

  const pieChartData = Object.entries(categoryHours).map(([category, hours]) => {
    const percentage = totalActualWithCategories > 0 ? (hours / totalActualWithCategories) * 100 : 0;
    return {
      category,
      hours,
      percentage,
    };
  }).filter(item => item.hours > 0);

  // Fetch yearly activities for Yearly Overview
  const startOfYear = new Date(yearVal, 0, 1);
  const endOfYear = new Date(yearVal, 11, 31, 23, 59, 59);

  const yearlyActivities = await prisma.activity.findMany({
    where: {
      userId: targetUserId,
      date: {
        gte: startOfYear,
        lte: endOfYear,
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

  let yearPlanHours = 0;
  let yearActualHours = 0;
  let yearWfoCount = 0;
  let yearWfhCount = 0;

  for (const act of yearlyActivities) {
    const planH = act.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
    const actualH = act.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);

    yearPlanHours += planH;
    yearActualHours += actualH;

    if (act.status === 'WFO') yearWfoCount++;
    if (act.status === 'WFH') yearWfhCount++;
  }

  const yearOvertimeHours = yearActualHours > yearPlanHours ? yearActualHours - yearPlanHours : 0;

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
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm font-semibold">
                Anda sedang melihat kalender aktivitas dari <strong>{targetUser.name}</strong>.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Kembali ke Dashboard Tim
            </Link>
          </div>
        )}
        
        {/* Yearly Overview Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overview Tahunan ({yearVal})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Plan hours card */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4 hover:bg-white transition-all">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <CalendarIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Tahun Ini</p>
                <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{yearPlanHours.toFixed(1)} jam</h3>
              </div>
            </div>

            {/* Actual hours card */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4 hover:bg-white transition-all">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Tahun Ini</p>
                <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{yearActualHours.toFixed(1)} jam</h3>
              </div>
            </div>

            {/* Overtime card */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4 hover:bg-white transition-all">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lembur Tahun Ini</p>
                <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
                  +{yearOvertimeHours.toFixed(1)} jam
                </h3>
              </div>
            </div>

            {/* WFO card */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4 hover:bg-white transition-all">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran WFO</p>
                <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{yearWfoCount} hari</h3>
              </div>
            </div>

            {/* WFH card */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4 hover:bg-white transition-all">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Home size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran WFH</p>
                <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{yearWfhCount} hari</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Overview & Pie Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Monthly Stats Column */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overview Bulanan ({currentMonthLabel})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Bulan Ini</p>
                  <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{monthActualHours.toFixed(1)} jam</h3>
                </div>
              </div>

              {/* Overtime card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lembur Bulan Ini</p>
                  <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
                    +{monthOvertimeHours.toFixed(1)} jam
                  </h3>
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
          </div>

          {/* Pie Chart Column */}
          <div className="lg:col-span-1">
            <CategoryPieChart data={pieChartData} title={`Persentase Kategori (${currentMonthLabel})`} />
          </div>
        </div>

        {/* MonthCalendar Grid */}
        <div className="space-y-4">
          <MonthCalendar
            days={days}
            currentMonthLabel={currentMonthLabel}
            userId={targetUser?.id}
            prevMonthUrl={prevMonthUrl}
            nextMonthUrl={nextMonthUrl}
            todayUrl={todayUrl}
          />
        </div>

      </div>
    </>
  );
}
