'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, startOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  Calendar, 
  Filter, 
  Download, 
  Loader2, 
  FileSpreadsheet,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { calculateDuration, formatHours } from '@/lib/utils';

interface UserOption {
  id: string;
  name: string;
  division: string | null;
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
  userId: string;
  date: string;
  status: 'WFO' | 'WFH' | 'LIBUR';
  note: string | null;
  attachment: string | null;
  user: {
    name: string;
    email: string;
    division: string | null;
  };
  planItems: ActivityItem[];
  actualItems: ActivityItem[];
}

export default function AdminReportPage() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [division, setDivision] = useState('');
  const [userId, setUserId] = useState('');
  
  // Options & Data
  const [users, setUsers] = useState<UserOption[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch users for dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Fetch report preview
  const fetchReportPreview = useCallback(async () => {
    setLoadingReport(true);
    try {
      const res = await fetch(
        `/api/admin/report?startDate=${startDate}&endDate=${endDate}&division=${division}&userId=${userId}`
      );
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Error fetching report preview:', err);
    } finally {
      setLoadingReport(false);
    }
  }, [startDate, endDate, division, userId]);

  useEffect(() => {
    fetchReportPreview();
  }, [fetchReportPreview]);

  const divisionOptions = [
    { value: '', label: 'Semua Divisi' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'IT Operations', label: 'IT Operations' },
    { value: 'HRD', label: 'HRD' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Marketing', label: 'Marketing' },
  ];

  // Dynamic CSV download URL
  const csvExportUrl = `/api/export/csv?startDate=${startDate}&endDate=${endDate}&division=${division}&userId=${userId}`;

  return (
    <>
      <Topbar title="Laporan & Ekspor CSV" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
        
        {/* Filter Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter size={18} className="text-slate-400" />
            <h3 className="font-bold text-sm">Filter Laporan Ekspor</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tanggal Mulai
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                />
                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tanggal Selesai
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                />
                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Division dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Divisi Karyawan
              </label>
              <select
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                  setUserId(''); // reset user filter on division change
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              >
                {divisionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Employee dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pilih Karyawan
              </label>
              <select
                value={userId}
                disabled={loadingUsers}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all disabled:opacity-50"
              >
                <option value="">Semua Karyawan</option>
                {users
                  .filter(u => !division || u.division === division)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
            </div>

          </div>
        </div>

        {/* Preview & Export Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header Actions */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-slate-400" />
                Preview Laporan Kerja
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Menemukan {activities.length} laporan dalam rentang tanggal
              </p>
            </div>
            
            <a
              href={csvExportUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-sky-600/10 transition-all"
            >
              <Download size={14} />
              Unduh File CSV
            </a>
          </div>

          {/* Preview Table Container */}
          <div className="overflow-x-auto">
            {loadingReport ? (
              <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-sky-500 mb-2" />
                <span className="text-xs font-semibold">Memuat preview laporan...</span>
              </div>
            ) : activities.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                    <th className="px-6 py-4">Nama / Divisi</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Kehadiran</th>
                    <th className="px-6 py-4 text-center">Plan Jam</th>
                    <th className="px-6 py-4 text-center">Actual Jam</th>
                    <th className="px-6 py-4">Catatan / Kendala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {activities.map((act) => {
                    const planHours = act.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
                    const actualHours = act.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
                    const formattedDate = format(new Date(act.date), 'dd MMM yyyy', { locale: localeId });

                    return (
                      <tr key={act.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <Link 
                              href={`/dashboard?userId=${act.userId}`}
                              className="font-bold text-sky-600 hover:text-sky-700 hover:underline text-xs transition-colors"
                            >
                              {act.user.name}
                            </Link>
                            <p className="text-[10px] text-slate-400 font-normal">{act.user.division || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4">
                          {act.status === 'WFO' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              WFO
                            </span>
                          )}
                          {act.status === 'WFH' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              WFH
                            </span>
                          )}
                          {act.status === 'LIBUR' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Libur
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 text-xs">
                          {act.status === 'LIBUR' ? '-' : formatHours(planHours)}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-800 text-xs font-bold">
                          {act.status === 'LIBUR' ? '-' : formatHours(actualHours)}
                        </td>
                        <td className="px-6 py-4 max-w-xs text-xs text-slate-500 font-normal">
                          <div className="flex flex-col gap-1">
                            <span className="truncate block text-slate-600">{act.note || '-'}</span>
                            {act.attachment && (
                              <a 
                                href={act.attachment} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold hover:underline mt-0.5"
                              >
                                <Paperclip size={11} className="shrink-0" />
                                Lihat Lampiran
                              </a>
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
                <AlertCircle size={32} className="text-slate-200 stroke-[1.5] mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Tidak ada laporan kerja</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sesuaikan parameter filter tanggal atau karyawan di atas.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  );
}
