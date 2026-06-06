'use client';

import { Edit2, Trash2, Clock } from 'lucide-react';
import { calculateDuration, formatHours } from '@/lib/utils';

export interface ActivityItemData {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  category: 'MEETING' | 'TASK' | 'REVIEW' | 'TRAINING' | 'OTHER';
  type: 'PLAN' | 'ACTUAL';
  activityId: string;
}

interface ActivityItemCardProps {
  item: ActivityItemData;
  onEdit?: (item: ActivityItemData) => void;
  onDelete?: (id: string) => void;
  isReadOnly?: boolean;
}

export default function ActivityItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  isReadOnly = false 
}: ActivityItemCardProps) {
  const duration = calculateDuration(item.startTime, item.endTime);

  const categoryConfigs = {
    MEETING: { label: 'Meeting', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    TASK: { label: 'Tugas', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    REVIEW: { label: 'Review', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    TRAINING: { label: 'Training', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    OTHER: { label: 'Lainnya', style: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const config = categoryConfigs[item.category] || categoryConfigs.OTHER;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all duration-200 p-4">
      <div className="flex justify-between items-start gap-4">
        {/* Time & Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-100 text-slate-700">
            <Clock size={12} className="text-slate-400" />
            {item.startTime} - {item.endTime}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.style}`}>
            {config.label}
          </span>
        </div>

        {/* Action Buttons */}
        {!isReadOnly && onEdit && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors"
              title="Edit Item"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              title="Hapus Item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-slate-700 font-medium leading-relaxed break-words whitespace-pre-line">
        {item.description}
      </p>

      {/* Footer Info (Duration) */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Durasi
        </span>
        <span className="text-xs font-bold text-slate-600">
          {formatHours(duration)}
        </span>
      </div>
    </div>
  );
}
