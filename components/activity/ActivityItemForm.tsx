'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { calculateDuration } from '@/lib/utils';
import { ActivityItemData } from './ActivityItemCard';

interface ActivityItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ActivityItemData, 'id' | 'activityId'> & { id?: string }) => void;
  itemToEdit?: ActivityItemData | null;
  type: 'PLAN' | 'ACTUAL';
}

export default function ActivityItemForm({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  type,
}: ActivityItemFormProps) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'MEETING' | 'TASK' | 'REVIEW' | 'TRAINING' | 'OTHER'>('TASK');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when itemToEdit changes
  useEffect(() => {
    if (itemToEdit) {
      setStartTime(itemToEdit.startTime);
      setEndTime(itemToEdit.endTime);
      setDescription(itemToEdit.description);
      setCategory(itemToEdit.category);
    } else {
      // Set sensible defaults
      setStartTime('08:00');
      setEndTime('09:00');
      setDescription('');
      setCategory('TASK');
    }
    setError(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!startTime || !endTime) {
      setError('Jam mulai dan jam selesai wajib diisi.');
      return;
    }

    if (!description.trim()) {
      setError('Deskripsi kegiatan wajib diisi.');
      return;
    }

    if (description.length > 200) {
      setError('Deskripsi kegiatan tidak boleh lebih dari 200 karakter.');
      return;
    }

    const duration = calculateDuration(startTime, endTime);
    if (duration <= 0) {
      setError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }

    onSave({
      id: itemToEdit?.id,
      startTime,
      endTime,
      description: description.trim(),
      category,
      type,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-250 z-10">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">
            {itemToEdit ? 'Edit Kegiatan' : `Tambah Kegiatan ${type === 'PLAN' ? 'Planning' : 'Actual'}`}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Time Picker Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jam Mulai
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
                  required
                />
                <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jam Selesai
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
                  required
                />
                <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Kategori Kegiatan
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'MEETING' | 'TASK' | 'REVIEW' | 'TRAINING' | 'OTHER')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
            >
              <option value="TASK">Tugas / Pengerjaan Projek</option>
              <option value="MEETING">Meeting / Sync-up</option>
              <option value="REVIEW">Review / Testing</option>
              <option value="TRAINING">Training / Pembelajaran</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Deskripsi Kegiatan
              </label>
              <span className={`text-[10px] font-bold ${description.length > 200 ? 'text-rose-500' : 'text-slate-400'}`}>
                {description.length}/200
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Mengerjakan modul autentikasi NextAuth, meeting harian tim engineering..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-sm font-medium text-slate-700 outline-none transition-all min-h-[100px] max-h-[180px]"
              maxLength={200}
              required
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-600/10 transition-colors"
            >
              {itemToEdit ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
