'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Anchor, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please specify both your email resources and secret key.');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setErrorMsg(error.message || 'Verification of navigational key failed.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Navigational keys accepted! Reporting to the bridge...');
      setTimeout(() => {
        router.push('/');
        // Trigger page refresh or hook dispatch to sync session across app
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('supabase-auth-change'));
        }
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'A spatial navigation anomaly was encountered.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md bg-[#161b22] border border-[#21262d] rounded-lg p-6 space-y-6 shadow-2xl">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-[#e6edf3] hover:text-[#d4a843] transition-colors">
            <span className="text-xl">⚓</span>
            <span className="text-sm uppercase tracking-widest text-[#d4a843]">SOVEREIGN WIND</span>
          </Link>
          <h2 className="text-base text-[#e6edf3] font-medium uppercase tracking-wider">Bridge Login</h2>
          <p className="text-[12px] text-[#7d8590] uppercase tracking-wider font-normal">Re-establish Sovereign Comm Channels</p>
        </div>

        {/* Status Indicators */}
        {errorMsg && (
          <div className="p-3 bg-[#1a1313] border border-[#f85149]/30 rounded flex items-start gap-2.5 text-[#f85149] text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-normal select-text">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[#121c17] border border-[#3fb950]/30 rounded flex items-start gap-2.5 text-[#3fb950] text-xs leading-relaxed">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-normal">{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-normal">
          
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              disabled={submitting}
              placeholder="COMS@SOVEREIGNWIND.NET"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] uppercase tracking-wider placeholder-[#484f58] focus:outline-none transition-colors"
            />
          </div>

          <div className="relative">
            <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
              Nautical Secret Key (Password)
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={submitting}
              placeholder="•••••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 pl-3 pr-10 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-7 text-[#7d8590] hover:text-[#e6edf3]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-[#d4a843] text-[#1a1200] hover:bg-opacity-95 font-medium uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'VALIDATING SECURITY...' : 'Report To Bridge'}
          </button>
        </form>

        <div className="border-t border-[#21262d]/50 my-1"></div>

        <p className="text-center text-[11px] uppercase tracking-wider text-[#7d8590]">
          Lost in dead space channels?{' '}
          <Link href="/register" className="text-[#58a6ff] hover:text-[#e6edf3] ml-1 hover:underline">
            ENLIST NEW COMS
          </Link>
        </p>
      </div>
    </div>
  );
}
