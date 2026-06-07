'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, differenceInDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Users,
  MapPin,
  Home,
  Palmtree,
  Loader2,
  Filter,
  CheckCircle,
  Search,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import AdminMonthCalendar, { AdminCalendarDay, AdminCalendarActivity } from '@/components/admin/AdminMonthCalendar';
import { isIndonesianHoliday, getHolidayInfo } from '@/lib/holidays';

interface UserData {
  id: string;
  name: string;
  email: string;
  division: string | null;
}

type ActivityData = AdminCalendarActivity;

function AdminOverviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse parameters or set defaults
  const today = new Date();
  const yearVal = searchParams.get('year') ? parseInt(searchParams.get('year')!) : today.getFullYear();
  const monthVal = searchParams.get('month') ? parseInt(searchParams.get('month')!) - 1 : today.getMonth(); // 0-indexed

  const activeDate = new Date(yearVal, monthVal, 1);
  const startMonthDate = startOfMonth(activeDate);
  const endMonthDate = endOfMonth(activeDate);

  // Calendar boundaries
  const calendarStart = startOfWeek(startMonthDate, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endMonthDate, { weekStartsOn: 0 });

  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  // Modal State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateActivities, setSelectedDateActivities] = useState<ActivityData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      const monthNum = monthVal + 1;
      const res = await fetch(
        `/api/admin/overview?month=${monthNum}&year=${yearVal}&division=${division}`
      );
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
      }
      if (data.allUsers) {
        setAllUsers(data.allUsers);
      }
    } catch (err) {
      console.error('Error fetching admin overview data:', err);
    } finally {
      setLoading(false);
    }
  }, [monthVal, yearVal, division]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Construct Calendar Days
  const days = useMemo(() => {
    const calendarDays: AdminCalendarDay[] = [];
    const daysDiff = differenceInDays(calendarEnd, calendarStart) + 1;

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = addDays(calendarStart, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isCurrentMonth = currentDate.getMonth() === monthVal;

      const isHoliday = isIndonesianHoliday(currentDate);
      const holidayName = getHolidayInfo(currentDate);

      // Filter activities for this date
      const dateActivities = activities.filter(
        (act) => format(new Date(act.date), 'yyyy-MM-dd') === dateStr
      );

      calendarDays.push({
        date: currentDate,
        dateStr,
        dayNumber: currentDate.getDate(),
        isCurrentMonth,
        isWeekend,
        isHoliday,
        holidayName,
        activities: dateActivities,
      });
    }
    return calendarDays;
  }, [calendarStart, calendarEnd, monthVal, activities]);

  // Calculations for Monthly KPI Cards (current month days only)
  const stats = useMemo(() => {
    const currentMonthDays = days.filter(d => d.isCurrentMonth);
    const totalPossibleLogs = currentMonthDays.length * allUsers.length;
    let actualLoggedCount = 0;
    let totalWfo = 0;
    let totalWfh = 0;
    let totalLibur = 0;

    currentMonthDays.forEach(day => {
      day.activities.forEach(act => {
        actualLoggedCount++;
        if (act.status === 'WFO') totalWfo++;
        if (act.status === 'WFH') totalWfh++;
        if (act.status === 'LIBUR') totalLibur++;
      });
    });

    const completionRate = totalPossibleLogs > 0 ? (actualLoggedCount / totalPossibleLogs) * 100 : 0;

    return {
      totalEmployees: allUsers.length,
      completionRate,
      wfoCount: totalWfo,
      wfhCount: totalWfh,
      liburCount: totalLibur,
      actualLoggedCount,
      totalPossibleLogs
    };
  }, [days, allUsers]);

  // Month navigation URLs
  const prevMonthDate = new Date(yearVal, monthVal - 1, 1);
  const nextMonthDate = new Date(yearVal, monthVal + 1, 1);
  const divisionParam = division ? `&division=${division}` : '';

  const prevMonthUrl = `/admin/overview?month=${prevMonthDate.getMonth() + 1}&year=${prevMonthDate.getFullYear()}${divisionParam}`;
  const nextMonthUrl = `/admin/overview?month=${nextMonthDate.getMonth() + 1}&year=${nextMonthDate.getFullYear()}${divisionParam}`;
  const todayUrl = `/admin/overview${division ? `?division=${division}` : ''}`;

  const currentMonthLabel = format(activeDate, 'MMMM yyyy', { locale: localeId });

  // Handle cell click
  const handleDateClick = (date: Date, dateActivities: ActivityData[]) => {
    setSelectedDate(date);
    setSelectedDateActivities(dateActivities);
    setSearchTerm('');
  };

  // Filtered employees inside the selected date modal
  const filteredModalEmployees = useMemo(() => {
    if (!selectedDate) return [];
    return allUsers.filter(user => {
      const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    }).map(user => {
      const activity = selectedDateActivities.find(act => act.userId === user.id);
      return {
        user,
        activity: activity || null
      };
    });
  }, [selectedDate, allUsers, selectedDateActivities, searchTerm]);

  const divisionOptions = [
    { value: '', label: 'Semua Divisi' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'IT Operations', label: 'IT Operations' },
    { value: 'HRD', label: 'HRD' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Marketing', label: 'Marketing' },
  ];

  return (
    <>
      <Topbar title="Overview Kalender Tim" />

      <div className="p-6 sm:p-10 space-y-6 w-full pb-24">
        
        {/* Header Filter Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Filter Overview</h3>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Division dropdown */}
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                router.push(`/admin/overview?month=${monthVal + 1}&year=${yearVal}${e.target.value ? `&division=${e.target.value}` : ''}`);
              }}
              className="px-4 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all w-full md:w-48"
            >
              {divisionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly Summary Statistics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-[142px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Employees */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Karyawan</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-0.5">
                    {stats.totalEmployees} <span className="text-xs font-bold text-slate-400">orang</span>
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-100 pt-2">
                Aktif terdaftar di sistem
              </p>
            </div>

            {/* Total Fill Rate */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Pengisian</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-0.5">
                    {stats.completionRate.toFixed(0)}%
                  </h4>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1">
                  <span>Log dilaporkan</span>
                  <span>{stats.actualLoggedCount} / {stats.totalPossibleLogs}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.completionRate}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Total WFO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total WFO</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-0.5">
                    {stats.wfoCount} <span className="text-xs font-bold text-slate-400">log</span>
                  </h4>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1">
                  <span>Persentase WFO</span>
                  <span>{stats.actualLoggedCount > 0 ? ((stats.wfoCount / stats.actualLoggedCount) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.actualLoggedCount > 0 ? (stats.wfoCount / stats.actualLoggedCount) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Total WFH */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Home size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total WFH</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-0.5">
                    {stats.wfhCount} <span className="text-xs font-bold text-slate-400">log</span>
                  </h4>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1">
                  <span>Persentase WFH</span>
                  <span>{stats.actualLoggedCount > 0 ? ((stats.wfhCount / stats.actualLoggedCount) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.actualLoggedCount > 0 ? (stats.wfhCount / stats.actualLoggedCount) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Total Off / Cuti */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                  <Palmtree size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cuti/Libur</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-0.5">
                    {stats.liburCount} <span className="text-xs font-bold text-slate-400">log</span>
                  </h4>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1">
                  <span>Persentase Libur</span>
                  <span>{stats.actualLoggedCount > 0 ? ((stats.liburCount / stats.actualLoggedCount) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="bg-slate-400 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.actualLoggedCount > 0 ? (stats.liburCount / stats.actualLoggedCount) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AdminMonthCalendar */}
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[450px] flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={36} className="animate-spin text-sky-500 mb-3" />
            <span className="text-sm font-semibold">Memuat kalender tim...</span>
          </div>
        ) : (
          <AdminMonthCalendar
            days={days}
            currentMonthLabel={currentMonthLabel}
            prevMonthUrl={prevMonthUrl}
            nextMonthUrl={nextMonthUrl}
            todayUrl={todayUrl}
            onDateClick={handleDateClick}
          />
        )}

      </div>

      {/* Date Details Slide-out Panel or Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedDate(null)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rincian Harian Tim</span>
                <h3 className="text-base font-black text-slate-800 tracking-tight mt-0.5">
                  {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Tutup Panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search and Filters inside Modal */}
            <div className="p-6 border-b border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama atau email karyawan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Employees List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {filteredModalEmployees.length > 0 ? (
                filteredModalEmployees.map(({ user, activity }) => {
                  const hasPlan = activity && activity.planItems.length > 0;
                  const hasActual = activity && activity.actualItems.length > 0;

                  return (
                    <div
                      key={user.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                    >
                      {/* Employee Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800">{user.name}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                              {user.division || 'Umum'} • {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {activity ? (
                          activity.status === 'WFO' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                              <MapPin size={10} />
                              WFO
                            </span>
                          ) : activity.status === 'WFH' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Home size={10} />
                              WFH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                              <Palmtree size={10} />
                              Libur
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                            <AlertCircle size={10} />
                            Belum Isi
                          </span>
                        )}
                      </div>

                      {activity && activity.status !== 'LIBUR' && (hasPlan || hasActual) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          {/* Plan Column */}
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              Rencana Kegiatan (Planning)
                            </span>
                            {hasPlan ? (
                              <ul className="space-y-1.5">
                                {activity.planItems
                                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                  .map((item) => (
                                    <li
                                      key={item.id}
                                      className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col gap-1"
                                    >
                                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                                        <span className="flex items-center gap-1">
                                          <Clock size={10} />
                                          {item.startTime} - {item.endTime}
                                        </span>
                                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px]">
                                          {item.category}
                                        </span>
                                      </div>
                                      <p className="text-slate-700 font-medium leading-relaxed">{item.description}</p>
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-350 italic font-medium">Tidak ada rencana kegiatan.</p>
                            )}
                          </div>

                          {/* Actual Column */}
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              Realisasi Kegiatan (Actual)
                            </span>
                            {hasActual ? (
                              <ul className="space-y-1.5">
                                {activity.actualItems
                                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                  .map((item) => (
                                    <li
                                      key={item.id}
                                      className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col gap-1"
                                    >
                                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                                        <span className="flex items-center gap-1">
                                          <Clock size={10} />
                                          {item.startTime} - {item.endTime}
                                        </span>
                                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px]">
                                          {item.category}
                                        </span>
                                      </div>
                                      <p className="text-slate-700 font-medium leading-relaxed">{item.description}</p>
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-350 italic font-medium">Belum mengisi realisasi.</p>
                            )}
                          </div>
                        </div>
                      ) : activity && activity.status === 'LIBUR' ? (
                        <div className="pt-2 text-center text-xs text-slate-400 font-medium italic">
                          Karyawan sedang mengajukan libur / cuti untuk tanggal ini.
                        </div>
                      ) : activity ? (
                        <div className="pt-2 text-center text-xs text-slate-400 font-medium italic">
                          Karyawan belum mencatat rincian kegiatan planning maupun realisasi.
                        </div>
                      ) : null}

                      {/* Notes / Blocker */}
                      {activity && activity.note && (
                        <div className="pt-3 border-t border-slate-100 text-xs">
                          <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block mb-1">
                            Catatan / Kendala Karyawan
                          </span>
                          <div className="bg-rose-50/50 text-rose-700 border border-rose-100 rounded-xl p-3 font-medium">
                            {activity.note}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Users size={28} className="text-slate-200 stroke-[1.5] mb-2" />
                  <span className="text-xs font-semibold">Karyawan tidak ditemukan</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={36} className="animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-medium">Memuat overview tim...</span>
      </div>
    }>
      <AdminOverviewContent />
    </React.Suspense>
  );
}
