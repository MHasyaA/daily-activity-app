'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  Users, 
  MapPin, 
  Home, 
  Palmtree, 
  Loader2, 
  Calendar, 
  Filter, 
  CheckCircle,
  Paperclip
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { calculateDuration, formatHours } from '@/lib/utils';

interface UserData {
  id: string;
  name: string;
  email: string;
  division: string | null;
  role: string;
}

interface ActivityItem {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  category: string;
  type: 'PLAN' | 'ACTUAL';
}

interface ActivityData {
  id: string;
  status: 'WFO' | 'WFH' | 'LIBUR';
  note: string | null;
  attachments: { id: string; url: string }[];
  planItems: ActivityItem[];
  actualItems: ActivityItem[];
}

interface ReportRow {
  user: UserData;
  activity: ActivityData | null;
}

export default function AdminDashboardPage() {
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportRow[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activities?date=${dateStr}&division=${division}`);
      const data = await res.json();
      if (data.reportData) {
        setReportData(data.reportData);
      }
    } catch (err) {
      console.error('Error fetching admin report:', err);
    } finally {
      setLoading(false);
    }
  }, [dateStr, division]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Calculations for KPI Cards
  const totalEmployeesCount = reportData.length;
  const filledEmployeesCount = reportData.filter(row => !!row.activity).length;
  const completionRate = totalEmployeesCount > 0 ? (filledEmployeesCount / totalEmployeesCount) * 100 : 0;

  const wfoCount = reportData.filter(row => row.activity?.status === 'WFO').length;
  const wfhCount = reportData.filter(row => row.activity?.status === 'WFH').length;
  const liburCount = reportData.filter(row => row.activity?.status === 'LIBUR').length;

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
      <Topbar title="Dashboard Manager / Admin" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
        
        {/* Header Filter Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Filter Laporan Tim</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Date selector */}
            <div className="relative flex-1 sm:flex-none">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              />
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Division dropdown */}
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
            >
              {divisionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Fill rate card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Persentase Pengisian</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">{completionRate.toFixed(0)}%</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {filledEmployeesCount} dari {totalEmployeesCount} karyawan
              </p>
            </div>
          </div>

          {/* WFO card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WFO Hari Ini</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">{wfoCount}</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Karyawan di kantor</p>
            </div>
          </div>

          {/* WFH card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600">
              <Home size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WFH Hari Ini</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">{wfhCount}</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Karyawan kerja remote</p>
            </div>
          </div>

          {/* Off / Cuti card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-500">
              <Palmtree size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Libur / Cuti</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">{liburCount}</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Karyawan sedang libur</p>
            </div>
          </div>
        </div>

        {/* Detailed Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Status Pengisian Aktivitas Tim</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Tanggal: {format(new Date(dateStr), 'dd MMMM yyyy', { locale: localeId })}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-rose-500 mb-2" />
                <span className="text-xs font-semibold">Memuat data tim...</span>
              </div>
            ) : reportData.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Divisi</th>
                    <th className="px-6 py-4">Kehadiran</th>
                    <th className="px-6 py-4 text-center">Plan Jam</th>
                    <th className="px-6 py-4 text-center">Actual Jam</th>
                    <th className="px-6 py-4">Catatan Kendala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {reportData.map((row) => {
                    const activity = row.activity;
                    const planHours = activity
                      ? activity.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0)
                      : 0;
                    const actualHours = activity
                      ? activity.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0)
                      : 0;

                    return (
                      <tr key={row.user.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                              {row.user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link 
                                href={`/dashboard?userId=${row.user.id}`}
                                className="font-bold text-rose-600 hover:text-rose-700 hover:underline text-xs transition-colors animate-none"
                              >
                                {row.user.name}
                              </Link>
                              <p className="text-[10px] text-slate-400 font-normal">{row.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {row.user.division || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {activity ? (
                            activity.status === 'WFO' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                WFO
                              </span>
                            ) : activity.status === 'WFH' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                WFH
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Libur
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              Belum Isi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 text-xs">
                          {activity?.status === 'LIBUR' ? '-' : activity ? formatHours(planHours) : '0 jam'}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-800 text-xs font-bold">
                          {activity?.status === 'LIBUR' ? '-' : activity ? formatHours(actualHours) : '0 jam'}
                        </td>
                        <td className="px-6 py-4 max-w-xs text-xs text-slate-500 font-normal">
                          <div className="flex flex-col gap-1">
                            <span className="truncate block text-slate-600">{activity?.note || '-'}</span>
                            {activity?.attachments && activity.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {activity.attachments.map((att, idx) => (
                                  <a 
                                    key={att.id}
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-0.5 text-rose-600 hover:text-rose-700 font-bold hover:underline"
                                    title={`Buka Lampiran ${idx + 1}`}
                                  >
                                    <Paperclip size={10} className="shrink-0" />
                                    <span>Bukti #{idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-24 text-center px-4 flex flex-col items-center justify-center text-slate-400">
                <Users size={32} className="text-slate-200 stroke-[1.5] mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Tidak ada karyawan terdaftar</h4>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
