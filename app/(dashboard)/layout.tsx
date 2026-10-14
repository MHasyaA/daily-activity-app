'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/components/providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Fixed */}
      <Suspense fallback={<aside className="w-64 bg-slate-900 h-screen fixed top-0 bottom-0 left-0" />}>
        <Sidebar />
      </Suspense>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-25 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
