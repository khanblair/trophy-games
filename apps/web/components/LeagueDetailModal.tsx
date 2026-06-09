'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Globe, Zap, Hash, Star, Crown, DollarSign, Loader2, ArrowUpRight } from 'lucide-react';
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
    const [leagueMatches, setLeagueMatches] = useState<MatchData[]>([]);

    useEffect(() => {
        if (isOpen && league) {
            const filtered = matches.filter(m => {
                const matchLeague = m.league?.toLowerCase() || '';
                const searchLeague = league.name?.toLowerCase() || '';
                const searchCountry = league.country?.toLowerCase() || '';

                return matchLeague.includes(searchLeague) ||
                    searchLeague.includes(matchLeague) ||
                    matchLeague.includes(searchCountry) ||
                    (m.leagueId && league.id && m.leagueId === league.id);
            }).slice(0, 20);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLeagueMatches(filtered);
        }
    }, [isOpen, league, matches]);

    if (!league) return null;

    const updateMatchType = async (matchId: string, type: 'free' | 'paid' | 'vip') => {
        setUpdating(matchId);
        try {
            await fetch('/api/admin/matches', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, updates: { matchType: type } })
            });
            if (onRefreshData) {
                onRefreshData();
            }
        } catch (error) {
            console.error('Failed to update match type:', error);
        }
        setUpdating(null);
    };

    const toggleTrending = async (matchId: string, currentTrending: boolean) => {
        setUpdating(matchId);
        try {
            await fetch('/api/admin/matches', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, updates: { isTrending: !currentTrending } })
            });
            if (onRefreshData) {
                onRefreshData();
            }
        } catch (error) {
            console.error('Failed to toggle trending:', error);
        }
        setUpdating(null);
    };

    const freeMatchesCount = leagueMatches.filter(m => m.matchType === 'free').length;
    const paidMatchesCount = leagueMatches.filter(m => m.matchType === 'paid').length;
    const vipMatchesCount = leagueMatches.filter(m => m.matchType === 'vip').length;

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

                        <div className="grid grid-cols-4 gap-2 pt-2">
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">Total</div>
                                <div className="text-lg font-black">{leagueMatches.length}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">Free</div>
                                <div className="text-lg font-black text-blue-300">{freeMatchesCount}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">Paid</div>
                                <div className="text-lg font-black text-orange-300">{paidMatchesCount}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[9px] font-bold uppercase tracking-widest mb-0.5">VIP</div>
                                <div className="text-lg font-black text-purple-300">{vipMatchesCount}</div>
                            </div>
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
                                            {m.aiPrediction && (
                                                <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded-full font-bold">AI</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg ml-2">
                                        {m.score || 'vs'}
                                    </div>
                                </div>

                                {/* Odds Display */}
                                {m.odds && (
                                    <div className="mb-2 p-2 rounded-lg bg-brand-green/10 dark:bg-brand-green/10 border border-brand-green/20 dark:border-brand-green/30">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] font-bold text-brand-green dark:text-brand-green/80 uppercase">Odds</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-center">
                                            <div className="bg-white dark:bg-zinc-800 rounded py-1">
                                                <div className="text-[9px] text-zinc-500">Home</div>
                                                <div className="text-xs font-mono font-bold text-brand-green">{m.odds.home || '-'}</div>
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
                                        onClick={() => toggleTrending(m.id, m.isTrending || false)}
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
                                <p className="text-xs text-zinc-400">No matches found for this league.</p>
                                <p className="text-[10px] text-zinc-500 mt-1">Add matches from the Matches page.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
