'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Lock, Mail, User, Briefcase, Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [division, setDivision] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const divisionOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'IT Operations', label: 'IT Operations' },
    { value: 'HRD', label: 'HRD' },
    { value: 'Finance', label: 'Finance' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, division }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan saat pendaftaran.');
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Gagal menghubungi server. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 px-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20 mb-3">
            <Calendar size={28} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Daftar Akun Baru</h2>
          <p className="text-sm text-slate-400 mt-1">Lengkapi data untuk mendaftar sebagai Karyawan</p>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h3 className="font-bold text-white">Pendaftaran Berhasil!</h3>
            <p className="text-sm text-slate-400">Anda akan diarahkan ke halaman login...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs font-semibold text-center">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-sky-500 focus:bg-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
                />
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Email Perusahaan
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@company.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-sky-500 focus:bg-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
                />
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Divisi Kerja
              </label>
              <div className="relative">
                <select
                  required
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-sky-500 focus:bg-white/10 rounded-2xl text-sm font-medium text-white outline-none transition-all appearance-none"
                >
                  <option value="" disabled className="text-slate-900 bg-white">Pilih Divisi</option>
                  {divisionOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">{opt.label}</option>
                  ))}
                </select>
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-sky-500 focus:bg-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
                />
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white text-sm font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            Sudah punya akun? Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
