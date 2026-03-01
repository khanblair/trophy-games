'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, Timer, Loader2, Search, Filter, Calendar, Zap, CheckCircle2, AlertCircle, Play, Pause } from 'lucide-react';
import { MatchData } from '@trophy-games/shared';
import { analyzeMatch, AIAnalysis } from '@/lib/ai';
import { MatchDetailModal } from '@/components/MatchDetailModal';
import { cn } from '@/lib/utils';

const LIVE_LEAGUES = [
    { key: 'soccer_epl', name: 'English Premier League', id: 36 },
    { key: 'soccer_spain_la_liga', name: 'Spanish La Liga', id: 31 },
    { key: 'soccer_germany_bundesliga', name: 'German Bundesliga', id: 8 },
    { key: 'soccer_italy_serie_a', name: 'Italian Serie A', id: 34 },
    { key: 'soccer_france_ligue_one', name: 'French Ligue 1', id: 11 },
    { key: 'soccer_usa_mls', name: 'USA MLS', id: 27 },
    { key: 'soccer_australia_aleague', name: 'Australian A-League', id: 273 },
    { key: 'soccer_netherlands_eredivisie', name: 'Dutch Eredivisie', id: 19 },
    { key: 'soccer_belgium_first_div', name: 'Belgium First Division', id: 4 },
    { key: 'soccer_portugal_primeira_liga', name: 'Portuguese Primeira Liga', id: 42 },
];

export default function LivePage() {
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30);

    const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMatches = async () => {
        try {
            const res = await fetch('/api/matches');
            const data = await res.json();
            if (Array.isArray(data)) {
                const liveMatches = data.filter((m: MatchData) => 
                    m.status.includes('Live') || 
                    m.status === 'Halftime' ||
                    m.source === 'goaloo-live'
                );
                setMatches(liveMatches);
            }
        } catch (error) {
            console.error('Failed to fetch matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_live' })
            });
            await fetchMatches();
        } catch (e) {
            console.error('Refresh failed', e);
        }
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchMatches();
        }, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    const handleAnalyze = async (e: React.MouseEvent, match: MatchData) => {
        e.stopPropagation();
        setAnalyzingId(match.id);
        const result = await analyzeMatch(match);
        setAnalyses(prev => ({ ...prev, [match.id]: result }));
        
        if (selectedMatch?.id === match.id) {
            setSelectedMatch(prev => prev ? { ...prev, aiPrediction: result } : null);
        }
        
        try {
            await fetch('/api/mobile/ai-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    aiPrediction: result
                })
            });
        } catch (err) {
            console.error('[AI] Failed to save prediction:', err);
        }
        
        setAnalyzingId(null);
    };

    const handleOpenModal = (match: MatchData) => {
        const matchWithAnalysis = analyses[match.id] 
            ? { ...match, aiPrediction: analyses[match.id] }
            : match;
        setSelectedMatch(matchWithAnalysis);
        setIsModalOpen(true);
    };

    const filteredMatches = matches.filter(match => {
        const matchesSearch =
            match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.league.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLeague = selectedLeague === 'All' || match.league === selectedLeague;

        return matchesSearch && matchesLeague;
    });

    const uniqueLeagues = Array.from(new Set(matches.map(m => m.league))).sort();

    const liveCount = matches.filter(m => m.status.includes('Live')).length;
    const halftimeCount = matches.filter(m => m.status === 'Halftime').length;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Live Matches</h1>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-white"></span>
                            LIVE
                        </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">Real-time live matches from Goaloo with live scores.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Zap size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                autoRefresh 
                                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" 
                                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            )}
                        >
                            {autoRefresh ? <Play size={14} /> : <Pause size={14} />}
                            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                        </button>
                        {autoRefresh && (
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm"
                            >
                                <option value={15}>15s</option>
                                <option value={30}>30s</option>
                                <option value={60}>60s</option>
                            </select>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">{liveCount} Live</span>
                    </span>
                    {halftimeCount > 0 && (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            <span className="font-medium text-zinc-600 dark:text-zinc-300">{halftimeCount} Halftime</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search teams..."
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

                <div className="text-sm text-zinc-500">
                    {filteredMatches.length} live matches
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-sm font-medium">Loading live matches...</p>
                </div>
            ) : filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Timer size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No live matches</p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">There are no live matches at the moment. Check back later or click refresh.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Zap size={18} />
                        Refresh Now
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 overflow-hidden">
                    {filteredMatches.map((match, i) => {
                        const analysis = analyses[match.id];
                        const isAnalyzing = analyzingId === match.id;
                        const isLive = match.status.includes('Live');
                        const isHalftime = match.status === 'Halftime';

                        return (
                            <div
                                key={`${match.id}-${i}`}
                                className="group overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer dark:border-red-800/50 dark:bg-zinc-900/50"
                                onClick={() => handleOpenModal(match)}
                            >
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800">
                                    <div className="p-6 md:w-1/3 space-y-4">
                                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                                            <span className={cn(
                                                "flex items-center gap-1.5",
                                                isLive ? "text-red-600 dark:text-red-500" : 
                                                isHalftime ? "text-yellow-600 dark:text-yellow-500" : "text-zinc-500"
                                            )}>
                                                <Timer size={14} />
                                                {match.status}
                                            </span>
                                            <span className="text-zinc-500">{match.league}</span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{match.homeTeam}</span>
                                                <span className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{match.homeScore ?? 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{match.awayTeam}</span>
                                                <span className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{match.awayScore ?? 0}</span>
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
                                                        <Loader2 className="animate-spin" size={18} />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BrainCircuit size={18} />
                                                        {analysis ? 'Re-analyze' : 'Predict'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 md:flex-1 bg-red-50/30 dark:bg-red-900/10">
                                        {!analysis && !isAnalyzing ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-zinc-400">
                                                <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                                                    <Zap size={24} />
                                                </div>
                                                <p className="text-sm max-w-[200px]">Click AI to generate match predictions.</p>
                                            </div>
                                        ) : isAnalyzing ? (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                                                <div className="h-20 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                                        <BrainCircuit size={16} className="text-blue-600" />
                                                        AI Prediction
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

            <MatchDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                match={selectedMatch}
            />
        </div>
    );
}
