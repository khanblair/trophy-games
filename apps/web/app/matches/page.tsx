'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, TrendingUp, Timer, Zap, CheckCircle2, AlertCircle, Loader2, Search, Filter, Calendar, Crown, DollarSign, Star, RefreshCw, Cpu } from 'lucide-react';
import { MatchData } from '@trophy-games/shared';
import { analyzeMatch, AIAnalysis, AICallMetadata } from '@/lib/ai';
import { MatchDetailModal } from '@/components/MatchDetailModal';
import { ModelSelector } from '@/components/ModelSelector';
import { cn } from '@/lib/utils';
import { DEFAULT_MODEL, AIModel } from '@/app/constants/models';


export default function MatchesPage() {
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
    const [analysisMetadata, setAnalysisMetadata] = useState<Record<string, AICallMetadata>>({});

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Finished' | 'Scheduled'>('All');
    const [typeFilter, setTypeFilter] = useState<'All' | 'free' | 'paid' | 'vip' | 'unassigned'>('All');
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [dateFilter, setDateFilter] = useState('');

    // Modal States
    const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchMatches = async () => {
        try {
            const res = await fetch('/api/admin/matches');
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
        fetchMatches(); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        await fetchMatches();
    };

    // Tag a proxy match as free/paid/vip. Sends the full match so Convex can
    // upsert it (matches originate from the FootyStats proxy, not Convex).
    const updateMatchType = async (matchId: string, matchType: 'free' | 'paid' | 'vip' | 'unassigned') => {
        const match = matches.find(m => m.id === matchId);
        setUpdatingId(matchId);
        try {
            await fetch('/api/admin/match-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, matchType, match })
            });
            setMatches(prev => prev.map(m =>
                m.id === matchId ? { ...m, matchType } : m
            ));
        } catch (e) {
            console.error('Update failed', e);
        }
        setUpdatingId(null);
    };

    const handleAnalyze = async (e: React.MouseEvent, match: MatchData) => {
        e.stopPropagation();
        setAnalyzingId(match.id);
        
        try {
            const result = await analyzeMatch(match, selectedModel);
            
            // Store metadata if model failover occurred
            if (result.metadata) {
                setAnalysisMetadata(prev => ({ ...prev, [match.id]: result.metadata! }));
            }
            
            setAnalyses(prev => ({ ...prev, [match.id]: result }));

            if (selectedMatch?.id === match.id) {
                setSelectedMatch(prev => prev ? { ...prev, aiPrediction: result } : null);
            }

            // Save to Convex via API route (upserts the proxy match if needed)
            await fetch('/api/admin/save-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    match,
                    aiPrediction: {
                        prediction: result.prediction,
                        confidence: result.confidence,
                        reasoning: result.reasoning,
                        suggestedBet: result.suggestedBet,
                    }
                })
            });
        } catch (err) {
            console.error('[AI] Failed to analyze:', err);
        }

        setAnalyzingId(null);
    };

    const handleOpenModal = (match: MatchData) => {
        const matchWithAnalysis = analyses[match.id]
            ? { ...match, aiPrediction: analyses[match.id] }
            : match;
        setSelectedMatch(matchWithAnalysis);
        setIsDetailModalOpen(true);
    };

    // Filter Logic
    const filteredMatches = matches.filter(match => {
        const matchesSearch =
            match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.league.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Live' && (match.status === 'Live' || match.status.includes('H'))) ||
            (statusFilter === 'Finished' && (match.status === 'Finished' || match.status === 'FT')) ||
            (statusFilter === 'Scheduled' && match.status === 'Scheduled');

        const matchesLeague = selectedLeague === 'All' || match.league === selectedLeague;
        const matchesDate = !dateFilter || match.timestamp.includes(dateFilter);

        const matchesType = typeFilter === 'All' ||
            (typeFilter === 'unassigned' ? (!match.matchType || match.matchType === 'unassigned') : match.matchType === typeFilter);

        return matchesSearch && matchesStatus && matchesLeague && matchesDate && matchesType;
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
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Matches</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Live matches from the data feed. Tag tips and generate AI predictions — these sync to mobile.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors text-sm"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* AI Model Selector */}
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500">
                    <Cpu size={18} />
                    <span className="text-sm font-medium">AI Model for Analysis:</span>
                </div>
                <div className="w-64">
                    <ModelSelector 
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        disabled={analyzingId !== null}
                    />
                </div>
                {Object.values(analysisMetadata).some(m => m.attempts > 1) && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                        <AlertCircle size={14} />
                        <span>Auto-failover active - some analyses switched models due to rate limits</span>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-white">{matches.length}</div>
                    <div className="text-sm text-zinc-500">Total Matches</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{matchTypeCounts.free}</div>
                    <div className="text-sm text-blue-600/70 dark:text-blue-400/70">Free Tips</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{matchTypeCounts.paid}</div>
                    <div className="text-sm text-orange-600/70 dark:text-orange-400/70">Paid Tips</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{matchTypeCounts.vip}</div>
                    <div className="text-sm text-purple-600/70 dark:text-purple-400/70">VIP Tips</div>
                </div>
            </div>

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
                            placeholder="Search teams or leagues..."
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
                        <option value="All">All Leagues</option>
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

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-sm font-medium">Loading matches...</p>
                </div>
            ) : matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Zap size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No matches available</p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">There are no matches in the data feed right now. Pull to refresh later.</p>
                    </div>
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Filter size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No matching matches</p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">Adjust your filters to find the matches you are looking for.</p>
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
                                                <span className="text-sm font-mono text-zinc-400">{match.odds?.home || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{match.awayTeam}</span>
                                                <span className="text-sm font-mono text-zinc-400">{match.odds?.away || '-'}</span>
                                            </div>
                                        </div>

                                        {/* Match Type Buttons */}
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

                                        {/* AI Analysis */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={(e) => handleAnalyze(e, match)}
                                                disabled={isAnalyzing}
                                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isAnalyzing ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <BrainCircuit size={12} />
                                                )}
                                                {analysis ? 'Re-analyze' : 'Analyze'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Analysis / Odds */}
                                    <div className="p-6 md:flex-1 bg-zinc-50/50 dark:bg-zinc-900/20">
                                        {!analysis && !match.aiPrediction && !isAnalyzing ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-zinc-400">
                                                <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                                                    <Zap size={24} />
                                                </div>
                                                <p className="text-sm max-w-[200px]">Click the Analyze button to generate AI insights.</p>
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
                                            (() => {
                                                const aiData = analysis || match.aiPrediction;
                                                const metadata = analysisMetadata[match.id];
                                                return aiData ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                                        <TrendingUp size={16} className="text-blue-600" />
                                                        AI Match Verdict
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        {metadata && metadata.attempts > 1 && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                Auto-switched
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold dark:bg-blue-500/10">
                                                            {aiData.confidence}% CONFIDENCE
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                                                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                                        {aiData.prediction}
                                                    </p>
                                                </div>

                                                <div className="grid gap-2">
                                                    {aiData.reasoning?.map((reason: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                                                            <CheckCircle2 size={14} className="text-brand-green shrink-0 mt-0.5" />
                                                            <span>{reason}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {aiData.suggestedBet && (
                                                    <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-600 text-xs dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                        <AlertCircle size={14} className="text-blue-600" />
                                                        <span className="font-bold">Pro Tip:</span>
                                                        {aiData.suggestedBet}
                                                    </div>
                                                )}
                                            </div>
                                                ) : null;
                                            })()
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
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                match={selectedMatch}
            />
        </div>
    );
}
