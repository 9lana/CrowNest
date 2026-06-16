'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Plus,
  MessageSquare,
  Eye,
  Anchor,
  X,
  PlusCircle,
  Info,
  Clock,
  BookOpen,
  Map,
  Radio,
  Send,
  Navigation,
  ExternalLink
} from 'lucide-react';

interface VoyageReply {
  id: string;
  author: string;
  authorRole: string;
  authorColor: string;
  timestamp: string;
  content: string;
}

interface Voyage {
  id: string;
  category: string;
  categoryColor: string;
  author: string;
  authorRole: string;
  authorColor: string;
  timestamp: string;
  title: string;
  description: string;
  replies: number;
  views: string;
  repliesList: VoyageReply[];
}

const INITIAL_VOYAGES: Voyage[] = [
  {
    id: 'voyage-1',
    category: 'Tech Waters',
    categoryColor: '#7d8590',
    author: 'Captain draven_ix',
    authorRole: 'Captain',
    authorColor: '#d4a843',
    timestamp: '3h ago',
    title: 'I built a local AI that runs entirely on a Raspberry Pi — no internet, no cloud, full sovereignty',
    description: 'This runs a customized Llama model on an 8GB board, driving standard command line queries and offline documentation pipelines. I can consult full offline charts and technical manuals while adrift in dead network zones.',
    replies: 312,
    views: '14.2k',
    repliesList: [
      {
        id: 'r1-1',
        author: 'First Mate yuki_sails',
        authorRole: 'First Mate',
        authorColor: '#58a6ff',
        timestamp: '2h ago',
        content: 'This is crucial for remote maritime navigation. What quantized weight precision did you settle on for optimal inference speed?'
      },
      {
        id: 'r1-2',
        author: 'Deckhand pixel_morgan',
        authorRole: 'Deckhand',
        authorColor: '#7d8590',
        timestamp: '1h ago',
        content: 'Unbelievable work. I have been wanting to set up a dashboard like this on my own small vessel. Shared your layout with the crew.'
      }
    ]
  },
  {
    id: 'voyage-2',
    category: 'Navigation',
    categoryColor: '#58a6ff',
    author: 'First Mate yuki_sails',
    authorRole: 'First Mate',
    authorColor: '#58a6ff',
    timestamp: '7h ago',
    title: 'Mapped every useful self-hosted tool in 2025 — a complete navigator\'s chart for the independent web',
    description: 'From distributed file servers to personal search indexers. This guide sets up standard light Docker stacks to reclaim your telemetry and run home operations independently from deep cloud anchors.',
    replies: 189,
    views: '8.7k',
    repliesList: [
      {
        id: 'r2-1',
        author: 'Captain draven_ix',
        authorRole: 'Captain',
        authorColor: '#d4a843',
        timestamp: '5h ago',
        content: 'A masterpiece of curation. Standard cloud providers have made web navigation too heavy. Self-hosting is the only true sovereignty left.'
      }
    ]
  },
  {
    id: 'voyage-3',
    category: 'Creative Cove',
    categoryColor: '#d2a8ff',
    author: 'Deckhand pixel_morgan',
    authorRole: 'Deckhand',
    authorColor: '#7d8590',
    timestamp: '1d ago',
    title: 'Show us your ship — post your terminal/desktop setups (screenshot thread)',
    description: 'Whether you run simple Tmux pipelines, retro terminal interfaces, or custom tiling window managers, drop your screenshot and complete layout stats here.',
    replies: 94,
    views: '3.1k',
    repliesList: [
      {
        id: 'r3-1',
        author: 'Captain null_compass',
        authorRole: 'Captain',
        authorColor: '#d4a843',
        timestamp: '18h ago',
        content: 'I run a black-and-gold minimalist monochromatic theme mapped cleanly on a rugged waterproof ThinkPad. I will post snapshots once we hit the next port.'
      }
    ]
  },
  {
    id: 'voyage-4',
    category: 'Tech Waters',
    categoryColor: '#7d8590',
    author: 'Captain null_compass',
    authorRole: 'Captain',
    authorColor: '#d4a843',
    timestamp: '2d ago',
    title: 'Why do modern websites keep getting worse? A rant with data.',
    description: 'Modern webs consume megabytes just to display standard text summaries. Let\'s inspect the metrics and trace the bloat of dynamic tracking payloads and unsolicited advertising scripts.',
    replies: 267,
    views: '6.4k',
    repliesList: [
      {
        id: 'r4-1',
        author: 'First Mate yuki_sails',
        authorRole: 'First Mate',
        authorColor: '#58a6ff',
        timestamp: '1d ago',
        content: 'Preach. Clean CSS variables and raw structured markdown could handle 90% of layout intents. We are drowning in virtual DOM libraries.'
      }
    ]
  }
];

export default function DashboardPage() {
  const [voyages, setVoyages] = useState<Voyage[]>(INITIAL_VOYAGES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Tech Waters');
  const [newRole, setNewRole] = useState('Captain');
  const [newContent, setNewContent] = useState('');
  
  // Drawer states representing expanded voyage details
  const [expandedVoyage, setExpandedVoyage] = useState<Voyage | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Location log visual feedback state
  const [anchorLog, setAnchorLog] = useState<{lat: string, lng: string, time: string} | null>(null);

  // Sign out visual state
  const [isDemoUserSignedIn, setIsDemoUserSignedIn] = useState(true);

  // Catch custom event triggers from Layout (Sticky header actions)
  useEffect(() => {
    const handleNewVoyageEvent = () => {
      setIsModalOpen(true);
    };

    const handleFilterVoyageEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedCategory(customEvent.detail);
      }
    };

    const handleSignOutEvent = () => {
      setIsDemoUserSignedIn((prev) => !prev);
    };

    window.addEventListener('open-new-voyage-modal', handleNewVoyageEvent);
    window.addEventListener('filter-voyage', handleFilterVoyageEvent);
    window.addEventListener('sign-out-demo', handleSignOutEvent);

    return () => {
      window.removeEventListener('open-new-voyage-modal', handleNewVoyageEvent);
      window.removeEventListener('filter-voyage', handleFilterVoyageEvent);
      window.removeEventListener('sign-out-demo', handleSignOutEvent);
    };
  }, []);

  // Set initial coordinates
  const triggerLocationLog = () => {
    const mockLat = (42.3601 + (Math.random() - 0.5) * 5).toFixed(4);
    const mockLng = (-71.0589 + (Math.random() - 0.5) * 5).toFixed(4);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    setAnchorLog({ lat: mockLat, lng: mockLng, time: now });
  };

  const handleCreateVoyage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    let catColor = '#7d8590';
    if (newCategory === 'Navigation') catColor = '#58a6ff';
    if (newCategory === 'Creative Cove') catColor = '#d2a8ff';
    if (newCategory === 'The Logbook') catColor = '#f78166';
    if (newCategory === 'Quick Signals') catColor = '#d4a843';

    let authorColor = '#7d8590';
    if (newRole === 'First Mate') authorColor = '#58a6ff';
    if (newRole === 'Captain') authorColor = '#d4a843';
    if (newRole === 'Admiral') authorColor = '#f78166';

    const newVoyage: Voyage = {
      id: `voyage-${Date.now()}`,
      category: newCategory,
      categoryColor: catColor,
      author: `${newRole} draven_ix`,
      authorRole: newRole,
      authorColor: authorColor,
      timestamp: 'Just now',
      title: newTitle,
      description: newContent,
      replies: 0,
      views: '1',
      repliesList: []
    };

    setVoyages([newVoyage, ...voyages]);
    setNewTitle('');
    setNewContent('');
    setIsModalOpen(false);
  };

  const submitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !expandedVoyage) return;

    const newReply: VoyageReply = {
      id: `reply-${Date.now()}`,
      author: 'Captain draven_ix',
      authorRole: 'Captain',
      authorColor: '#d4a843',
      timestamp: 'Just now',
      content: replyInput.trim()
    };

    const updatedVoyages = voyages.map((v) => {
      if (v.id === expandedVoyage.id) {
        const nextReplies = v.replies + 1;
        const nextList = [...v.repliesList, newReply];
        const nextVoyage = { ...v, replies: nextReplies, repliesList: nextList };
        // also update the open expanded voyage state
        setExpandedVoyage(nextVoyage);
        return nextVoyage;
      }
      return v;
    });

    setVoyages(updatedVoyages);
    setReplyInput('');
  };

  // Filter criteria
  const filteredVoyages = voyages.filter((v) => {
    const matchesCategory = selectedCategory === 'all' || v.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesKeyword = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesKeyword;
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 select-none">
      {/* Demo Sign Out Modal Wrapper (Only show when simulator toggles signout helper in sticky head) */}
      {!isDemoUserSignedIn && (
        <div id="signout-simulator-notice" className="mb-6 p-4 bg-[#1a1200] border border-[#d4a843] rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚪</span>
            <div>
              <p className="font-medium text-[#e6edf3] text-sm uppercase tracking-wide">Voyage Session De-Authenticated</p>
              <p className="text-[12px] text-[#7d8590]">You have simulated signing off the ship Sovereign Wind. Enter back aboard anytime.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsDemoUserSignedIn(true)}
            className="px-3 py-1.5 bg-[#d4a843] text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded cursor-pointer hover:bg-opacity-90"
          >
            Sign Back In
          </button>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-start">
        
        {/* Left Column (Main Voyage Feed) */}
        <section id="voyages-feed-column" className="space-y-4">
          
          {/* Feed Header Controls */}
          <div className="flex items-center justify-between bg-[#161b22] border border-[#21262d] rounded-lg p-3.5">
            <div className="flex items-center gap-3">
              <Compass className="w-[18px] h-[18px] text-[#d4a843]" />
              <h1 className="text-[11px] font-medium uppercase tracking-wider text-[#7d8590]">
                All voyages {selectedCategory !== 'all' && `· ${selectedCategory}`} ({filteredVoyages.length})
              </h1>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#d4a843] text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded cursor-pointer hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Start a voyage
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7d8590]" />
            <input
              type="text"
              placeholder="SEARCH VOYAGE CHRONICLES, OFFICERS OR TAGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#161b22] border border-[#21262d] rounded-lg text-xs tracking-wide placeholder-[#484f58] uppercase font-normal text-[#e6edf3] focus:border-[#30363d] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8590] hover:text-[#e6edf3]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Thread List */}
          <div id="thread-list-container" className="space-y-3">
            {filteredVoyages.length === 0 ? (
              <div className="text-center py-12 bg-[#161b22] border border-[#21262d] rounded-lg">
                <Info className="w-8 h-8 text-[#484f58] mx-auto mb-2" />
                <p className="text-xs uppercase tracking-wider text-[#7d8590] font-medium">No logbooks match your sail filters</p>
                <p className="text-[11px] text-[#484f58] mt-1 select-text">Try resetting the sea category or clear your search keyword bar.</p>
                {selectedCategory !== 'all' || searchQuery ? (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded text-[11px] uppercase text-[#d4a843] hover:bg-[#251b00]"
                  >
                    Clear All Filters
                  </button>
                ) : null}
              </div>
            ) : (
              filteredVoyages.map((voyage) => (
                <article
                  key={voyage.id}
                  onClick={() => setExpandedVoyage(voyage)}
                  className="bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] rounded-lg p-[14px] transition-all duration-150 cursor-pointer flex flex-col gap-2.5 relative group"
                >
                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#7d8590]">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-medium px-2 py-0.5 rounded text-[10px]"
                        style={{
                          backgroundColor: `${voyage.categoryColor}15`,
                          color: voyage.categoryColor,
                          border: `1px solid ${voyage.categoryColor}30`
                        }}
                      >
                        {voyage.category}
                      </span>
                      <span className="text-[#484f58] select-none">·</span>
                      <span 
                        className="font-medium" 
                        style={{ color: voyage.authorColor }}
                      >
                        ⚓ {voyage.author}
                      </span>
                    </div>

                    <span className="text-[#7d8590] flex items-center gap-1 font-normal">
                      <Clock className="w-3 h-3 text-[#484f58]" /> {voyage.timestamp}
                    </span>
                  </div>

                  {/* Title Link */}
                  <h2 className="font-medium text-[#e6edf3] group-hover:text-[#d4a843] transition-colors leading-snug tracking-tight text-sm">
                    {voyage.title}
                  </h2>

                  {/* Single Line Trimmed Text Description Preview */}
                  <p className="text-[#c9d1d9] text-[13px] line-clamp-1 truncate select-text">
                    {voyage.description}
                  </p>

                  <div className="border-t border-[#21262d]/50 my-1"></div>

                  {/* Foot Counter info */}
                  <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider text-[#7d8590]">
                    <span className="flex items-center gap-1.5 font-normal">
                      <MessageSquare className="w-3.5 h-3.5 text-[#484f58]" /> {voyage.replies} replies
                    </span>
                    <span className="flex items-center gap-1.5 font-normal">
                      <Eye className="w-3.5 h-3.5 text-[#484f58]" /> {voyage.views} views
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Right Column (Sidebar, 220px wide) */}
        <aside id="sidebar-widgets-column" className="space-y-4">
          
          {/* 1. User Welcome Card */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#7d8590] font-normal">
              <Anchor className="w-3.5 h-3.5 text-[#d4a843]" />
              <span>STATION SUMMARY</span>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-sm text-[#e6edf3]">
                Captain <span className="text-[#d4a843]">draven_ix</span>
              </p>
              <p className="text-[11px] text-[#7d8590] uppercase tracking-wider">
                Fleet Status · Active Duty
              </p>
            </div>

            <div className="border-t border-[#21262d] my-1"></div>

            <div className="grid grid-cols-2 gap-2 text-center text-[11px] uppercase tracking-wider">
              <div className="px-1 py-1.5 bg-[#0d1117] border border-[#21262d] rounded">
                <span className="block text-[13px] font-medium text-[#d4a843]">{voyages.filter(v => v.author.includes('draven_ix')).length}</span>
                <span className="text-[9px] text-[#7d8590]">LOGGED VOYAGES</span>
              </div>
              <div className="px-1 py-1.5 bg-[#0d1117] border border-[#21262d] rounded">
                <span className="block text-[13px] font-medium text-[#58a6ff]">2,410</span>
                <span className="text-[9px] text-[#7d8590]">SEXTANT PTS</span>
              </div>
            </div>

            <button
              onClick={triggerLocationLog}
              className="mt-1 w-full px-2.5 py-1.5 text-[11px] text-[#c9d1d9] bg-[#161b22] border border-[#21262d] hover:bg-[#21262d] hover:border-[#d4a843]/40 rounded cursor-pointer transition-colors uppercase tracking-wider font-normal"
            >
              ⚓ Log Position
            </button>

            {/* Simulated Live Instrument Coordinate Screen */}
            {anchorLog && (
              <div className="bg-[#0d1117] p-2 border border-[#30363d] rounded text-[10px] font-mono text-[#7d8590] space-y-1">
                <div className="flex justify-between">
                  <span>LATITUDE:</span>
                  <span className="text-[#e6edf3]">{anchorLog.lat}° N</span>
                </div>
                <div className="flex justify-between">
                  <span>LONGITUDE:</span>
                  <span className="text-[#e6edf3]">{anchorLog.lng}° W</span>
                </div>
                <div className="text-[8px] uppercase tracking-widest text-[#d4a843] text-right mt-1">
                  {anchorLog.time}
                </div>
              </div>
            )}
          </div>

          {/* 2. "The Seas" Categories Widget */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3.5">
            <h3 className="text-[11px] font-normal uppercase tracking-wider text-[#7d8590] mb-3 select-none flex items-center justify-between">
              <span>The Seas</span>
              <span className="text-[10px] font-mono">MAPS</span>
            </h3>

            <nav className="flex flex-col gap-1 text-[12px]">
              {[
                { name: 'all', label: '⚓ Ocean (Show All)', color: '#d4a843' },
                { name: 'Tech Waters', label: '⚙️ Tech Waters', color: '#7d8590' },
                { name: 'Navigation', label: '🧭 Navigation', color: '#58a6ff' },
                { name: 'Creative Cove', label: '🌊 Creative Cove', color: '#d2a8ff' },
                { name: 'The Logbook', label: '📖 The Logbook', color: '#f78166' },
                { name: 'Quick Signals', label: '📡 Quick Signals', color: '#d4a843' }
              ].map((category) => {
                const isActive = selectedCategory.toLowerCase() === category.name.toLowerCase();
                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full px-2 py-1.5 text-left rounded cursor-pointer transition-colors uppercase text-[11px] tracking-wider font-normal flex items-center justify-between ${
                      isActive 
                        ? 'bg-[#251b00] border-l-2 border-[#d4a843] text-[#e6edf3]' 
                        : 'text-[#c9d1d9] hover:bg-[#21262d]'
                    }`}
                  >
                    <span>{category.label}</span>
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 3. "Crew Ranks" Reference Widget */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3.5">
            <h3 className="text-[11px] font-normal uppercase tracking-wider text-[#7d8590] mb-3">
              Crew Ranks
            </h3>

            <div className="space-y-2">
              {[
                { name: 'Deckhand', range: '0 - 500 Pts', color: '#7d8590' },
                { name: 'First Mate', range: '501 - 1,500 Pts', color: '#58a6ff' },
                { name: 'Captain', range: '1,501 - 5,000 Pts', color: '#d4a843' },
                { name: 'Admiral', range: '5,000+ Pts', color: '#f78166' }
              ].map((rank) => (
                <div 
                  key={rank.name} 
                  className="flex items-center justify-between border-b border-[#21262d]/50 pb-1.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: rank.color }}
                    ></span>
                    <span className="text-[11px] font-medium text-[#e6edf3]">{rank.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7d8590] uppercase tracking-wider">{rank.range}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL WINDOW: "Start a voyage" Form */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-[#1d242e] border-b border-[#21262d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#d4a843]">⚓</span>
                <span className="text-[12px] font-normal uppercase tracking-wider text-[#e6edf3]">LOG NEW VOYAGE ENTRY</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#7d8590] hover:text-[#e6edf3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateVoyage} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1">
                  Title of the course / Voyage link title
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: INTRODUCING DISTRIBUTED MESH ROUTERS ON SEAWARD CABINS"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] rounded text-xs text-[#e6edf3] uppercase tracking-wider placeholder-[#484f58] focus:border-[#d4a843] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1">
                    Select Ocean Area (Category)
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-10 px-2 bg-[#0d1117] border border-[#21262d] rounded text-xs text-[#e6edf3] tracking-wide uppercase focus:border-[#d4a843] focus:outline-none"
                  >
                    <option value="Tech Waters">⚙️ Tech Waters</option>
                    <option value="Navigation">🧭 Navigation</option>
                    <option value="Creative Cove">🌊 Creative Cove</option>
                    <option value="The Logbook">📖 The Logbook</option>
                    <option value="Quick Signals">📡 Quick Signals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1">
                    Select Identity Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-10 px-2 bg-[#0d1117] border border-[#21262d] rounded text-xs text-[#e6edf3] tracking-wide uppercase focus:border-[#d4a843] focus:outline-none"
                  >
                    <option value="Deckhand">🪵 Deckhand</option>
                    <option value="First Mate">🪝 First Mate</option>
                    <option value="Captain">⚓ Captain</option>
                    <option value="Admiral">🎖️ Admiral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1">
                  Logbook Content / Text Chronicle (Sovereign detail)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="WRITE DOWN WHAT YOU HAVE BUILT OR DISCOVERED ON THE WEB..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 bg-[#0d1117] border border-[#21262d] rounded text-xs text-[#e6edf3] placeholder-[#484f58] focus:border-[#d4a843] focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[11px] uppercase tracking-wider text-[#7d8590] hover:text-[#e6edf3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#d4a843] hover:bg-opacity-90 text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Log Voyage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / SIDE WINDOW Panel Component: Detailed View & Live Replies */}
      {expandedVoyage && (
        <div 
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#161b22] border-l border-[#30363d] shadow-2xl flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header Toolbar */}
          <div className="h-[52px] px-4 bg-[#1b212a] border-b border-[#21262d] flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-[#d4a843]">📖</span>
              <span className="text-[12px] font-normal uppercase tracking-wider text-[#e6edf3]">
                Chronicle: {expandedVoyage.category}
              </span>
            </div>
            <button
              onClick={() => setExpandedVoyage(null)}
              className="p-1 hover:bg-[#21262d] rounded transition-colors text-[#7d8590] hover:text-[#e6edf3] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 select-text">
            {/* Main Post Section inside Drawer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-wider text-[#7d8590] select-none">
                <span 
                  className="font-medium px-2 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: `${expandedVoyage.categoryColor}15`,
                    color: expandedVoyage.categoryColor,
                    border: `1px solid ${expandedVoyage.categoryColor}30`
                  }}
                >
                  {expandedVoyage.category}
                </span>
                <span>·</span>
                <span style={{ color: expandedVoyage.authorColor }} className="font-medium">
                  {expandedVoyage.author}
                </span>
                <span>·</span>
                <span>{expandedVoyage.timestamp}</span>
              </div>

              <h2 className="font-medium text-base text-[#e6edf3] leading-snug">
                {expandedVoyage.title}
              </h2>

              <p className="text-[#c9d1d9] text-[13.5px] leading-relaxed whitespace-pre-wrap">
                {expandedVoyage.description}
              </p>

              {/* Statistics info inside Detail */}
              <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider text-[#7d8590] pt-2 border-t border-[#21262d]">
                <span>{expandedVoyage.replies} replies logged</span>
                <span>{expandedVoyage.views} navigational views</span>
              </div>
            </div>

            {/* Replies Board Section */}
            <div className="space-y-4 pt-4 border-t border-[#21262d]">
              <h3 className="text-[11px] font-normal uppercase tracking-wider text-[#d4a843] mb-2 select-none">
                REPLIES LOG & TELEMETRY
              </h3>

              {expandedVoyage.repliesList.length === 0 ? (
                <div className="text-center py-6 bg-[#0d1117] border border-[#21262d] rounded-md select-none">
                  <p className="text-[11px] text-[#7d8590] uppercase tracking-wider">No replies logged yet on this voyage.</p>
                  <p className="text-[10px] text-[#484f58] mt-1">Be the first to speak coordinates into the signal box below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expandedVoyage.repliesList.map((reply) => (
                    <div 
                      key={reply.id} 
                      className="bg-[#0d1117] border border-[#21262d] p-3 rounded"
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#7d8590] mb-1.5 select-none">
                        <span style={{ color: reply.authorColor }} className="font-medium">
                          ⚓ {reply.author} ({reply.authorRole})
                        </span>
                        <span>{reply.timestamp}</span>
                      </div>
                      <p className="text-[12.5px] text-[#c9d1d9] leading-relaxed select-text">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Form: Add Reply */}
          <form 
            onSubmit={submitReply} 
            className="p-4 bg-[#1b212a] border-t border-[#21262d] flex items-center gap-2 select-none"
          >
            <input
              type="text"
              required
              placeholder="Post a reply back to this vessel..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className="flex-1 h-9 px-3 bg-[#0d1117] border border-[#21262d] rounded text-[12px] text-[#e6edf3] placeholder-[#484f58] focus:border-[#d4a843] focus:outline-none"
            />
            <button
              type="submit"
              className="h-9 px-3.5 bg-[#d4a843] text-[#1a1200] rounded hover:bg-opacity-90 font-medium text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1"
            >
              <Send className="w-3 h-3" /> Reply
            </button>
          </form>
        </div>
      )}

      {/* BACKGROUND SHIELD IF DRAWER IS OPEN */}
      {expandedVoyage && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" 
          onClick={() => setExpandedVoyage(null)}
        />
      )}
    </div>
  );
}
