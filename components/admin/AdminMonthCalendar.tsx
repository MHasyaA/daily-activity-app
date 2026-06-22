'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Home, Palmtree } from 'lucide-react';

export interface CalendarActivityItem {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  category: string;
  type: 'PLAN' | 'ACTUAL';
}

export interface AdminCalendarActivity {
  id: string;
  date: string;
  status: 'WFO' | 'WFH' | 'LIBUR';
  note: string | null;
  managerNotes: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    division: string | null;
  };
  planItems: CalendarActivityItem[];
  actualItems: CalendarActivityItem[];
}

export interface AdminCalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  activities: AdminCalendarActivity[];
}

interface AdminMonthCalendarProps {
  days: AdminCalendarDay[];
  currentMonthLabel: string;
  prevMonthUrl: string;
  nextMonthUrl: string;
  todayUrl: string;
  onDateClick: (date: Date, activities: AdminCalendarActivity[]) => void;
}

export default function AdminMonthCalendar({
  days,
  currentMonthLabel,
  prevMonthUrl,
  nextMonthUrl,
  todayUrl,
  onDateClick,
}: AdminMonthCalendarProps) {
  const weekDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Helper to format name to "Firstname L."
  const getShortName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemantauan Kalender Tim</span>
          <h2 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{currentMonthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={prevMonthUrl}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} />
          </Link>
          <Link
            href={todayUrl}
            className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Bulan Ini
          </Link>
          <Link
            href={nextMonthUrl}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/20 text-center py-3">
        {weekDays.map((wd, index) => (
          <span
            key={wd}
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              index === 0 || index === 6 ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            <span className="hidden sm:inline">{wd}</span>
            <span className="sm:hidden">{wd.substring(0, 3)}</span>
          </span>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100">
        {days.map((day) => {
          const wfoCount = day.activities.filter(act => act.status === 'WFO').length;
          const wfhCount = day.activities.filter(act => act.status === 'WFH').length;
          const liburCount = day.activities.filter(act => act.status === 'LIBUR').length;
          const totalLogs = day.activities.length;

          return (
            <button
              key={day.dateStr}
              onClick={() => onDateClick(day.date, day.activities)}
              className={`bg-white min-h-[130px] sm:min-h-[175px] lg:min-h-[210px] p-2 sm:p-3 transition-all duration-200 hover:bg-slate-50/70 flex flex-col justify-between text-left group ${
                day.isCurrentMonth ? '' : 'bg-slate-50/30'
              }`}
              title={day.holidayName || undefined}
            >
              {/* Day Number and Holiday status */}
              <div className="flex justify-between items-start gap-1 w-full">
                <span
                  className={`text-xs font-bold leading-none ${
                    !day.isCurrentMonth
                      ? 'text-slate-300'
                      : (day.isWeekend || day.isHoliday)
                      ? 'text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-lg'
                      : 'text-slate-700'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Holiday label */}
                {day.isHoliday && day.isCurrentMonth && (
                  <span className="hidden lg:inline-block text-[8px] font-bold text-rose-500 truncate max-w-[70%] leading-none text-right">
                    {day.holidayName}
                  </span>
                )}

                {/* Log count indicator for mobile */}
                {totalLogs > 0 && (
                  <span className="sm:hidden inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-sky-50 text-[8px] font-extrabold text-sky-700 border border-sky-100">
                    {totalLogs}
                  </span>
                )}
              </div>

              {/* Status Badges or Employee List */}
              <div className="mt-2 space-y-1.5 w-full flex-1 flex flex-col justify-start">
                {totalLogs > 0 ? (
                  <>
                    {/* Compact Pills for stats */}
                    <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1">
                      {wfoCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[8px] font-extrabold">
                          <MapPin size={8} className="shrink-0" />
                          <span>{wfoCount}</span>
                        </span>
                      )}
                      {wfhCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-extrabold">
                          <Home size={8} className="shrink-0" />
                          <span>{wfhCount}</span>
                        </span>
                      )}
                      {liburCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 text-[8px] font-extrabold">
                          <Palmtree size={8} className="shrink-0" />
                          <span>{liburCount}</span>
                        </span>
                      )}
                    </div>

                    {/* Employee list snippet for larger screens */}
                    <div className="hidden md:block space-y-1 w-full pt-1.5 border-t border-slate-100/60">
                      {day.activities.slice(0, 4).map((act) => {
                        const hasActual = act.actualItems && act.actualItems.length > 0;
                        const hasPlan = act.planItems && act.planItems.length > 0;
                        let activityDesc = '';
                        if (act.status === 'LIBUR') {
                          activityDesc = 'Libur / Cuti';
                        } else if (hasActual) {
                          activityDesc = `[Act] ${act.actualItems[0].description}`;
                        } else if (hasPlan) {
                          activityDesc = `[Plan] ${act.planItems[0].description}`;
                        } else {
                          activityDesc = 'Belum isi detail';
                        }

                        return (
                          <div
                            key={act.id}
                            className={`text-[9px] font-medium truncate leading-normal py-1 px-1.5 rounded-lg flex flex-col gap-0.5 ${
                              act.status === 'WFO'
                                ? 'bg-blue-50/60 text-blue-800 border border-blue-100/30'
                                : act.status === 'WFH'
                                ? 'bg-emerald-50/60 text-emerald-800 border border-emerald-100/30'
                                : 'bg-slate-50 text-slate-600 border border-slate-150'
                            }`}
                          >
                            <div className="flex justify-between items-center font-bold text-[8px] tracking-wide">
                              <span className="truncate max-w-[75%]">{getShortName(act.user.name)}</span>
                              <span className="text-[7px] opacity-75">{act.status}</span>
                            </div>
                            <span className="text-[8px] truncate opacity-85 font-normal leading-none">{activityDesc}</span>
                          </div>
                        );
                      })}
                      {totalLogs > 4 && (
                        <div className="text-[8px] text-sky-600 font-extrabold leading-none pt-0.5">
                          +{totalLogs - 4} karyawan lainnya
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  day.isCurrentMonth && (
                    <span className="hidden sm:inline-block text-[9px] text-slate-350 font-medium italic mt-1">
                      Belum ada laporan
                    </span>
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
