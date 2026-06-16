'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { getMaritimeRank } from '../lib/utils';
import './globals.css'; // Global styles

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileLocal = async (userId: string, currentSession?: any) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          setUserProfile(data);
        } else {
          setUserProfile({
            username: currentSession?.user?.user_metadata?.username || 'Navigator',
            points: 10,
            role: 'Deckhand'
          });
        }
      } catch {
        setUserProfile({
          username: 'Navigator',
          points: 0,
          role: 'Deckhand'
        });
      }
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfileLocal(session.user.id, session);
      }
      setLoading(false);
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchProfileLocal(currentSession.user.id, currentSession);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // 3. Custom event listener for custom triggers
    const handleAuthChange = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchProfileLocal(session.user.id, session);
        }
      });
    };
    window.addEventListener('supabase-auth-change', handleAuthChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('supabase-auth-change', handleAuthChange);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    router.push('/');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-sync'));
    }
  };

  // Get rank dynamically from profile points
  const rankInfo = getMaritimeRank(userProfile?.points || 0);

  return (
    <html lang="en" className="h-full">
      <head>
        <title>SOVEREIGN WIND — Maritime Voyage Dashboard</title>
        <meta name="description" content="Chart your course, sail the web. A tactical nautical web forum." />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-[#0d1117] text-[#e6edf3] antialiased selection:bg-[#d4a843] selection:text-[#1a1200]"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          lineHeight: '1.6',
        }}
      >
        <div id="app-root" className="flex flex-col min-h-screen">
          {/* Sticky Header */}
          <header
            id="sticky-header"
            className="sticky top-0 z-50 h-[52px] bg-[#161b22] border-b border-[#21262d] select-none"
          >
            <div className="max-w-[1100px] h-full mx-auto px-4 flex items-center justify-between">
              
              {/* Left Side (Logo Info) */}
              <Link href="/" id="header-logo-container" className="flex items-center gap-3 cursor-pointer">
                <span id="header-anchor" className="text-base select-none">⚓</span>
                <div id="header-title-group" className="flex items-baseline gap-2.5">
                  <span id="header-ship-name" className="font-medium text-[#e6edf3] tracking-wide text-[13px] md:text-[14px]">
                    SOVEREIGN WIND
                  </span>
                  <span
                    id="header-sublabel"
                    className="text-[11px] font-normal uppercase tracking-wider text-[#7d8590] hidden md:inline-block border-l border-[#21262d] pl-2.5"
                  >
                    Chart your course · Sail the web
                  </span>
                </div>
              </Link>

              {/* Right Side (Navigation Links) */}
              <nav
                id="header-nav"
                className="flex items-center gap-3.5 text-[11px] md:text-[12px] uppercase tracking-wider font-normal"
              >
                <Link
                  href="/"
                  id="nav-voyages"
                  className="text-[#c9d1d9] hover:text-[#e6edf3] transition-colors font-normal no-underline"
                >
                  Voyages
                </Link>

                <span className="text-[#484f58] select-none">·</span>

                {session ? (
                  <>
                    <button
                      id="nav-new-voyage"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('open-new-voyage-modal'));
                        }
                      }}
                      className="text-[#c9d1d9] hover:text-[#e6edf3] cursor-pointer transition-colors bg-transparent border-0 outline-none uppercase font-normal text-[11px] md:text-[12px] p-0"
                    >
                      New voyage
                    </button>
                    
                    <span className="text-[#484f58] select-none">·</span>

                    <div
                      id="nav-user-badge"
                      title={`Rank: ${rankInfo.name} (${userProfile?.points || 0} pts)`}
                      className="flex items-center gap-1.5 text-[#d4a843] pointer-events-none select-none font-normal"
                    >
                      <span>⚓</span>
                      <span className="lowercase">
                        {userProfile?.username || 'navigator'}
                      </span>
                      <span 
                        className="text-[9px] px-1 py-0.5 rounded uppercase hidden sm:inline"
                        style={{ backgroundColor: `${rankInfo.color}18`, color: rankInfo.color, border: `1px solid ${rankInfo.color}30` }}
                      >
                        {rankInfo.name}
                      </span>
                    </div>

                    <span className="text-[#484f58] select-none">·</span>

                    <button
                      id="nav-sign-out"
                      onClick={handleSignOut}
                      className="px-2 py-0.5 text-[10px] md:text-[11px] text-[#c9d1d9] bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] rounded cursor-pointer transition-all duration-150 uppercase tracking-wider font-normal"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      id="nav-sign-in"
                      className="text-[#c9d1d9] hover:text-[#e6edf3] transition-colors no-underline"
                    >
                      Sign in
                    </Link>

                    <span className="text-[#484f58] select-none">·</span>

                    <Link
                      href="/register"
                      id="nav-join-crew"
                      className="px-2 py-0.5 text-[10px] md:text-[11px] text-[#1a1200] bg-[#d4a843] border border-[#d4a843] hover:bg-opacity-90 rounded cursor-pointer transition-all duration-150 uppercase tracking-wider font-medium no-underline"
                    >
                      Join crew
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main id="main-content" className="flex-1 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
