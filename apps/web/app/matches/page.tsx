'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, TrendingUp, Timer, Zap, CheckCircle2, AlertCircle, Loader2, Search, Filter, Calendar, Crown, DollarSign, Star } from 'lucide-react';
import { MatchData } from '@trophy-games/shared';
import { analyzeMatch, AIAnalysis } from '@/lib/ai';
import { MatchDetailModal } from '@/components/MatchDetailModal';
import { cn } from '@/lib/utils';


export default function MatchesPage() {
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Finished' | 'Scheduled'>('All');
    const [typeFilter, setTypeFilter] = useState<'All' | 'free' | 'paid' | 'vip'>('All');
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [dateFilter, setDateFilter] = useState('');

    // Selection for Modal
    const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleScrape = async () => {
        try {
            await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'live_scrape'
                })
            });
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            console.error('Scrape failed', e);
        }
    };

    const updateMatchType = async (matchId: string, matchType: 'free' | 'paid' | 'vip') => {
        setUpdatingId(matchId);
        try {
            await fetch('/api/mobile/update-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, matchType })
            });
            // Update local state
            setMatches(prev => prev.map(m => 
                m.id === matchId ? { ...m, matchType } : m
            ));
        } catch (e) {
            console.error('Update failed', e);
        }
        setUpdatingId(null);
    };

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch('/api/matches');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMatches(data);
                    
                    // Load existing AI predictions into analyses state
                    const existingAnalyses: Record<string, AIAnalysis> = {};
                    data.forEach((match: MatchData) => {
                        if (match.aiPrediction) {
                            existingAnalyses[match.id] = match.aiPrediction;
                            console.log(`[Loaded] AI prediction for match ${match.id}`);
                        }
                    });
                    setAnalyses(existingAnalyses);
                    console.log(`[Loaded] ${Object.keys(existingAnalyses).length} AI predictions from database`);
                } else {
                    setMatches([]);
                    console.error('Invalid matches data:', data);
                }
            } catch (error) {
                console.error('Failed to fetch matches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, []);

const handleAnalyze = async (e: React.MouseEvent, match: MatchData) => {
        e.stopPropagation(); // Don't open modal when analyzing
        setAnalyzingId(match.id);
        const result = await analyzeMatch(match);
        setAnalyses(prev => ({ ...prev, [match.id]: result }));
        
        // Update selectedMatch if it's the same match
        if (selectedMatch?.id === match.id) {
            setSelectedMatch(prev => prev ? { ...prev, aiPrediction: result } : null);
        }
        
        // Save AI prediction to Convex for mobile sync
        try {
            await fetch('/api/mobile/ai-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    aiPrediction: result
                })
            });
            console.log(`[AI] Saved prediction for match ${match.id}`);
        } catch (err) {
            console.error('[AI] Failed to save prediction:', err);
        }
        
        setAnalyzingId(null);
    };

const handleOpenModal = (match: MatchData) => {
        // Include AI prediction from analyses state if available
        const matchWithAnalysis = analyses[match.id] 
            ? { ...match, aiPrediction: analyses[match.id] }
            : match;
        setSelectedMatch(matchWithAnalysis);
        setIsModalOpen(true);
    };

// Filter Logic
    const filteredMatches = matches.filter(match => {
        const matchesSearch =
            match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.league.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Live' && match.status.includes(':')) ||
            (statusFilter === 'Finished' && match.status === 'FT') ||
            (statusFilter === 'Scheduled' && !match.status.includes(':') && match.status !== 'FT');

        const matchesLeague = selectedLeague === 'All' || match.league === selectedLeague;
        const matchesDate = !dateFilter || match.timestamp.includes(dateFilter);
        
        const matchesType = typeFilter === 'All' || match.matchType === typeFilter;

        return matchesSearch && matchesStatus && matchesLeague && matchesDate && matchesType;
    });

    const uniqueLeagues = Array.from(new Set(matches.map(m => m.league))).sort();
    
    const matchTypeCounts = {
        free: matches.filter(m => !m.matchType || m.matchType === 'free').length,
        paid: matches.filter(m => m.matchType === 'paid').length,
        vip: matches.filter(m => m.matchType === 'vip').length,
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Match Analysis</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Real-time match data with AI predictions and market analysis.</p>
                </div>
                <button
                    onClick={handleScrape}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Zap size={16} />
                    Run Live Scrape
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        />
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Enter team or league..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        />
                    </div>

                    <select
                        value={selectedLeague}
                        onChange={(e) => setSelectedLeague(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm font-medium"
                    >
                        <option value="All">All Leagues</option>
                        {uniqueLeagues.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

<div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full sm:w-auto">
                    {(['All', 'Live', 'Finished', 'Scheduled'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                statusFilter === s
                                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Match Type Filter */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-zinc-500">Match Type:</span>
                <div className="flex gap-2">
                    {(['All', 'free', 'paid', 'vip'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1",
                                typeFilter === type
                                    ? type === 'vip' ? 'bg-purple-500 text-white' : type === 'paid' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {type === 'free' && 'Free'}
                            {type === 'paid' && '$ Paid'}
                            {type === 'vip' && '★ VIP'}
                            {type === 'All' && 'All'}
                            {type !== 'All' && matchTypeCounts[type] > 0 && (
                                <span className="ml-1 text-[10px] opacity-70">({matchTypeCounts[type]})</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-sm font-medium">Loading match data...</p>
                </div>
            ) : matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Zap size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No matches found</p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">Run the scraper to analyze live odds and get professional AI betting predictions.</p>
                    </div>
                    <button
                        onClick={handleScrape}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Zap size={18} />
                        Trigger Live Scrape
                    </button>
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Filter size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No matching matches</p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">Adjust your filters or query to find the matches you are looking for.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 overflow-hidden">
                    {filteredMatches.map((match, i) => {
                        const analysis = analyses[match.id];
                        const isAnalyzing = analyzingId === match.id;

                        return (
                            <div
                                key={`${match.id}-${i}`}
                                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/50"
                                onClick={() => handleOpenModal(match)}
                            >
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800">

                                    {/* Match Info */}
                                    <div className="p-6 md:w-1/3 space-y-4">
<div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-500">
                                            <span className="flex items-center gap-1.5">
                                                <Timer size={14} />
                                                {match.status}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span>{match.league}</span>
                                                {/* Match Type Badge */}
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                                    match.matchType === 'vip' ? "bg-purple-500 text-white" :
                                                    match.matchType === 'paid' ? "bg-orange-500 text-white" :
                                                    "bg-blue-500 text-white"
                                                )}>
                                                    {match.matchType || 'free'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{match.homeTeam}</span>
                                                <span className="text-sm font-mono text-zinc-400">{match.odds?.home}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{match.awayTeam}</span>
                                                <span className="text-sm font-mono text-zinc-400">{match.odds?.away}</span>
                                            </div>
                                        </div>

<div className="pt-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'free');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition",
                                                        !match.matchType || match.matchType === 'free'
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                                                    )}
                                                >
                                                    <Star size={12} />
                                                    Free
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'paid');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition",
                                                        match.matchType === 'paid'
                                                            ? "bg-orange-500 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-orange-100 dark:hover:bg-orange-900"
                                                    )}
                                                >
                                                    <DollarSign size={12} />
                                                    Paid
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'vip');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition",
                                                        match.matchType === 'vip'
                                                            ? "bg-purple-500 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-purple-100 dark:hover:bg-purple-900"
                                                    )}
                                                >
                                                    <Crown size={12} />
                                                    VIP
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-2">
                                            <button
                                                onClick={(e) => handleAnalyze(e, match)}
                                                disabled={isAnalyzing}
                                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <PulseActivity className="animate-spin" size={18} />
                                                        AI is Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BrainCircuit size={18} />
                                                        {analysis ? 'Re-analyze with AI' : 'Predict with AI'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Analysis / Odds */}
                                    <div className="p-6 md:flex-1 bg-zinc-50/50 dark:bg-zinc-900/20">
                                        {!analysis && !isAnalyzing ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-zinc-400">
                                                <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                                                    <Zap size={24} />
                                                </div>
                                                <p className="text-sm max-w-[200px]">Click the AI button to generate deep match insights.</p>
                                            </div>
                                        ) : isAnalyzing ? (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                                <div className="h-20 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                                                <div className="flex gap-2">
                                                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                                        <TrendingUp size={16} className="text-blue-600" />
                                                        AI Match Verdict
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold dark:bg-blue-500/10">
                                                        {analysis.confidence}% CONFIDENCE
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                                                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                                        {analysis.prediction}
                                                    </p>
                                                </div>

                                                <div className="grid gap-2">
                                                    {analysis.reasoning.map((reason, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                                                            <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                                                            <span>{reason}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {analysis.suggestedBet && (
                                                    <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-600 text-xs dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                        <AlertCircle size={14} className="text-blue-600" />
                                                        <span className="font-bold">Pro Tip:</span>
                                                        {analysis.suggestedBet}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <MatchDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                match={selectedMatch}
            />
        </div>
    );
}

function PulseActivity({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
