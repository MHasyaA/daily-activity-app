import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates duration in hours between two time strings in "HH:MM" format
 */
export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (endMinutes <= startMinutes) return 0;
  
  // Potong otomatis jika ada irisan dengan jam istirahat 12:00 (720m) - 13:00 (780m)
  const overlap = Math.max(0, Math.min(endMinutes, 780) - Math.max(startMinutes, 720));
  
  return (endMinutes - startMinutes - overlap) / 60;
}

/**
 * Formats a decimal hour number to a readable string (e.g., 2.5 -> "2.5 jam", 2 -> "2 jam")
 */
export function formatHours(hours: number): string {
  if (hours <= 0) return '0 jam';
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded} jam`;
}
