'use client';

import React, { useState } from 'react';
import { Trophy, Globe, Zap, Hash, Calendar, ArrowUpRight, Star, Crown, DollarSign, Loader2 } from 'lucide-react';
import { LeagueInfo, MatchData } from '@/lib/scraper/parsers';
import { Modal } from './Modal';

interface LeagueDetailModalProps {
    league: LeagueInfo | null;
    matches: MatchData[];
    isOpen: boolean;
    onClose: () => void;
}

export function LeagueDetailModal({ league, matches, isOpen, onClose }: LeagueDetailModalProps) {
    const [updating, setUpdating] = useState<string | null>(null);
    
    if (!league) return null;

    // Filter matches for this league
    const leagueMatches = matches.filter(m => m.league === league.name).slice(0, 10);

    const updateMatchType = async (matchId: string, type: 'free' | 'paid' | 'vip') => {
        setUpdating(matchId);
        try {
            await fetch('/api/mobile/update-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, matchType: type })
            });
            // Refresh would happen via parent
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

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'vip': return 'bg-purple-500';
            case 'paid': return 'bg-orange-500';
            default: return 'bg-blue-500';
        }
    };

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'vip': return <Crown size={12} />;
            case 'paid': return <DollarSign size={12} />;
            default: return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="League Overview"
            className="max-w-3xl"
        >
            <div className="space-y-8 pb-4">
                {/* League Header Card */}
                <div className="p-8 rounded-3xl bg-blue-600 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy size={120} />
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full w-fit backdrop-blur-md border border-white/20">
                            <Zap size={14} className="text-yellow-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{league.type}</span>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight">{league.name}</h2>
                            <div className="flex items-center gap-2 text-blue-100 font-medium">
                                <Globe size={16} />
                                <span>{league.country || 'International'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">>
                                <divTotal Matches</div className="text-2xl font-black">{league.matchCount || 0}</div>
                            </div>
                            {league.id ? (
                                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">League ID</div>
                                    <div className="text-2xl font-black tabular-nums">#{league.id}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Sub-sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" />
                            About the Competition
                        </h3>
                        <div className="space-y-3">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                This competition is tracked in real-time. We monitor all fixtures, historical data, and live scoring events for this {league.type}.
                            </p>
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 border-dashed">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Source Information</p>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                    All data is synthesized from Goaloo&apos;s global sports network.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent/Tracked Matches */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={16} className="text-blue-500" />
                            Matches
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {leagueMatches.length > 0 ? leagueMatches.map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex flex-col flex-1">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{m.homeTeam} v {m.awayTeam}</span>
                                        <span className="text-[10px] text-zinc-500">{m.status}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                                            {m.score}
                                        </span>
                                        {updating === m.id ? (
                                            <Loader2 size={14} className="animate-spin text-zinc-400" />
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => toggleTrending(m.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${m.isTrending ? 'bg-yellow-400 text-black' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400 hover:bg-yellow-400 hover:text-black'}`}
                                                    title="Mark as Trending"
                                                >
                                                    <Star size={12} fill={m.isTrending ? "currentColor" : "none"} />
                                                </button>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => updateMatchType(m.id, 'free')}
                                                        className={`p-1.5 rounded-lg transition-colors ${!m.matchType || m.matchType === 'free' ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}
                                                        title="Free"
                                                    >
                                                        F
                                                    </button>
                                                    <button
                                                        onClick={() => updateMatchType(m.id, 'paid')}
                                                        className={`p-1.5 rounded-lg transition-colors ${m.matchType === 'paid' ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}
                                                        title="Paid"
                                                    >
                                                        $
                                                    </button>
                                                    <button
                                                        onClick={() => updateMatchType(m.id, 'vip')}
                                                        className={`p-1.5 rounded-lg transition-colors ${m.matchType === 'vip' ? 'bg-purple-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'}`}
                                                        title="VIP"
                                                    >
                                                        <Crown size={10} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <p className="text-xs text-zinc-400">No matches tracked in this session.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* External Link Section */}
                <div className="pt-4">
                    <a
                        href={league.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-900 dark:text-zinc-50 font-bold text-sm"
                    >
                        <span>View on Goaloo.com</span>
                        <ArrowUpRight size={18} />
                    </a>
                </div>
            </div>
        </Modal>
    );
}
