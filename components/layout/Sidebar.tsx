'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  History, 
  Users, 
  BarChart, 
  LogOut, 
  Calendar 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isManagerOrAdmin = 
    session?.user?.role === 'ADMIN' || 
    session?.user?.role === 'MANAGER';

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'History', href: '/activity/history', icon: History },
  ];

  const adminItems = [
    { name: 'Team Dashboard', href: '/admin/dashboard', icon: Users },
    { name: 'Export Reports', href: '/admin/report', icon: BarChart },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="p-2 bg-sky-500 rounded-lg text-white">
          <Calendar size={20} className="stroke-[2.5]" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          DailyActivity
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
        <div>
          <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/20'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'stroke-[2.5]' : ''} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {isManagerOrAdmin && (
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Management ({session?.user?.role})
            </h3>
            <ul className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/20'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'stroke-[2.5]' : ''} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Footer info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 border border-slate-600">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {session?.user?.division || 'Employee'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors border border-dashed border-rose-900/40"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
