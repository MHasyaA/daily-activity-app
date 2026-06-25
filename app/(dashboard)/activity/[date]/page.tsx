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
  Calendar,
  Clock
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import ActivityColumn from '@/components/activity/ActivityColumn';
import ActivityItemForm from '@/components/activity/ActivityItemForm';
import { ActivityItemData } from '@/components/activity/ActivityItemCard';

interface ActivityData {
  id: string;
  status: 'WFO' | 'WFH' | 'LIBUR' | 'GANTI_LIBUR';
  note: string | null;
  attachments: { id: string; url: string }[];
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
  const [status, setStatus] = useState<'WFO' | 'WFH' | 'LIBUR' | 'GANTI_LIBUR' | ''>('');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; url: string }[]>([]);
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
        setAttachments(data.activity.attachments || []);
        setManagerNotes(data.activity.managerNotes || '');
      } else {
        setActivity(null);
        setStatus('');
        setNote('');
        setAttachments([]);
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
  const handleStatusChange = async (newStatus: 'WFO' | 'WFH' | 'LIBUR' | 'GANTI_LIBUR') => {
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

  // Handle adding an attachment
  const handleAddAttachment = async (base64Data: string) => {
    if (!activity) return;
    setSaving(true);
    try {
      const res = await fetch('/api/activity/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activityId: activity.id,
          attachment: base64Data 
        }),
      });
      const data = await res.json();
      if (res.ok && data.attachment) {
        setAttachments(prev => [...prev, data.attachment]);
        setActivity(prev => prev ? {
          ...prev,
          attachments: [...prev.attachments, data.attachment]
        } : null);
      } else {
        alert(data.error || 'Gagal mengunggah gambar.');
      }
    } catch (err) {
      console.error('Error saving attachment:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle deleting an attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Hapus lampiran gambar ini?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/activity/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
        setActivity(prev => prev ? {
          ...prev,
          attachments: prev.attachments.filter(att => att.id !== attachmentId)
        } : null);
      } else {
        alert('Gagal menghapus gambar.');
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
    } finally {
      setSaving(false);
    }
  };

  // Process image with compression
  const processImageFile = async (file: File) => {
    if (attachments.length >= 5) {
      alert('Maksimal 5 lampiran gambar diperbolehkan.');
      return;
    }
    setSaving(true);
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const options = {
        maxSizeMB: 0.1, // limit to 100KB
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        handleAddAttachment(base64data);
      };
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Gagal memproses dan mengompresi gambar.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault(); // Prevent pasting the image binary as text in the textarea
          processImageFile(file);
          break;
        }
      }
    }
  };

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
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm font-semibold">
                Anda sedang melihat detail aktivitas dari <strong>{targetUser.name}</strong>.
              </p>
            </div>
            <Link
              href={`/dashboard?userId=${userId}`}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
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
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
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
                {status === 'GANTI_LIBUR' && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                    <Clock size={14} className="text-amber-600" />
                    Ganti Libur
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-lg">
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
                  onClick={() => handleStatusChange('GANTI_LIBUR')}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    status === 'GANTI_LIBUR'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Clock size={16} />
                  GANTI LIBUR
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
            <Loader2 size={36} className="animate-spin text-rose-500" />
            <span className="text-sm text-slate-400 font-medium mt-3">Memuat aktivitas...</span>
          </div>
        ) : status === 'LIBUR' || status === 'GANTI_LIBUR' ? (
          <div className="py-16 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-full">
              {status === 'LIBUR' ? <Palmtree size={32} /> : <Clock size={32} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {status === 'LIBUR' ? 'Hari Ini Libur / Cuti' : 'Hari Ini Ganti Libur'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {status === 'LIBUR' 
                  ? 'Anda menandai hari ini sebagai libur. Tidak perlu memasukkan rencana maupun realisasi kegiatan.'
                  : 'Anda menandai hari ini sebagai ganti libur. Jam planning telah otomatis ditambah 8 jam.'}
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
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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
                onPaste={!isViewingOthers ? handlePaste : undefined}
                placeholder={isViewingOthers ? "Tidak ada catatan" : "Tuliskan kendala, blocker, atau catatan penting hari ini..."}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all min-h-[90px] max-h-[160px]"
                maxLength={500}
                disabled={isViewingOthers}
              />

              {/* Attachment Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Lampiran Bukti Kerja / Screenshot ({attachments.length}/5)
                  </span>
                </div>
                
                {/* Image Thumbnails Grid */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {attachments.map((att, idx) => (
                      <div key={att.id} className="relative group bg-slate-50 p-1.5 border border-slate-200 rounded-xl flex flex-col items-center">
                        <a 
                          href={att.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="relative h-20 w-full overflow-hidden rounded-lg border border-slate-200 cursor-pointer group"
                        >
                          <img src={att.url} alt={`Bukti ${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white">
                            Buka
                          </div>
                        </a>
                        {!isViewingOthers && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="mt-1.5 w-full py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[9px] font-bold rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {!isViewingOthers && attachments.length < 5 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 hover:border-slate-350 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm w-fit text-center">
                        Pilih File Gambar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={attachments.length >= 5}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Atau tekan Ctrl+V (Paste) gambar screenshot langsung di kotak catatan.
                      </span>
                    </div>
                  </div>
                )}

                {isViewingOthers && attachments.length === 0 && (
                  <p className="text-xs text-slate-400 font-medium italic">Tidak ada lampiran gambar.</p>
                )}
              </div>
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all min-h-[90px] max-h-[160px]"
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
                Silakan pilih status kehadiran di atas terlebih dahulu untuk memulai pencatatan.
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
