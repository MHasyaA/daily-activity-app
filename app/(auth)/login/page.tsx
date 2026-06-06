'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Lock, Mail, Loader2 } from 'lucide-react';

import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password salah. Silakan coba lagi.');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan sistem. Silakan hubungi admin.');
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
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20 mb-3.5">
            <Calendar size={28} className="stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Daily Activity App</h2>
          <p className="text-sm text-slate-400 mt-1">Silakan masuk untuk mencatat aktivitas harian Anda</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Email Perusahaan
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 focus:border-sky-500 focus:bg-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
              />
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 focus:border-sky-500 focus:bg-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
              />
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white text-sm font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Memproses...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Belum punya akun? Daftar
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center pt-2">
          <p className="text-xs text-slate-500">
            PT Internal Tool &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
