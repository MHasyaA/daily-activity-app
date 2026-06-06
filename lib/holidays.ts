import { format } from 'date-fns';

// Map of date strings (YYYY-MM-DD) to Holiday Names in Indonesia for 2025 & 2026
const HOLIDAYS_MAP: Record<string, string> = {
  // --- 2025 ---
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
  '2025-01-28': 'Cuti Bersama Tahun Baru Imlek 2576 Kongzili',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-28': 'Cuti Bersama Hari Suci Nyepi Saka 1947',
  '2025-03-29': 'Hari Suci Nyepi (Tahun Baru Saka 1947)',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-02': 'Cuti Bersama Hari Raya Idul Fitri 1446 H',
  '2025-04-03': 'Cuti Bersama Hari Raya Idul Fitri 1446 H',
  '2025-04-04': 'Cuti Bersama Hari Raya Idul Fitri 1446 H',
  '2025-04-07': 'Cuti Bersama Hari Raya Idul Fitri 1446 H',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-13': 'Cuti Bersama Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-05-30': 'Cuti Bersama Kenaikan Yesus Kristus',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-07': 'Hari Raya Idul Adha 1446 H',
  '2025-06-09': 'Cuti Bersama Hari Raya Idul Adha 1446 H',
  '2025-06-27': 'Tahun Baru Islam 1447 H',
  '2025-08-17': 'Hari Kemerdekaan RI',
  '2025-08-18': 'Cuti Bersama Hari Kemerdekaan RI',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Hari Raya Natal',
  '2025-12-26': 'Cuti Bersama Hari Raya Natal',

  // --- 2026 ---
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-02-16': 'Cuti Bersama Tahun Baru Imlek 2577 Kongzili',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-18': 'Cuti Bersama Hari Suci Nyepi Saka 1948',
  '2026-03-19': 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
  '2026-03-20': 'Cuti Bersama Hari Raya Idul Fitri 1447 H',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-22': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-23': 'Cuti Bersama Hari Raya Idul Fitri 1447 H',
  '2026-03-24': 'Cuti Bersama Hari Raya Idul Fitri 1447 H',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Kebangkitan Yesus Kristus (Paskah)',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-15': 'Cuti Bersama Kenaikan Yesus Kristus',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-05-28': 'Cuti Bersama Hari Raya Idul Adha 1447 H',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-17': 'Hari Kemerdekaan RI',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-24': 'Cuti Bersama Hari Raya Natal',
  '2026-12-25': 'Hari Raya Natal',
};

/**
 * Checks if a given date is an Indonesian national holiday or cuti bersama.
 */
export function isIndonesianHoliday(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  return !!HOLIDAYS_MAP[dateStr];
}

/**
 * Returns the holiday name for a given date if it is an Indonesian national holiday,
 * otherwise returns null.
 */
export function getHolidayInfo(date: Date): string | null {
  const dateStr = format(date, 'yyyy-MM-dd');
  return HOLIDAYS_MAP[dateStr] || null;
}
