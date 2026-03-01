'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Globe, Zap, Hash, Calendar, ArrowUpRight, Star, Crown, DollarSign, Loader2, TrendingUp, RefreshCw, ExternalLink, BarChart3 } from 'lucide-react';
import { LeagueInfo, MatchData } from '@trophy-games/shared';
import { Modal } from './Modal';

interface LeagueDetailModalProps {
    league: LeagueInfo | null;
    matches: MatchData[];
    isOpen: boolean;
    onClose: () => void;
    onRefreshData?: () => void;
}

export function LeagueDetailModal({ league, matches, isOpen, onClose, onRefreshData }: LeagueDetailModalProps) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [refreshingOdds, setRefreshingOdds] = useState(false);
    const [leagueMatches, setLeagueMatches] = useState<MatchData[]>([]);

    useEffect(() => {
        if (isOpen && league) {
            const filtered = matches.filter(m => {
                const matchLeague = m.league?.toLowerCase() || '';
                const searchLeague = league.name?.toLowerCase() || '';
                const searchCountry = league.country?.toLowerCase() || '';
                const leagueKey = searchLeague.replace(/ /g, '_').toLowerCase();

                return matchLeague.includes(searchLeague) ||
                    searchLeague.includes(matchLeague) ||
                    matchLeague.includes(searchCountry) ||
                    matchLeague.includes(leagueKey) ||
                    (m.leagueId && league.id && m.leagueId === league.id);
            }).slice(0, 20);

            setLeagueMatches(filtered);
        }
    }, [isOpen, league, matches]);

    const handleRefreshOdds = useCallback(async () => {
        setRefreshingOdds(true);
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_odds' })
            });

            if (res.ok) {
                setTimeout(async () => {
                    if (onRefreshData) {
                        onRefreshData();
                    }
                    setRefreshingOdds(false);
                }, 3000);
            } else {
                setRefreshingOdds(false);
            }
        } catch (error) {
            console.error('Failed to refresh odds:', error);
            setRefreshingOdds(false);
        }
    }, [onRefreshData]);

    const handleRefreshLive = useCallback(async () => {
        setRefreshingOdds(true);
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_live' })
            });

            if (res.ok) {
                setTimeout(async () => {
                    if (onRefreshData) {
                        onRefreshData();
                    }
                    setRefreshingOdds(false);
                }, 3000);
            } else {
                setRefreshingOdds(false);
            }
        } catch (error) {
            console.error('Failed to refresh live:', error);
            setRefreshingOdds(false);
        }
    }, [onRefreshData]);

    if (!league) return null;

    const updateMatchType = async (matchId: string, type: 'free' | 'paid' | 'vip') => {
        setUpdating(matchId);
        try {
            await fetch('/api/mobile/update-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, matchType: type })
            });
            if (onRefreshData) {
                onRefreshData();
            }
        } catch (error) {
            console.error('Failed to update match type:', error);
        }
        setUpdating(null);
    };

    const toggleTrending = async (matchId: string) => {
        setUpdating(matchId);
        try {
            await fetch('/api/mobile/update-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, isTrending: true })
            });
        } catch (error) {
            console.error('Failed to toggle trending:', error);
        }
        setUpdating(null);
    };

    const oddsMatchesCount = leagueMatches.filter(m => m.odds && m.source === 'odds-api').length;
    const liveMatchesCount = leagueMatches.filter(m => m.source === 'goaloo-live' || m.status.includes('Live')).length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="League Overview"
            className="max-w-4xl"
        >
            <div className="space-y-6 pb-4">
                {/* League Header Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Trophy size={80} />
                    </div>

                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-white/20 rounded-full w-fit backdrop-blur-md border border-white/20">
                            <Zap size={12} className="text-yellow-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{league.type}</span>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-black tracking-tight">{league.name}</h2>
                            <div className="flex items-center gap-2 text-blue-100 font-medium text-sm">
                                <Globe size={14} />
                                <span>{league.country || 'International'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">Matches</div>
                                <div className="text-lg font-black">{league.matchCount || leagueMatches.length}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">Odds API</div>
                                <div className="text-lg font-black text-green-300">{oddsMatchesCount}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">Live</div>
                                <div className="text-lg font-black text-red-300">{liveMatchesCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sync Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleRefreshOdds}
                        disabled={refreshingOdds}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                    >
                        {refreshingOdds ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <BarChart3 size={14} />
                        )}
                        {refreshingOdds ? 'Syncing...' : 'Sync Odds (API)'}
                    </button>
                    <button
                        onClick={handleRefreshLive}
                        disabled={refreshingOdds}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                    >
                        {refreshingOdds ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <ExternalLink size={14} />
                        )}
                        {refreshingOdds ? '...' : 'Sync Live'}
                    </button>
                </div>

                {/* Sub-sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Information */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-blue-500" />
                            Data Sources
                        </h3>
                        <div className="space-y-2">
                            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs font-bold text-green-700 dark:text-green-400">The Odds API</span>
                                </div>
                                <p className="text-[10px] text-green-600 dark:text-green-500 font-medium">
                                    Pre-match 1X2 & Over/Under odds from US/UK/EU bookmakers.
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-red-700 dark:text-red-400">Goaloo Live</span>
                                </div>
                                <p className="text-[10px] text-red-600 dark:text-red-500 font-medium">
                                    Real-time live scores, match events & in-play odds.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Matches */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={14} className="text-blue-500" />
                            Matches ({leagueMatches.length})
                        </h3>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {leagueMatches.length > 0 ? leagueMatches.map((m, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">{m.homeTeam} vs {m.awayTeam}</span>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                <span className="text-[10px] text-zinc-500">{m.status}</span>
                                                {m.source === 'goaloo-live' && (
                                                    <span className="text-[9px] px-1 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">LIVE</span>
                                                )}
                                                {m.source === 'odds-api' && m.odds && (
                                                    <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-600 rounded-full font-bold">ODDS</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg ml-2">
                                            {m.score || 'vs'}
                                        </div>
                                    </div>

                                    {/* Odds Display - From The Odds API */}
                                    {m.odds && m.source === 'odds-api' && (
                                        <div className="mb-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-bold text-green-700 dark:text-green-400 uppercase">1X2 Odds</span>
                                                <BarChart3 size={10} className="text-green-600" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-1 text-center">
                                                <div className="bg-white dark:bg-zinc-800 rounded py-1">
                                                    <div className="text-[9px] text-zinc-500">Home</div>
                                                    <div className="text-xs font-mono font-bold text-green-600">{m.odds.home || '-'}</div>
                                                </div>
                                                <div className="bg-white dark:bg-zinc-800 rounded py-1">
                                                    <div className="text-[9px] text-zinc-500">Draw</div>
                                                    <div className="text-xs font-mono font-bold text-zinc-600">{m.odds.draw || '-'}</div>
                                                </div>
                                                <div className="bg-white dark:bg-zinc-800 rounded py-1">
                                                    <div className="text-[9px] text-zinc-500">Away</div>
                                                    <div className="text-xs font-mono font-bold text-red-600">{m.odds.away || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                            {(['free', 'paid', 'vip'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => updateMatchType(m.id, type)}
                                                    disabled={updating === m.id}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${m.matchType === type
                                                            ? type === 'vip' ? 'bg-purple-500 text-white' : type === 'paid' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                                            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'
                                                        }`}
                                                >
                                                    {type === 'free' ? 'F' : type === 'paid' ? '$' : '★'}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => toggleTrending(m.id)}
                                            className={`p-1 rounded-lg transition-colors ${m.isTrending
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400 hover:bg-yellow-400 hover:text-black'
                                                }`}
                                            title="Mark as Trending"
                                        >
                                            <Star size={11} fill={m.isTrending ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    <p className="text-xs text-zinc-400">No matches found.</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">Click "Sync Odds" to fetch from The Odds API.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* External Link */}
                <a
                    href={league.url || `https://www.goaloo.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-900 dark:text-zinc-50 font-bold text-xs"
                >
                    <span>View on Goaloo.com</span>
                    <ArrowUpRight size={14} />
                </a>
            </div>
        </Modal>
    );
}
