'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Anchor, Shield, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface Captcha {
  id: string;
  query_string: string;
  answer_hash: string;
  used: boolean;
}

// Client-side SHA-256 mapping
async function hashAnswer(value: string): Promise<string> {
  const cleanVal = value.trim().toLowerCase();
  const msgBuffer = new TextEncoder().encode(cleanVal);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function RegisterPage() {
  const router = useRouter();
  
  // Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Setup sample challenge fallback in case database table is empty or missing
  const loadCaptchaChallenge = async () => {
    setLoadingCaptcha(true);
    setErrorMsg('');
    try {
      // Query an unused captcha out of public.captcha_challenges
      const { data, error } = await supabase
        .from('captcha_challenges')
        .select('*')
        .eq('used', false)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // If table doesn't have rows or fails, offer a standard resilient fallback challenge
        // answer is 'compass' or 'anchor' or 'sovereign'
        const questions = [
          { q: "What tool guides a sailor across the open sea? (Hint: c_ _ _ _ s s)", a: "compass" },
          { q: "What iron device anchors a ship to the harbor? (Hint: a_ _ _ _ r)", a: "anchor" },
          { q: "What is the second word of this forum's title 'SOVEREIGN WIND'? (Hint: w_ _ _)", a: "wind" }
        ];
        const selected = questions[Math.floor(Math.random() * questions.length)];
        const hashed = await hashAnswer(selected.a);
        
        setCaptcha({
          id: 'fallback-' + Math.random(),
          query_string: selected.q,
          answer_hash: hashed,
          used: false
        });
      } else {
        setCaptcha(data as Captcha);
      }
    } catch {
      // Catch-all fallback
      const hashed = await hashAnswer('wind');
      setCaptcha({
        id: 'fallback-emergency',
        query_string: "What is the second word of this forum's title 'SOVEREIGN WIND'?",
        answer_hash: hashed,
        used: false
      });
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCaptchaChallenge();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // --- Validation Rules ---
    // At least 8 characters
    if (password.length < 8) {
      setErrorMsg('Password must contain at least 8 characters.');
      return;
    }
    // At least 1 uppercase letter
    if (!/[A-Z]/.test(password)) {
      setErrorMsg('Password must contain at least 1 uppercase letter.');
      return;
    }
    // At least 1 specialized syntax symbol (special char)
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setErrorMsg('Password must contain at least 1 special character symbol.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!username.trim() || username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (!captchaAnswer.trim()) {
      setErrorMsg('Please solve the maritime captcha security prompt.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Verify captcha answer
      const userHash = await hashAnswer(captchaAnswer);
      if (captcha && userHash !== captcha.answer_hash) {
        setErrorMsg('Invalid captcha response. Confirm your nautical terminology.');
        setSubmitting(false);
        return;
      }

      // 2. Mark Captcha as used in the database
      if (captcha && !captcha.id.startsWith('fallback-')) {
        await supabase
          .from('captcha_challenges')
          .update({ used: true })
          .eq('id', captcha.id);
      }

      // 3. Supabase Auth sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          }
        }
      });

      if (authError || !authData.user) {
        setErrorMsg(authError?.message || 'Failed to enroll into user directory.');
        setSubmitting(false);
        return;
      }

      // 4. Create public profile inside public.users
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            username: username.trim(),
            points: 10, // Starting point bonus
            role: 'Deckhand',
            email: email.trim(),
          }
        ]);

      if (profileError) {
        // If it fails because of schema rules, we can log it, but they might be signed up
        console.warn('Profile sync warn:', profileError.message);
      }

      setSuccessMsg('Successfully recruited! Redirecting to the bridge...');
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected storm hit our navigation channels.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md bg-[#161b22] border border-[#21262d] rounded-lg p-6 space-y-6 shadow-2xl">
        
        {/* Title Group */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-[#e6edf3] hover:text-[#d4a843] transition-colors">
            <span className="text-xl">⚓</span>
            <span className="text-sm uppercase tracking-widest text-[#d4a843]">SOVEREIGN WIND</span>
          </Link>
          <h2 className="text-base text-[#e6edf3] font-medium uppercase tracking-wider">Join the Crew</h2>
          <p className="text-[12px] text-[#7d8590] uppercase tracking-wider font-normal">Chart the Sovereign Independent Web</p>
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
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-normal">
          
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
              Callsign / Username
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              placeholder="EX: CAPTAIN_MORGAN"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] uppercase tracking-wider placeholder-[#484f58] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
              Communication Relay Email
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
              className="w-full h-10 pl-3 pr-10 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-7 text-[#7d8590] hover:text-[#e6edf3] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <span className="block text-[10px] text-[#7d8590] uppercase tracking-wider mt-1 text-right">
              Min 8 Char, 1 Uppercase, 1 Special Symbol
            </span>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
              Confirm Secret Key
            </label>
            <input
              type="password"
              required
              disabled={submitting}
              placeholder="•••••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none transition-colors"
            />
          </div>

          {/* Verification Challenge Container */}
          <div className="p-3.5 bg-[#0d1117] border border-[#21262d] rounded-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#d4a843] font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> SECURE MARITIME CAPTCHA
              </span>
              <button
                type="button"
                onClick={loadCaptchaChallenge}
                disabled={loadingCaptcha}
                className="text-[#7d8590] hover:text-[#d4a843] disabled:text-[#484f58] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCaptcha ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-[11px] font-medium text-[#c9d1d9] select-text">
              {loadingCaptcha ? 'FETCHING CHALLENGE METRICS...' : captcha?.query_string}
            </p>

            <input
              type="text"
              required
              disabled={submitting}
              placeholder="ENTER SYSTEM RESPONSE..."
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="w-full h-9 px-2.5 bg-[#161b22] border border-[#21262d] focus:border-[#d4a843] rounded text-[11px] text-[#e6edf3] uppercase tracking-widest placeholder-[#484f58] focus:outline-none"
            />
            <span className="block text-[9px] text-[#7d8590] uppercase tracking-widest text-right">
              Validated on submit with SHA-256 hash
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-[#d4a843] text-[#1a1200] hover:bg-opacity-95 font-medium uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'RECRUITING CREW...' : 'Enlist Into Crew'}
          </button>
        </form>

        <div className="border-t border-[#21262d]/50 my-1"></div>

        <p className="text-center text-[11px] uppercase tracking-wider text-[#7d8590]">
          Already enlisted aboard?{' '}
          <Link href="/login" className="text-[#58a6ff] hover:text-[#e6edf3] ml-1 hover:underline">
            REPORT TO BRIDGE
          </Link>
        </p>
      </div>
    </div>
  );
}
