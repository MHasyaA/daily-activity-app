'use client';

import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();
  const currentDateString = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed right-0 top-0 left-64 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-700">{currentDateString}</p>
          <p className="text-xs text-slate-400">Hari Kerja</p>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800">
              {session?.user?.name}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {session?.user?.role}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm">
            {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'US'}
          </div>
        </div>
      </div>
    </header>
  );
}
