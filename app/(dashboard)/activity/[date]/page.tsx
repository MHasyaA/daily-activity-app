'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format, addDays, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Home, 
  Palmtree, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import ActivityColumn from '@/components/activity/ActivityColumn';
import ActivityItemForm from '@/components/activity/ActivityItemForm';
import { ActivityItemData } from '@/components/activity/ActivityItemCard';

interface ActivityData {
  id: string;
  status: 'WFO' | 'WFH' | 'LIBUR';
  note: string | null;
  managerNotes: string | null;
  planItems: ActivityItemData[];
  actualItems: ActivityItemData[];
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateStr = params.date as string;
  const userId = searchParams.get('userId');

  const { data: session } = useSession();

  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [targetUser, setTargetUser] = useState<{ name: string } | null>(null);
  const [status, setStatus] = useState<'WFO' | 'WFH' | 'LIBUR' | ''>('');
  const [note, setNote] = useState('');
  const [managerNotes, setManagerNotes] = useState('');

  const isViewingOthers = !!userId && session?.user?.id !== userId;
  
  // Modal Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'PLAN' | 'ACTUAL'>('PLAN');
  const [itemToEdit, setItemToEdit] = useState<ActivityItemData | null>(null);

  // Initialize date parsing
  useEffect(() => {
    if (dateStr) {
      setDate(parseISO(dateStr));
    }
  }, [dateStr]);

  // Fetch daily activity data
  const fetchData = useCallback(async () => {
    if (!dateStr) return;
    setLoading(true);
    try {
      const url = userId 
        ? `/api/activity?date=${dateStr}&userId=${userId}` 
        : `/api/activity?date=${dateStr}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.activity) {
        setActivity(data.activity);
        setStatus(data.activity.status);
        setNote(data.activity.note || '');
        setManagerNotes(data.activity.managerNotes || '');
      } else {
        setActivity(null);
        setStatus('');
        setNote('');
        setManagerNotes('');
      }
      if (data.targetUser) {
        setTargetUser(data.targetUser);
      } else {
        setTargetUser(null);
      }
    } catch (err) {
      console.error('Error fetching activity data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateStr, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle status update (presence check-in)
  const handleStatusChange = async (newStatus: 'WFO' | 'WFH' | 'LIBUR') => {
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          status: newStatus,
          note: note,
        }),
      });
      const data = await res.json();
      if (data.activity) {
        // Refresh page details
        fetchData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle note save
  const handleSaveNote = useCallback(async () => {
    if (!activity) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/activity/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.activity) {
        setActivity(prev => prev ? { ...prev, note: data.activity.note } : null);
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  }, [activity, note]);

  // Handle manager note save
  const handleSaveManagerNotes = useCallback(async () => {
    if (!activity) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/activity/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerNotes }),
      });
      const data = await res.json();
      if (data.activity) {
        setActivity(prev => prev ? { ...prev, managerNotes: data.activity.managerNotes } : null);
      }
    } catch (err) {
      console.error('Error saving manager notes:', err);
    } finally {
      setSaving(false);
    }
  }, [activity, managerNotes]);

  // Auto-save note after delay (debouncing note save)
  useEffect(() => {
    if (!activity || note === (activity.note || '')) return;
    
    const delayDebounceFn = setTimeout(() => {
      handleSaveNote();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [note, activity, handleSaveNote]);

  // Auto-save managerNotes after delay (debouncing managerNotes save)
  useEffect(() => {
    if (!activity || managerNotes === (activity.managerNotes || '')) return;
    
    const delayDebounceFn = setTimeout(() => {
      handleSaveManagerNotes();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [managerNotes, activity, handleSaveManagerNotes]);

  // Add/Edit Activity Item
  const handleSaveItem = async (itemData: Omit<ActivityItemData, 'id' | 'activityId'> & { id?: string }) => {
    setIsFormOpen(false);
    setSaving(true);
    
    try {
      const url = itemData.id ? `/api/activity/items/${itemData.id}` : '/api/activity/items';
      const method = itemData.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemData,
          date: dateStr,
          activityId: activity?.id,
          status: status || 'WFO', // fallback to init daily activity if not created yet
        }),
      });

      const data = await res.json();
      if (data.item) {
        fetchData();
      }
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setSaving(false);
      setItemToEdit(null);
    }
  };

  // Delete Activity Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/activity/items/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setSaving(false);
    }
  };

  // Copy Plan to Actual
  const handleCopyFromPlanning = async () => {
    if (!activity || activity.planItems.length === 0) return;
    if (!confirm('Salin semua planning hari ini ke actual?')) return;
    setSaving(true);
    
    try {
      // Loop over planItems and create corresponding actualItems
      const promises = activity.planItems.map((plan) => {
        return fetch('/api/activity/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityId: activity.id,
            startTime: plan.startTime,
            endTime: plan.endTime,
            description: plan.description,
            category: plan.category,
            type: 'ACTUAL',
          }),
        });
      });

      await Promise.all(promises);
      fetchData();
    } catch (err) {
      console.error('Error copying planning items:', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate Navigation Dates
  const prevDateStr = format(addDays(date, -1), 'yyyy-MM-dd');
  const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd');
  
  const formattedDayFull = format(date, 'EEEE, dd MMMM yyyy', { locale: localeId });

  return (
    <>
      <Topbar title={targetUser ? `Aktivitas Harian: ${targetUser.name}` : "Detail Aktivitas Harian"} />

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto pb-24">
        
        {/* Admin Viewing Banner */}
        {targetUser && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm font-semibold">
                Anda sedang melihat detail aktivitas dari <strong>{targetUser.name}</strong>.
              </p>
            </div>
            <Link
              href={`/dashboard?userId=${userId}`}
              className="text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Kembali ke Kalender Karyawan
            </Link>
          </div>
        )}

        {/* Navigation & Presence Selector Header */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Date Nav */}
            <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
              <button
                onClick={() => router.push(`/activity/${prevDateStr}${userId ? `?userId=${userId}` : ''}`)}
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center md:text-left flex-1 md:flex-initial">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Laporan</span>
                <h2 className="text-sm sm:text-lg font-bold text-slate-800 flex items-center justify-center md:justify-start gap-1.5 sm:gap-2 mt-0.5">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{formattedDayFull}</span>
                </h2>
              </div>
              <button
                onClick={() => router.push(`/activity/${nextDateStr}${userId ? `?userId=${userId}` : ''}`)}
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Save Status indicators */}
            <div className="flex items-center gap-4 self-stretch md:self-auto justify-between">
              {saving && (
                <div className="flex items-center gap-1.5 text-xs text-sky-600 font-semibold bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                  <Loader2 size={13} className="animate-spin" />
                  Menyimpan...
                </div>
              )}
              {!saving && activity && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={13} />
                  Tersimpan otomatis
                </div>
              )}
            </div>

          </div>

          <hr className="border-slate-100" />

          {/* Presence Selector */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status Kehadiran Hari Ini
            </span>
            {isViewingOthers ? (
              <div className="flex items-center gap-2">
                {status === 'WFO' && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    <MapPin size={14} className="text-blue-600" />
                    WFO (Work From Office)
                  </span>
                )}
                {status === 'WFH' && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Home size={14} className="text-emerald-600" />
                    WFH (Work From Home)
                  </span>
                )}
                {status === 'LIBUR' && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    <Palmtree size={14} className="text-slate-500" />
                    Libur / Cuti
                  </span>
                )}
                {!status && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle size={14} className="text-amber-600" />
                    Belum Mengisi Kehadiran
                  </span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md">
                <button
                  onClick={() => handleStatusChange('WFO')}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    status === 'WFO'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <MapPin size={16} />
                  WFO
                </button>
                <button
                  onClick={() => handleStatusChange('WFH')}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    status === 'WFH'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Home size={16} />
                  WFH
                </button>
                <button
                  onClick={() => handleStatusChange('LIBUR')}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    status === 'LIBUR'
                      ? 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Palmtree size={16} />
                  LIBUR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Body based on status */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 size={36} className="animate-spin text-sky-500" />
            <span className="text-sm text-slate-400 font-medium mt-3">Memuat aktivitas...</span>
          </div>
        ) : status === 'LIBUR' ? (
          <div className="py-16 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-full">
              <Palmtree size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Hari Ini Libur / Cuti</h3>
              <p className="text-sm text-slate-500 mt-1">
                Anda menandai hari ini sebagai libur. Tidak perlu memasukkan rencana maupun realisasi kegiatan.
              </p>
            </div>
          </div>
        ) : status ? (
          <div className="space-y-6">
            
            {/* Columns Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Planning Column */}
              <ActivityColumn
                title="Planning Kegiatan"
                type="PLAN"
                items={activity?.planItems || []}
                onAddItemClick={() => {
                  setFormType('PLAN');
                  setItemToEdit(null);
                  setIsFormOpen(true);
                }}
                onEditItem={(item) => {
                  setFormType('PLAN');
                  setItemToEdit(item);
                  setIsFormOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                isReadOnly={isViewingOthers}
              />

              {/* Actual Column */}
              <ActivityColumn
                title="Realisasi Kegiatan (Actual)"
                type="ACTUAL"
                items={activity?.actualItems || []}
                onAddItemClick={() => {
                  setFormType('ACTUAL');
                  setItemToEdit(null);
                  setIsFormOpen(true);
                }}
                onEditItem={(item) => {
                  setFormType('ACTUAL');
                  setItemToEdit(item);
                  setIsFormOpen(true);
                }}
                onDeleteItem={handleDeleteItem}
                onCopyFromPlanning={handleCopyFromPlanning}
                showCopyOption={activity ? activity.planItems.length > 0 && activity.actualItems.length === 0 : false}
                isReadOnly={isViewingOthers}
              />

            </div>

            {/* Note Area */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Catatan Harian / Kendala Hari Ini
                </label>
                {!isViewingOthers && (
                  <span className={`text-[10px] font-bold ${note.length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {note.length}/500
                  </span>
                )}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isViewingOthers ? "Tidak ada catatan" : "Tuliskan kendala, blocker, atau catatan penting hari ini..."}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all min-h-[90px] max-h-[160px]"
                maxLength={500}
                disabled={isViewingOthers}
              />
            </div>

            {/* Manager Notes Area */}
            {(session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN' || managerNotes) && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Catatan Manager / Feedback
                  </label>
                  {(session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN') && (
                    <span className={`text-[10px] font-bold ${managerNotes.length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {managerNotes.length}/500
                    </span>
                  )}
                </div>
                <textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder={
                    (session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN')
                      ? "Tuliskan catatan, arahan, atau feedback untuk planning/actual karyawan ini..."
                      : "Belum ada catatan dari manager"
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all min-h-[90px] max-h-[160px]"
                  maxLength={500}
                  disabled={session?.user?.role !== 'MANAGER' && session?.user?.role !== 'ADMIN'}
                />
              </div>
            )}

          </div>
        ) : (
          <div className="py-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto flex flex-col items-center justify-center p-6 space-y-4">
            <AlertCircle size={32} className="text-amber-500 stroke-[1.5]" />
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Kehadiran Belum Diisi</h3>
              <p className="text-sm text-slate-500 mt-1">
                Silakan pilih status kehadiran (WFO, WFH, atau LIBUR) di atas terlebih dahulu untuk memulai pencatatan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Activity Form */}
      <ActivityItemForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
        type={formType}
      />
    </>
  );
}
