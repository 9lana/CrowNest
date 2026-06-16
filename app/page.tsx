'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { getMaritimeRank } from '../lib/utils';
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
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Send,
  Database,
  User,
  ShieldAlert,
  Loader
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  points: number;
  role: string;
}

interface Thread {
  id: string;
  title: string;
  description: string;
  category_id: string;
  author_id: string;
  replies_count: number;
  views_count: number;
  upvotes_count: number;
  created_at: string;
  // Relationships
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    username: string;
    points: number;
  };
  // UI metrics computed
  votesList?: any[];
  repliesList?: any[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

const STATIC_FALLBACK_VOYAGES: Thread[] = [
  {
    id: 'f1',
    title: 'I built a local AI that runs entirely on a Raspberry Pi — no internet, no cloud, full sovereignty',
    description: 'This runs a customized Llama model on an 8GB board, driving standard command line queries and offline documentation pipelines. I can consult full offline charts and technical manuals while adrift in dead network zones.',
    category_id: 'c1',
    author_id: 'u1',
    replies_count: 312,
    views_count: 14200,
    upvotes_count: 84,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    category: { id: 'c1', name: 'Tech Waters', slug: 'tech-waters' },
    author: { id: 'u1', username: 'Captain draven_ix', points: 1540 }
  },
  {
    id: 'f2',
    title: 'Mapped every useful self-hosted tool in 2025 — a complete navigator\'s chart for the independent web',
    description: 'From distributed file servers to personal search indexers. This guide sets up standard light Docker stacks to reclaim your telemetry and run home operations independently from deep cloud anchors.',
    category_id: 'c2',
    author_id: 'u2',
    replies_count: 189,
    views_count: 8700,
    upvotes_count: 102,
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    category: { id: 'c2', name: 'Navigation', slug: 'navigation' },
    author: { id: 'u2', username: 'First Mate yuki_sails', points: 420 }
  },
  {
    id: 'f3',
    title: 'Show us your ship — post your terminal/desktop setups (screenshot thread)',
    description: 'Whether you run simple Tmux pipelines, retro terminal interfaces, or custom tiling window managers, drop your screenshot and complete layout stats here.',
    category_id: 'c3',
    author_id: 'u3',
    replies_count: 94,
    views_count: 3100,
    upvotes_count: 45,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    category: { id: 'c3', name: 'Creative Cove', slug: 'creative-cove' },
    author: { id: 'u3', username: 'Deckhand pixel_morgan', points: 42 }
  },
  {
    id: 'f4',
    title: 'Why do modern websites keep getting worse? A rant with data.',
    description: 'Modern webs consume megabytes just to display standard text summaries. Let\'s inspect the metrics and trace the bloat of dynamic tracking payloads and unsolicited advertising scripts.',
    category_id: 'c1',
    author_id: 'u4',
    replies_count: 267,
    views_count: 6400,
    upvotes_count: 98,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    category: { id: 'c1', name: 'Tech Waters', slug: 'tech-waters' },
    author: { id: 'u4', username: 'Captain null_compass', points: 1200 }
  }
];

const STATIC_FALLBACK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Tech Waters', slug: 'tech-waters', sort_order: 1 },
  { id: 'c2', name: 'Navigation', slug: 'navigation', sort_order: 2 },
  { id: 'c3', name: 'Creative Cove', slug: 'creative-cove', sort_order: 3 },
  { id: 'c4', name: 'The Logbook', slug: 'the-logbook', sort_order: 4 },
  { id: 'c5', name: 'Quick Signals', slug: 'quick-signals', sort_order: 5 }
];

export default function DashboardPage() {
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  // Core Data
  const [voyages, setVoyages] = useState<Thread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI States
  const [isDbMode, setIsDbMode] = useState(false);
  const [dbNotice, setDbNotice] = useState<string>('');
  
  // Interactive Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('tech-waters');
  const [newContent, setNewContent] = useState('');
  const [submittingThread, setSubmittingThread] = useState(false);

  // Expanded thread detail drawer state
  const [expandedThread, setExpandedThread] = useState<Thread | null>(null);
  const [repliesList, setRepliesList] = useState<any[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // GPS Log coordinates display
  const [anchorLog, setAnchorLog] = useState<{ lat: string; lng: string; time: string } | null>(null);

  // Vote memory tracking to protect button actions toggled locally
  const [votedThreads, setVotedThreads] = useState<Record<string, 'upvote' | 'downvote'>>({});

  // 1. Initial Load and Auth setup
  useEffect(() => {
    // Session setup
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user.id);
      } else {
        setCurrentUserProfile(null);
      }
    });

    // Custom alignment sync
    const handleSync = () => {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        if (s?.user) {
          fetchUserProfile(s.user.id);
        }
      });
    };

    window.addEventListener('auth-state-sync', handleSync);
    loadAllForumData();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth-state-sync', handleSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the active profile info
  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setCurrentUserProfile(data as UserProfile);
      } else {
        // Safe profile default
        const defaultProfile: UserProfile = {
          id: userId,
          username: session?.user?.user_metadata?.username || 'navigator',
          points: 10,
          role: 'Deckhand'
        };
        setCurrentUserProfile(defaultProfile);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Query and initialize Sovereign platform content
  async function loadAllForumData() {
    setIsLoading(true);

    try {
      // Fetch categories
      const { data: catsData, error: catsError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!catsError && catsData && catsData.length > 0) {
        setCategories(catsData as Category[]);
      } else {
        // Fallback to offline static categories
        setCategories(STATIC_FALLBACK_CATEGORIES);
      }

      // Fetch threads
      const { data: threadsData, error: threadsError } = await supabase
        .from('threads')
        .select(`
          id,
          title,
          description,
          category_id,
          author_id,
          replies_count,
          views_count,
          upvotes_count,
          created_at,
          category:categories (id, name, slug),
          author:users (id, username, points)
        `)
        .order('created_at', { ascending: false });

      if (!threadsError && threadsData) {
        // Normalize thread payloads with fallback fields
        const formattedThreads = threadsData.map((t: any) => ({
          ...t,
          category: t.category || { id: t.category_id, name: 'Tech Waters', slug: 'tech-waters' },
          author: t.author || { id: t.author_id || 'system', username: 'Anonymous deckhand', points: 15 }
        }));
        setVoyages(formattedThreads);
        setIsDbMode(true);
        setDbNotice('');
      } else {
        // Set offline static records
        setVoyages(STATIC_FALLBACK_VOYAGES);
        setIsDbMode(false);
        setDbNotice('Sovereign Wind launched in sandbox memory mode. Rig PostgreSQL database tables in your specified project to sync real-time.');
      }
    } catch (e) {
      setVoyages(STATIC_FALLBACK_VOYAGES);
      setCategories(STATIC_FALLBACK_CATEGORIES);
      setIsDbMode(false);
      setDbNotice('Nautical channels offline. Memory sandbox active.');
    } finally {
      setIsLoading(false);
    }
  }

  // 3. User upvote and downvote handler
  const handleVote = async (threadId: string, currentScore: number, voteType: 'upvote' | 'downvote', authorId?: string) => {
    if (!session) {
      alert('You must sign back aboard to register votes on voyage logs. Report to Bridge.');
      return;
    }

    const currentVote = votedThreads[threadId];
    if (currentVote === voteType) return; // Already voted this way

    // UI Optimistic Update
    let scoreMultiplier = voteType === 'upvote' ? 1 : -1;
    if (currentVote) {
      // If toggling from upvote to downvote, delta is 2
      scoreMultiplier = voteType === 'upvote' ? 2 : -2;
    }

    const nextScore = Math.max(0, currentScore + scoreMultiplier);
    setVoyages((prev) => 
      prev.map((v) => (v.id === threadId ? { ...v, upvotes_count: nextScore } : v))
    );
    setVotedThreads((prev) => ({ ...prev, [threadId]: voteType }));

    // Update state inside active drawer detail if it's currently selected
    if (expandedThread && expandedThread.id === threadId) {
      setExpandedThread(prev => prev ? { ...prev, upvotes_count: nextScore } : null);
    }

    try {
      if (isDbMode) {
        // 1. Log or update vote record in public.votes
        const { error: upsertError } = await supabase
          .from('votes')
          .upsert({
            thread_id: threadId,
            user_id: session.user.id,
            vote_type: voteType
          }, { onConflict: 'thread_id,user_id' });

        // 2. Increment thread score
        await supabase
          .from('threads')
          .update({ upvotes_count: nextScore })
          .eq('id', threadId);

        // 3. Adjust author points
        if (authorId) {
          const pointDelta = voteType === 'upvote' ? 10 : -5;
          const { data: authorData } = await supabase
            .from('users')
            .select('points')
            .eq('id', authorId)
            .maybeSingle();

          if (authorData) {
            const currentPoints = authorData.points || 0;
            const updatedPoints = Math.max(0, currentPoints + pointDelta);
            const computedRole = getMaritimeRank(updatedPoints).name;

            await supabase
              .from('users')
              .update({ points: updatedPoints, role: computedRole })
              .eq('id', authorId);
          }
        }

        // 4. Update local user profile points if the current logged in user was the voter or author
        if (authorId === session?.user?.id) {
          fetchUserProfile(session.user.id);
        }
      }
    } catch (e) {
      console.warn('Database write bypassed in sandbox Mode:', e);
    }
  };

  // 4. Create complete thread entry
  const handleLaunchVoyage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!session) {
      alert('You must be signed in to log voyages on this vessel.');
      return;
    }

    setSubmittingThread(true);

    const targetCategory = categories.find((c) => c.slug === newCategorySlug) || categories[0];
    const newThreadId = 'th-' + Date.now();

    const mockNewThread: Thread = {
      id: newThreadId,
      title: newTitle.trim(),
      description: newContent.trim(),
      category_id: targetCategory.id,
      author_id: session.user.id,
      replies_count: 0,
      views_count: 1,
      upvotes_count: 1,
      created_at: new Date().toISOString(),
      category: {
        id: targetCategory.id,
        name: targetCategory.name,
        slug: targetCategory.slug
      },
      author: {
        id: session.user.id,
        username: currentUserProfile?.username || 'Navigator',
        points: currentUserProfile?.points || 15
      }
    };

    try {
      if (isDbMode) {
        const { data, error } = await supabase
          .from('threads')
          .insert([
            {
              title: mockNewThread.title,
              description: mockNewThread.description,
              category_id: mockNewThread.category_id,
              author_id: session.user.id,
              replies_count: 0,
              views_count: 1,
              upvotes_count: 1
            }
          ])
          .select()
          .single();

        if (!error && data) {
          // Success inserter
          mockNewThread.id = data.id;
        }
      }
    } catch {
      // Memory insert backup
    }

    setVoyages([mockNewThread, ...voyages]);
    setNewTitle('');
    setNewContent('');
    setIsModalOpen(false);
    setSubmittingThread(false);
  };

  // 5. Open expanded post drawer + fetch replies
  const handleOpenDrawer = async (thread: Thread) => {
    setExpandedThread(thread);
    setRepliesList([]);
    
    // Optimistic views update
    setVoyages((vxs) => 
      vxs.map((v) => v.id === thread.id ? { ...v, views_count: v.views_count + 1 } : v)
    );

    try {
      if (isDbMode) {
        // Increment view count in Supabase
        await supabase
          .from('threads')
          .update({ views_count: thread.views_count + 1 })
          .eq('id', thread.id);

        // Fetch replies from public.replies
        const { data: fetchReplies, error: rError } = await supabase
          .from('replies')
          .select(`
            id,
            content,
            created_at,
            author_id,
            author:users(id, username, points)
          `)
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: true });

        if (!rError && fetchReplies) {
          setRepliesList(fetchReplies);
        }
      } else {
        // Fallback static reply logs
        const defaultReplies = [
          {
            id: 'fr1',
            content: 'This logs incredible sovereign data protocols. I will explore implementation on our vessel coordinates.',
            created_at: '2026-06-16T12:00:00.000Z',
            author: { username: 'First Mate yuki_sails', points: 420 }
          }
        ];
        setRepliesList(thread.repliesList || defaultReplies);
      }
    } catch {
      setRepliesList([]);
    }
  };

  // 6. Submit reply to active thread
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !expandedThread) return;
    if (!session) {
      alert('Sign back aboard to post signals.');
      return;
    }

    setSubmittingReply(true);
    const mockReplyId = 'rep-' + Date.now();

    const mockReply = {
      id: mockReplyId,
      content: replyInput.trim(),
      created_at: new Date().toISOString(),
      author: {
        id: session.user.id,
        username: currentUserProfile?.username || 'navigator',
        points: currentUserProfile?.points || 15
      }
    };

    try {
      if (isDbMode) {
        const { data, error } = await supabase
          .from('replies')
          .insert([
            {
              thread_id: expandedThread.id,
              author_id: session.user.id,
              content: mockReply.content
            }
          ])
          .select()
          .single();

        if (!error && data) {
          mockReply.id = data.id;
        }

        // Increment thread reply count
        await supabase
          .from('threads')
          .update({ replies_count: expandedThread.replies_count + 1 })
          .eq('id', expandedThread.id);
      }
    } catch {
      // Memory update standard
    }

    // Update layouts
    setRepliesList([...repliesList, mockReply]);
    setVoyages((vxs) => 
      vxs.map((v) => v.id === expandedThread.id ? { ...v, replies_count: v.replies_count + 1 } : v)
    );
    setExpandedThread((prev) => prev ? { ...prev, replies_count: prev.replies_count + 1 } : null);
    setReplyInput('');
    setSubmittingReply(false);
  };

  // 7. Simulated GPS Log coordinates function
  const triggerAnchorCoordinatesLog = () => {
    const lat = (24.8607 + (Math.random() - 0.5) * 6).toFixed(4);
    const lng = (-71.1254 + (Math.random() - 0.5) * 6).toFixed(4);
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    setAnchorLog({ lat, lng, time: timeStr });
  };

  // Filter application
  const filteredVoyages = voyages.filter((v) => {
    const matchesCategory = selectedCategory === 'all' || v.category?.name.toLowerCase() === selectedCategory.toLowerCase() || v.category?.slug === selectedCategory;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.author?.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 select-none">
      
      {/* Database Warning or Info Banner */}
      {dbNotice && (
        <div id="sandbox-warning-banner" className="mb-5 p-3.5 bg-[#1a1200] border border-[#d4a843]/30 rounded-lg flex items-center justify-between gap-3 text-xs text-[#c9d1d9]">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-[18px] h-[18px] text-[#d4a843]" />
            <p className="select-text">{dbNotice}</p>
          </div>
          <button 
            onClick={() => setDbNotice('')}
            className="text-[#7d8590] hover:text-[#e6edf3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-start">
        
        {/* Left Column (Voyage Feed) */}
        <section id="voyages-feed-column" className="space-y-4">
          
          {/* Feed Header */}
          <div className="flex items-center justify-between bg-[#161b22] border border-[#21262d] rounded-lg p-3.5">
            <div className="flex items-center gap-2">
              <Compass className="w-[18px] h-[18px] text-[#d4a843]" />
              <h1 className="text-[11px] font-medium uppercase tracking-wider text-[#7d8590]">
                All voyages {selectedCategory !== 'all' && `· ${selectedCategory}`} ({filteredVoyages.length})
              </h1>
            </div>

            {session ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#d4a843] text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded cursor-pointer hover:bg-opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Start a voyage
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 bg-[#d4a843] text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded cursor-pointer hover:bg-opacity-95 transition-colors no-underline block"
              >
                Sign In To Sail
              </Link>
            )}
          </div>

          {/* Search Inputs */}
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

          {/* Voyage list */}
          <div id="thread-list-container" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-16 bg-[#161b22] border border-[#21262d] rounded-lg">
                <Loader className="w-7 h-7 text-[#d4a843] animate-spin mx-auto mb-2.5" />
                <p className="text-[11px] uppercase tracking-wider text-[#7d8590] font-normal">Re-aligning sextants and database metrics...</p>
              </div>
            ) : filteredVoyages.length === 0 ? (
              <div className="text-center py-14 bg-[#161b22] border border-[#21262d] rounded-lg">
                <Info className="w-8 h-8 text-[#484f58] mx-auto mb-2" />
                <p className="text-xs uppercase tracking-wider text-[#7d8590] font-medium">No system channels match your navigation filters</p>
                <p className="text-[11px] text-[#484f58] mt-1 select-text">Try resetting categories or search parameters.</p>
                {(selectedCategory !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded text-[11px] uppercase text-[#d4a843] hover:bg-[#251b00] cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              filteredVoyages.map((voyage) => {
                const authorRank = getMaritimeRank(voyage.author?.points || 0);
                const hasVotedUp = votedThreads[voyage.id] === 'upvote';
                const hasVotedDown = votedThreads[voyage.id] === 'downvote';

                return (
                  <article
                    key={voyage.id}
                    onClick={() => handleOpenDrawer(voyage)}
                    className="bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] rounded-lg p-[14px] transition-all duration-150 cursor-pointer flex gap-4 relative group"
                  >
                    {/* Voting Panel */}
                    <div 
                      className="flex flex-col items-center select-none" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleVote(voyage.id, voyage.upvotes_count, 'upvote', voyage.author_id)}
                        className={`p-1 rounded hover:bg-[#251b00] cursor-pointer transition-colors ${
                          hasVotedUp ? 'text-[#d4a843]' : 'text-[#7d8590] hover:text-[#e6edf3]'
                        }`}
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <span className={`text-xs font-mono font-medium ${
                        hasVotedUp ? 'text-[#d4a843]' : hasVotedDown ? 'text-[#f85149]' : 'text-[#e6edf3]'
                      }`}>
                        {voyage.upvotes_count}
                      </span>
                      <button
                        onClick={() => handleVote(voyage.id, voyage.upvotes_count, 'downvote', voyage.author_id)}
                        className={`p-1 rounded hover:bg-[#1a1313] cursor-pointer transition-colors ${
                          hasVotedDown ? 'text-[#f85149]' : 'text-[#7d8590] hover:text-[#e6edf3]'
                        }`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Main Card Payload */}
                    <div className="flex-1 space-y-2">
                      {/* Metadata Row */}
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#7d8590]">
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-medium px-2 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: `rgba(212, 168, 67, 0.08)`,
                              color: `#d4a843`,
                              border: `1px solid rgba(212, 168, 67, 0.2)`
                            }}
                          >
                            {voyage.category?.name || 'Tech Waters'}
                          </span>
                          <span className="text-[#484f58] select-none">·</span>
                          <span 
                            className="font-medium select-text lowercase" 
                            style={{ color: authorRank.color }}
                          >
                            ⚓ {voyage.author?.username || 'anonymous'} ({authorRank.name})
                          </span>
                        </div>

                        <span className="text-[#7d8590] flex items-center gap-1 font-normal">
                          <Clock className="w-3 h-3 text-[#484f58]" /> 
                          {voyage.created_at.includes('T') 
                            ? new Date(voyage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                            : voyage.created_at}
                        </span>
                      </div>

                      {/* Title block */}
                      <h2 className="font-medium text-[#e6edf3] group-hover:text-[#d4a843] transition-colors leading-snug tracking-tight text-sm select-text">
                        {voyage.title}
                      </h2>

                      {/* Content block */}
                      <p className="text-[#c9d1d9] text-[13px] line-clamp-1 truncate select-text">
                        {voyage.description}
                      </p>

                      <div className="border-t border-[#21262d]/50 my-1"></div>

                      {/* Summary statistics info */}
                      <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider text-[#7d8590]">
                        <span className="flex items-center gap-1.5 font-normal">
                          <MessageSquare className="w-3.5 h-3.5 text-[#484f58]" /> 
                          {voyage.replies_count} replies
                        </span>
                        <span className="flex items-center gap-1.5 font-normal">
                          <Eye className="w-3.5 h-3.5 text-[#484f58]" /> 
                          {voyage.views_count >= 1000 ? `${(voyage.views_count/1000).toFixed(1)}k` : voyage.views_count} views
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column (Sidebar Widgets) */}
        <aside id="sidebar-widgets" className="space-y-4">
          
          {/* Widget 1: Authenticated welcome module */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#7d8590] font-normal">
              <Anchor className="w-3.5 h-3.5 text-[#d4a843]" />
              <span>STATION SUMMARY</span>
            </div>

            {session ? (
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm text-[#e6edf3] lowercase select-text">
                    ⚓ {currentUserProfile?.username || 'Navigator'}
                  </p>
                  <p className="text-[10px] text-[#7d8590] uppercase tracking-wider">
                    Computed Rank: <span style={{ color: getMaritimeRank(currentUserProfile?.points || 0).color }} className="font-semibold">{getMaritimeRank(currentUserProfile?.points || 0).name}</span>
                  </p>
                </div>

                <div className="border-t border-[#21262d] my-1"></div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px] uppercase tracking-wider">
                  <div className="px-1 py-1.5 bg-[#0d1117] border border-[#21262d] rounded">
                    <span className="block text-[12px] font-mono font-medium text-[#d4a843]">
                      {voyages.filter((v) => v.author_id === session.user.id).length}
                    </span>
                    <span className="text-[8px] text-[#7d8590]">Logged logs</span>
                  </div>
                  <div className="px-1 py-1.5 bg-[#0d1117] border border-[#21262d] rounded select-text">
                    <span className="block text-[12px] font-mono font-medium text-[#58a6ff]">
                      {currentUserProfile?.points || 10}
                    </span>
                    <span className="text-[8px] text-[#7d8590]">Sextant Pts</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerAnchorCoordinatesLog}
                  className="w-full mt-1 px-2.5 py-1.5 text-[11px] text-[#c9d1d9] bg-[#161b22] border border-[#21262d] hover:bg-[#21262d] hover:border-[#d4a843]/40 rounded cursor-pointer transition-colors uppercase tracking-wider font-normal"
                >
                  ⚓ Log Position
                </button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-3">
                <p className="text-[11.5px] text-[#c9d1d9] leading-relaxed">
                  Join the Sovereign wind fleet to log courses, vote on voyages, and build your crew status.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/login"
                    className="w-full py-1.5 bg-[#d4a843] text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded text-center no-underline hover:bg-opacity-90 cursor-pointer block"
                  >
                    Report to Bridge
                  </Link>
                  <Link
                    href="/register"
                    className="w-full py-1.5 bg-[#161b22] border border-[#21262d] text-[#c9d1d9] font-normal text-[11px] uppercase tracking-wider rounded text-center no-underline hover:bg-[#21262d] block cursor-pointer"
                  >
                    Register New Coms
                  </Link>
                </div>
              </div>
            )}

            {/* GPS Screen */}
            {anchorLog && (
              <div className="bg-[#0d1117] p-2.5 border border-[#30363d] rounded text-[10px] font-mono text-[#7d8590] mt-1 space-y-1.5 select-text">
                <div className="flex justify-between">
                  <span>LATITUDE:</span>
                  <span className="text-[#e6edf3]">{anchorLog.lat}° N</span>
                </div>
                <div className="flex justify-between">
                  <span>LONGITUDE:</span>
                  <span className="text-[#e6edf3]">{anchorLog.lng}° W</span>
                </div>
                <div className="text-[8.5px] uppercase tracking-widest text-[#d4a843] text-right">
                  {anchorLog.time}
                </div>
              </div>
            )}
          </div>

          {/* Widget 2: Category "The Seas" Navigation */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3.5">
            <h3 className="text-[11px] font-normal uppercase tracking-wider text-[#7d8590] mb-3 flex items-center justify-between">
              <span>The Seas</span>
              <span className="text-[10px] font-mono">MAPS</span>
            </h3>

            <nav className="flex flex-col gap-1 text-[12px]">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-2 py-1.5 text-left rounded cursor-pointer transition-colors uppercase text-[11px] tracking-wider font-normal flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-[#251b00] border-l-2 border-[#d4a843] text-[#e6edf3]'
                    : 'text-[#c9d1d9] hover:bg-[#21262d]'
                }`}
              >
                <span>⚓ Ocean (Show All)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a843]"></span>
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase() || selectedCategory === cat.name;
                let colorClass = '#7d8590';
                if (cat.name === 'Navigation') colorClass = '#58a6ff';
                if (cat.name === 'Creative Cove') colorClass = '#d2a8ff';
                if (cat.name === 'The Logbook') colorClass = '#f78166';
                if (cat.name === 'Quick Signals') colorClass = '#d4a843';

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full px-2 py-1.5 text-left rounded cursor-pointer transition-colors uppercase text-[11px] tracking-wider font-normal flex items-center justify-between ${
                      isActive
                        ? 'bg-[#251b00] border-l-2 border-[#d4a843] text-[#e6edf3]'
                        : 'text-[#c9d1d9] hover:bg-[#21262d]'
                    }`}
                  >
                    <span>
                      {cat.name === 'Tech Waters' && '⚙️ '}
                      {cat.name === 'Navigation' && '🧭 '}
                      {cat.name === 'Creative Cove' && '🌊 '}
                      {cat.name === 'The Logbook' && '📖 '}
                      {cat.name === 'Quick Signals' && '📡 '}
                      {cat.name}
                    </span>
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: colorClass }}
                    ></span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Widget 3: Crew Ranks Guide */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3.5">
            <h3 className="text-[11px] font-normal uppercase tracking-wider text-[#7d8590] mb-3">
              Crew Ranks
            </h3>

            <div className="space-y-2">
              {[
                { name: 'Deckhand', range: '0 - 50 Pts', color: '#7d8590' },
                { name: 'First Mate', range: '51 - 500 Pts', color: '#58a6ff' },
                { name: 'Captain', range: '501 - 2,000 Pts', color: '#d4a843' },
                { name: 'Admiral', range: '2,000+ Pts', color: '#f78166' }
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

      {/* Start Voyage Modal Overlay */}
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

            {/* Form */}
            <form onSubmit={handleLaunchVoyage} className="p-4 space-y-4 text-xs font-normal">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
                  Title of the Course / Voyage Link Title (Uppercased in feed)
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: COMPILING OFFLINE VECTOR CHANNELS IN HIGH SEAS"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] uppercase tracking-wide placeholder-[#484f58] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium font-medium">
                  Target Ocean Ocean Segment (Category)
                </label>
                <select
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  className="w-full h-10 px-2 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] tracking-wide uppercase focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7d8590] mb-1 font-medium">
                  Logbook Description / Chronicle entry
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="DESCRIBE YOUR DISCOVERY AND SPECIFIED LINK OR MANUAL..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-xs text-[#e6edf3] placeholder-[#484f58] focus:outline-none resize-none font-sans"
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
                  disabled={submittingThread}
                  className="px-4 py-2 bg-[#d4a843] hover:bg-opacity-90 text-[#1a1200] font-medium text-[11px] uppercase tracking-wider rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" /> Log Voyage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Voyage expanded view & replies board drawer */}
      {expandedThread && (
        <div 
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#161b22] border-l border-[#30363d] shadow-2xl flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Toolbar */}
          <div className="h-[52px] px-4 bg-[#1b212a] border-b border-[#21262d] flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-[#d4a843]">📖</span>
              <span className="text-[11px] font-normal uppercase tracking-wider text-[#e6edf3]">
                Chronicle: {expandedThread.category?.name || 'Tech Waters'}
              </span>
            </div>
            <button
              onClick={() => setExpandedThread(null)}
              className="p-1 hover:bg-[#21262d] rounded transition-colors text-[#7d8590] hover:text-[#e6edf3] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 select-text">
            {/* Post Card details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#7d8590] select-none">
                <span className="font-semibold text-[#d4a843]">
                  {expandedThread.category?.name || 'Tech Waters'}
                </span>
                <span>·</span>
                <span style={{ color: getMaritimeRank(expandedThread.author?.points || 0).color }} className="font-medium lowercase">
                  ⚓ {expandedThread.author?.username || 'anonymous'}
                </span>
                <span>·</span>
                <span>
                  {expandedThread.created_at.includes('T')
                    ? new Date(expandedThread.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' })
                    : '1h ago'}
                </span>
              </div>

              <h2 className="font-medium text-base text-[#e6edf3] leading-snug">
                {expandedThread.title}
              </h2>

              <p className="text-[#c9d1d9] text-[13.5px] leading-relaxed whitespace-pre-wrap">
                {expandedThread.description}
              </p>

              {/* Stats detail banner */}
              <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider text-[#7d8590] pt-2 border-t border-[#21262d]">
                <span className="font-medium text-[#d4a843]">{expandedThread.upvotes_count} sextant points</span>
                <span>{expandedThread.replies_count} replies logged</span>
                <span>{expandedThread.views_count} navigational views</span>
              </div>
            </div>

            {/* Replies and thread chronicle logs */}
            <div className="space-y-4 pt-4 border-t border-[#21262d]">
              <h3 className="text-[11px] font-normal uppercase tracking-wider text-[#d4a843] mb-2 select-none">
                REPLIES LOG & BROADCAST
              </h3>

              {repliesList.length === 0 ? (
                <div className="text-center py-6 bg-[#0d1117] border border-[#21262d] rounded-md select-none">
                  <p className="text-[11px] text-[#7d8590] uppercase tracking-wider">No signals logged back to this vessel.</p>
                  <p className="text-[10px] text-[#484f58] mt-1">Be the first to broad message through the console below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {repliesList.map((reply: any) => {
                    const rRank = getMaritimeRank(reply.author?.points || 0);
                    return (
                      <div 
                        key={reply.id} 
                        className="bg-[#0d1117] border border-[#21262d] p-3 rounded"
                      >
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#7d8590] mb-1.5 select-none">
                          <span style={{ color: rRank.color }} className="font-medium lowercase">
                            ⚓ {reply.author?.username || 'anonymous'} ({rRank.name})
                          </span>
                          <span>
                            {reply.created_at && reply.created_at.includes('T')
                              ? new Date(reply.created_at).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })
                              : 'just now'}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-[#c9d1d9] leading-relaxed select-text">{reply.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form write comments */}
          {session ? (
            <form 
              onSubmit={handlePostReply} 
              className="p-4 bg-[#1b212a] border-t border-[#21262d] flex items-center gap-2 select-none"
            >
              <input
                type="text"
                required
                disabled={submittingReply}
                placeholder="Post a reply back to this vessel..."
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                className="flex-1 h-9 px-3 bg-[#0d1117] border border-[#21262d] focus:border-[#d4a843] rounded text-[12px] text-[#e6edf3] placeholder-[#484f58] focus:outline-none"
              />
              <button
                type="submit"
                disabled={submittingReply}
                className="h-9 px-3.5 bg-[#d4a843] text-[#1a1200] rounded hover:bg-opacity-95 font-medium text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3 h-3" /> Reply
              </button>
            </form>
          ) : (
            <div className="p-4 bg-[#161b22] border-t border-[#21262d] text-center text-[11px] uppercase text-[#7d8590] select-none">
              Please{' '}
              <Link href="/login" className="text-[#d4a843] underline hover:text-[#e6edf3]">
                report to the bridge
              </Link>{' '}
              to dispatch radio signals on this chronicle.
            </div>
          )}
        </div>
      )}

      {/* Background Dim shield */}
      {expandedThread && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" 
          onClick={() => setExpandedThread(null)}
        />
      )}
    </div>
  );
}
