'use client';

import React from 'react';

interface PieChartData {
  category: string;
  hours: number;
  percentage: number;
}

interface CategoryPieChartProps {
  data: PieChartData[];
  title?: string;
}

const categoryConfig: Record<string, { color: string; label: string; stroke: string }> = {
  MEETING: { color: 'bg-sky-500', label: 'Meeting', stroke: '#0ea5e9' },
  TASK: { color: 'bg-emerald-500', label: 'Task', stroke: '#10b981' },
  REVIEW: { color: 'bg-amber-500', label: 'Review', stroke: '#f59e0b' },
  TRAINING: { color: 'bg-purple-500', label: 'Training', stroke: '#8b5cf6' },
  OTHER: { color: 'bg-slate-500', label: 'Lainnya', stroke: '#64748b' },
};

export default function CategoryPieChart({ data, title = 'Persentase Kategori Kerja' }: CategoryPieChartProps) {
  const totalHours = data.reduce((acc, curr) => acc + curr.hours, 0);

  // If no data or total hours is 0, render empty state
  if (totalHours === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="font-bold text-slate-800 text-sm mb-4 self-start">{title}</h3>
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Simple gray empty ring */}
          <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Jam</span>
            <p className="text-base font-black text-slate-500">0 jam</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-6">Belum ada data realisasi kegiatan</p>
      </div>
    );
  }

  // Calculate Dasharray and Dashoffset for each segment
  let accumulatedPercent = 0;
  const segments = data
    .map((item) => {
      const config = categoryConfig[item.category] || categoryConfig.OTHER;
      const percentage = item.percentage;
      const strokeDasharray = `${percentage} ${100 - percentage}`;
      // svg starting offset at top (12 o'clock) is 25.
      // We go clockwise, which means subtracting accumulated percentage.
      const rawOffset = 100 - accumulatedPercent + 25;
      const strokeDashoffset = rawOffset % 100;
      accumulatedPercent += percentage;

      return {
        ...item,
        label: config.label,
        strokeColor: config.stroke,
        bgColor: config.color,
        strokeDasharray,
        strokeDashoffset,
      };
    })
    .sort((a, b) => b.percentage - a.percentage); // Sort largest percentage first for visual consistency

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-stretch hover:shadow-md transition-all duration-200 hover:border-slate-300">
      
      {/* Chart Section */}
      <div className="flex flex-col justify-between flex-1 w-full">
        <h3 className="font-bold text-slate-800 text-sm mb-4">{title}</h3>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg viewBox="0 0 42 42" className="w-full h-full">
              {/* Donut Hole Background */}
              <circle cx="21" cy="21" r="15.91549430918954" fill="#ffffff" />
              
              {/* Base ring */}
              <circle
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="4"
              />

              {/* Segments */}
              {segments.map((seg) => (
                <circle
                  key={seg.category}
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={seg.strokeColor}
                  strokeWidth="4"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-500 ease-out hover:stroke-[5] cursor-pointer"
                  style={{ transformOrigin: 'center' }}
                >
                  <title>{`${seg.label}: ${seg.percentage.toFixed(1)}%`}</title>
                </circle>
              ))}
            </svg>

            {/* Centered Total */}
            <div className="absolute text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Actual</span>
              <p className="text-base font-black text-slate-800 leading-tight">{totalHours.toFixed(1)} jam</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Section */}
      <div className="flex flex-col justify-center gap-3 w-full md:w-48 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
        {segments.map((seg) => (
          <div key={seg.category} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${seg.bgColor} shrink-0`} />
              <span className="font-semibold text-slate-600 truncate max-w-[100px]" title={seg.label}>
                {seg.label}
              </span>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-slate-800">{seg.percentage.toFixed(0)}%</span>
              <p className="text-[9px] text-slate-400 font-medium">{seg.hours.toFixed(1)} j</p>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
