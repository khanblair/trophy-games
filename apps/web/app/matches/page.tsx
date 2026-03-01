'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, TrendingUp, Timer, Zap, CheckCircle2, AlertCircle, Loader2, Search, Filter, Calendar, Crown, DollarSign, Star, Radio, RefreshCw } from 'lucide-react';
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
    const [syncingOdds, setSyncingOdds] = useState(false);
    const [syncingLive, setSyncingLive] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{ oddsMatches: number; liveMatches: number; lastOddsSync: string | null } | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Finished' | 'Scheduled'>('All');
    const [typeFilter, setTypeFilter] = useState<'All' | 'free' | 'paid' | 'vip' | 'unassigned'>('All');
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'All' | 'odds-api' | 'goaloo-live'>('All');

    // Selection for Modal
    const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchSyncStatus = async () => {
        try {
            const res = await fetch('/api/sync');
            const data = await res.json();
            setSyncStatus({
                oddsMatches: data.oddsMatchesCount || 0,
                liveMatches: data.liveMatchesCount || 0,
                lastOddsSync: data.lastOddsSync
            });
        } catch (e) {
            console.error('Failed to fetch sync status', e);
        }
    };

    const fetchMatches = async () => {
        try {
            const res = await fetch('/api/matches');
            const data = await res.json();
            if (Array.isArray(data)) {
                setMatches(data);

                const existingAnalyses: Record<string, AIAnalysis> = {};
                data.forEach((match: MatchData) => {
                    if (match.aiPrediction) {
                        existingAnalyses[match.id] = match.aiPrediction;
                    }
                });
                setAnalyses(existingAnalyses);
            }
        } catch (error) {
            console.error('Failed to fetch matches:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
        fetchSyncStatus();
    }, []);

    const handleRefresh = async () => {
        await fetchMatches();
        await fetchSyncStatus();
    };

    const handleSyncOdds = async () => {
        setSyncingOdds(true);
        console.log('[Matches] Starting Odds API sync...');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_odds' })
            });
            const data = await res.json();
            console.log('[Matches] Odds sync response:', data);

            setTimeout(async () => {
                await fetchMatches();
                await fetchSyncStatus();
                setSyncingOdds(false);
                console.log('[Matches] Odds sync completed!');
            }, 3000);
        } catch (e) {
            console.error('[Matches] Odds sync failed:', e);
            setSyncingOdds(false);
        }
    };

    const handleSyncLive = async () => {
        setSyncingLive(true);
        console.log('[Matches] Starting Live sync...');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_live' })
            });
            const data = await res.json();
            console.log('[Matches] Live sync response:', data);

            setTimeout(async () => {
                await fetchMatches();
                await fetchSyncStatus();
                setSyncingLive(false);
                console.log('[Matches] Live sync completed!');
            }, 3000);
        } catch (e) {
            console.error('[Matches] Live sync failed:', e);
            setSyncingLive(false);
        }
    };

    const updateMatchType = async (matchId: string, matchType: 'free' | 'paid' | 'vip' | 'unassigned') => {
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
            (statusFilter === 'Live' && match.source === 'goaloo-live') ||
            (statusFilter === 'Finished' && match.status === 'FT') ||
            (statusFilter === 'Scheduled' && !match.status.includes(':') && match.status !== 'FT');

        const matchesLeague = selectedLeague === 'All' || match.league === selectedLeague;
        const matchesDate = !dateFilter || match.timestamp.includes(dateFilter);

        const matchesType = typeFilter === 'All' ||
            (typeFilter === 'unassigned' ? (!match.matchType || match.matchType === 'unassigned') : match.matchType === typeFilter);

        const matchesSource = sourceFilter === 'All' || match.source === sourceFilter;

        return matchesSearch && matchesStatus && matchesLeague && matchesDate && matchesType && matchesSource;
    });

    const uniqueLeagues = Array.from(new Set(matches.map(m => m.league))).sort();

    const matchTypeCounts = {
        unassigned: matches.filter(m => !m.matchType || m.matchType === 'unassigned').length,
        free: matches.filter(m => m.matchType === 'free').length,
        paid: matches.filter(m => m.matchType === 'paid').length,
        vip: matches.filter(m => m.matchType === 'vip').length,
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Match Analysis</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Real-time match data with AI predictions and market analysis.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors text-sm"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={handleSyncOdds}
                        disabled={syncingOdds}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                    >
                        {syncingOdds ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        <span className="hidden sm:inline">{syncingOdds ? '...' : 'Odds'}</span>
                    </button>
                    <button
                        onClick={handleSyncLive}
                        disabled={syncingLive}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                    >
                        {syncingLive ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                        <span className="hidden sm:inline">{syncingLive ? '...' : 'Live'}</span>
                    </button>
                </div>
            </div>

            {/* Sync Status */}
            {syncStatus && (
                <div className="bg-gradient-to-r from-green-400/10 to-red-500/10 rounded-xl p-3 md:p-4 border border-green-400/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                        <div className="flex flex-wrap gap-3">
                            <span className="text-green-600 font-medium text-sm">📊 {syncStatus.oddsMatches}</span>
                            <span className="text-red-600 font-medium text-sm">⚽ {syncStatus.liveMatches}</span>
                        </div>
                        <span className="text-zinc-500 text-xs">{syncStatus.lastOddsSync ? new Date(syncStatus.lastOddsSync).toLocaleString() : 'Never'}</span>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 bg-white dark:bg-zinc-900/50 p-3 md:p-4 rounded-xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-auto">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full sm:w-36 pl-9 pr-2 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                        />
                    </div>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                        />
                    </div>

                    <select
                        value={selectedLeague}
                        onChange={(e) => setSelectedLeague(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                    >
                        <option value="All">All</option>
                        {uniqueLeagues.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1">
                    {(['All', 'Live', 'Finished', 'Scheduled'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                                statusFilter === s
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
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
                    {(['All', 'unassigned', 'free', 'paid', 'vip'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1",
                                typeFilter === type
                                    ? type === 'vip' ? 'bg-purple-500 text-white' : type === 'paid' ? 'bg-orange-500 text-white' : type === 'unassigned' ? 'bg-zinc-500 text-white' : 'bg-blue-500 text-white'
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {type === 'unassigned' && 'Unassigned'}
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

            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-zinc-500">Source:</span>
                <div className="flex gap-2">
                    {(['All', 'odds-api', 'goaloo-live'] as const).map((source) => (
                        <button
                            key={source}
                            onClick={() => setSourceFilter(source)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1",
                                sourceFilter === source
                                    ? source === 'odds-api' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {source === 'odds-api' && '📊 Odds API'}
                            {source === 'goaloo-live' && '⚽ Goaloo Live'}
                            {source === 'All' && 'All Sources'}
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
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">Click sync to fetch latest odds from The Odds API.</p>
                    </div>
                    <button
                        onClick={handleSyncOdds}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Zap size={18} />
                        Sync Odds
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
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    match.matchType === 'vip' ? "bg-purple-500 text-white" :
                                                        match.matchType === 'paid' ? "bg-orange-500 text-white" :
                                                            match.matchType === 'unassigned' || !match.matchType ? "bg-zinc-500 text-white" :
                                                                "bg-blue-500 text-white"
                                                )}>
                                                    {match.matchType || 'unassigned'}
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
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'unassigned');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition",
                                                        !match.matchType || match.matchType === 'unassigned'
                                                            ? "bg-zinc-600 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                                    )}
                                                >
                                                    <Filter size={10} />
                                                    None
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'free');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition",
                                                        match.matchType === 'free'
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                                                    )}
                                                >
                                                    <Star size={10} />
                                                    Free
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'paid');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition",
                                                        match.matchType === 'paid'
                                                            ? "bg-orange-500 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-orange-100 dark:hover:bg-orange-900"
                                                    )}
                                                >
                                                    <DollarSign size={10} />
                                                    Paid
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMatchType(match.id, 'vip');
                                                    }}
                                                    disabled={updatingId === match.id}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition",
                                                        match.matchType === 'vip'
                                                            ? "bg-purple-500 text-white"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-purple-100 dark:hover:bg-purple-900"
                                                    )}
                                                >
                                                    <Crown size={10} />
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
