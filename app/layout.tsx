'use client';

import './globals.css'; // Global styles

export default function RootLayout({children}: {children: React.ReactNode}) {
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
              <div id="header-logo-container" className="flex items-center gap-3">
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
              </div>

              {/* Right Side (Navigation Links) */}
              <nav
                id="header-nav"
                className="flex items-center gap-3.5 text-[11px] md:text-[12px] uppercase tracking-wider font-medium"
              >
                <button
                  id="nav-voyages"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('filter-voyage', { detail: 'all' }));
                    }
                  }}
                  className="text-[#c9d1d9] hover:text-[#e6edf3] cursor-pointer transition-colors bg-transparent border-0 outline-none uppercase font-normal"
                >
                  Voyages
                </button>
                <span className="text-[#484f58] select-none">·</span>
                <button
                  id="nav-new-voyage"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-new-voyage-modal'));
                    }
                  }}
                  className="text-[#c9d1d9] hover:text-[#e6edf3] cursor-pointer transition-colors bg-transparent border-0 outline-none uppercase font-normal"
                >
                  New voyage
                </button>
                <span className="text-[#484f58] select-none">·</span>
                <div
                  id="nav-user-badge"
                  className="flex items-center gap-1 text-[#d4a843] pointer-events-none select-none font-normal"
                >
                  <span>⚓</span>
                  <span>draven_ix</span>
                </div>
                <button
                  id="nav-sign-out"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('sign-out-demo'));
                    }
                  }}
                  className="px-2 py-0.5 text-[10px] md:text-[11px] text-[#c9d1d9] bg-[#161b22] border border-[#21262d] hover:bg-[#21262d] hover:border-[#30363d] rounded cursor-pointer transition-all duration-150 uppercase tracking-wider font-normal"
                >
                  Sign out
                </button>
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

