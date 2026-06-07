import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma, Status } from '@prisma/client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Topbar from '@/components/layout/Topbar';
import Link from 'next/link';
import { Download, Calendar, FileText, ChevronRight } from 'lucide-react';
import { calculateDuration, formatHours } from '@/lib/utils';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; status?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin/overview');
  }

  const currentYear = new Date().getFullYear();
  const monthParam = searchParams.month || '';
  const yearParam = searchParams.year || currentYear.toString();
  const statusParam = searchParams.status || 'ALL';
  const q = searchParams.q || '';

  // Construct filtering dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (monthParam) {
    const startStr = `${yearParam}-${monthParam.padStart(2, '0')}-01`;
    startDate = new Date(startStr);
    
    const nextMonth = parseInt(monthParam) === 12 ? 1 : parseInt(monthParam) + 1;
    const nextYear = parseInt(monthParam) === 12 ? parseInt(yearParam) + 1 : parseInt(yearParam);
    const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    endDate = new Date(endStr);
  } else {
    startDate = new Date(`${yearParam}-01-01`);
    endDate = new Date(`${parseInt(yearParam) + 1}-01-01`);
  }

  // Build prisma query clause
  const whereClause: Prisma.ActivityWhereInput = {
    userId: session.user.id,
    date: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (statusParam !== 'ALL') {
    whereClause.status = statusParam as Status;
  }

  if (q) {
    whereClause.OR = [
      { note: { contains: q, mode: 'insensitive' } },
      {
        planItems: {
          some: { description: { contains: q, mode: 'insensitive' } }
        }
      },
      {
        actualItems: {
          some: { description: { contains: q, mode: 'insensitive' } }
        }
      }
    ];
  }

  // Fetch from database
  const activities = await prisma.activity.findMany({
    where: whereClause,
    include: {
      planItems: {
        where: { type: 'PLAN' },
      },
      actualItems: {
        where: { type: 'ACTUAL' },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const monthOptions = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktber' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Form URL for CSV export
  const startISO = format(startDate, 'yyyy-MM-dd');
  const endISO = format(endDate, 'yyyy-MM-dd');
  const csvExportUrl = `/api/export/csv?userId=${session.user.id}&startDate=${startISO}&endDate=${endISO}`;

  return (
    <>
      <Topbar title="Riwayat Aktivitas Anda" />

      <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
        
        {/* Filter Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form method="GET" action="/activity/history" className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="space-y-1.5 col-span-1 sm:col-span-4 md:col-span-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cari Kegiatan / Catatan
              </label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Contoh: meeting, project..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              />
            </div>

            {/* Month Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bulan
              </label>
              <select
                name="month"
                defaultValue={monthParam}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tahun
              </label>
              <select
                name="year"
                defaultValue={yearParam}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              >
                {yearOptions.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kehadiran
              </label>
              <div className="flex gap-2">
                <select
                  name="status"
                  defaultValue={statusParam}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="WFO">WFO</option>
                  <option value="WFH">WFH</option>
                  <option value="LIBUR">Libur</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/10 transition-colors"
                >
                  Cari
                </button>
              </div>
            </div>
            
          </form>
        </div>

        {/* History Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                Daftar Riwayat Aktivitas
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Menampilkan {activities.length} hari terisi
              </p>
            </div>
            <a
              href={csvExportUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Download size={14} />
              Export ke CSV
            </a>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {activities.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                    <th className="px-6 py-4">Hari & Tanggal</th>
                    <th className="px-6 py-4">Kehadiran</th>
                    <th className="px-6 py-4 text-center">Plan</th>
                    <th className="px-6 py-4 text-center">Actual</th>
                    <th className="px-6 py-4">Catatan / Kendala</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {activities.map((act) => {
                    const planHours = act.planItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
                    const actualHours = act.actualItems.reduce((acc, item) => acc + calculateDuration(item.startTime, item.endTime), 0);
                    const formattedDate = format(new Date(act.date), 'EEEE, dd MMM yyyy', { locale: localeId });
                    const dateUrl = format(new Date(act.date), 'yyyy-MM-dd');

                    return (
                      <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/activity/${dateUrl}`} className="hover:text-sky-600 transition-colors font-bold text-slate-800">
                            {formattedDate}
                          </Link>
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
                        <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-400 font-normal">
                          {act.note || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/activity/${dateUrl}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                          >
                            Edit
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-24 text-center px-4 flex flex-col items-center justify-center text-slate-400">
                <FileText size={32} className="text-slate-200 stroke-[1.5] mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Tidak ada aktivitas ditemukan</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Silakan sesuaikan filter pencarian atau mulai mencatat aktivitas hari ini.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  );
}
