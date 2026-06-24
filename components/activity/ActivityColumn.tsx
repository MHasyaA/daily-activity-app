'use client';

import { Plus, Copy, AlertCircle } from 'lucide-react';
import ActivityItemCard, { ActivityItemData } from './ActivityItemCard';
import { calculateDuration, formatHours } from '@/lib/utils';

interface ActivityColumnProps {
  title: string;
  type: 'PLAN' | 'ACTUAL';
  items: ActivityItemData[];
  onAddItemClick: () => void;
  onEditItem: (item: ActivityItemData) => void;
  onDeleteItem: (id: string) => void;
  onCopyFromPlanning?: () => void;
  showCopyOption?: boolean;
  isReadOnly?: boolean;
}

export default function ActivityColumn({
  title,
  items,
  onAddItemClick,
  onEditItem,
  onDeleteItem,
  onCopyFromPlanning,
  showCopyOption = false,
  isReadOnly = false,
}: ActivityColumnProps) {
  // Calculate total hours
  const totalHours = items.reduce((total, item) => {
    return total + calculateDuration(item.startTime, item.endTime);
  }, 0);

  return (
    <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-6 flex flex-col h-full">
      {/* Column Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            {title}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Total: <span className="font-bold text-slate-700">{formatHours(totalHours)}</span>
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {showCopyOption && onCopyFromPlanning && (
              <button
                onClick={onCopyFromPlanning}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors shadow-sm"
                title="Salin semua kegiatan dari planning ke actual"
              >
                <Copy size={13} />
                Salin dari Planning
              </button>
            )}

            <button
              onClick={onAddItemClick}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors shadow-sm"
              title="Tambah Kegiatan"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
        {items.length > 0 ? (
          items
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((item) => (
              <ActivityItemCard
                key={item.id}
                item={item}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                isReadOnly={isReadOnly}
              />
            ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-white rounded-xl border border-dashed border-slate-200/85 text-slate-400">
            <AlertCircle size={24} className="text-slate-300 stroke-[1.5] mb-2" />
            <p className="text-xs font-medium">Belum ada kegiatan</p>
            {!isReadOnly && (
              <button
                onClick={onAddItemClick}
                className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
              >
                + Tambah Sekarang
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
