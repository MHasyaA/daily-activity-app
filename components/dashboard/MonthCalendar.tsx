'use client';

import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Home, 
  Palmtree, 
  Plus 
} from 'lucide-react';
import { formatHours } from '@/lib/utils';

export interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  activity?: {
    id: string;
    status: 'WFO' | 'WFH' | 'LIBUR';
    totalPlanHours: number;
    totalActualHours: number;
  } | null;
}

interface MonthCalendarProps {
  days: CalendarDay[];
  currentMonthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  userId?: string;
}

export default function MonthCalendar({
  days,
  currentMonthLabel,
  onPrevMonth,
  onNextMonth,
  onToday,
  userId,
}: MonthCalendarProps) {
  const weekDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tampilan Bulanan</span>
          <h2 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{currentMonthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onToday}
            className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Bulan Ini
          </button>
          <button
            onClick={onNextMonth}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
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
            {wd}
          </span>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100">
        {days.map((day) => {
          const hasActivity = !!day.activity;
          
          let statusBadge = null;
          if (day.activity?.status === 'WFO') {
            statusBadge = (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                <MapPin size={9} />
                WFO
              </span>
            );
          } else if (day.activity?.status === 'WFH') {
            statusBadge = (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Home size={9} />
                WFH
              </span>
            );
          } else if (day.activity?.status === 'LIBUR') {
            statusBadge = (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                <Palmtree size={9} />
                Libur
              </span>
            );
          }

          return (
            <Link
              key={day.dateStr}
              href={`/activity/${day.dateStr}${userId ? `?userId=${userId}` : ''}`}
              className={`bg-white min-h-[110px] p-3 transition-all duration-200 hover:bg-slate-50/50 flex flex-col justify-between group ${
                day.isCurrentMonth ? '' : 'bg-slate-50/30'
              }`}
            >
              {/* Day Number and Weekend styling */}
              <div className="flex justify-between items-start">
                <span 
                  className={`text-xs font-bold leading-none ${
                    !day.isCurrentMonth
                      ? 'text-slate-300'
                      : day.isWeekend
                      ? 'text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-lg'
                      : 'text-slate-700'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Quick Add Button on Hover */}
                {!hasActivity && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-slate-100 rounded text-slate-400 hover:text-sky-600 hover:bg-slate-200">
                    <Plus size={10} />
                  </span>
                )}
              </div>

              {/* Day Activity Details */}
              <div className="space-y-1.5 mt-2">
                {hasActivity ? (
                  <>
                    <div className="flex items-center justify-between">
                      {statusBadge}
                    </div>
                    {day.activity?.status !== 'LIBUR' && (
                      <div className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                        <span>Act: {day.activity ? formatHours(day.activity.totalActualHours) : '0 jam'}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-6" /> // spacer
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
