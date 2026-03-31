'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Minus, History, RefreshCw, Crown, DollarSign, Star, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Match {
    id: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    timestamp: string;
    status: string;
    matchType?: 'free' | 'paid' | 'vip' | 'unassigned';
    result?: 'win' | 'lose' | 'draw';
    isHistory?: boolean;
    aiPrediction?: { prediction: string; confidence: number };
}

type ResultFilter = 'all' | 'win' | 'lose' | 'draw' | 'unmarked';
type TypeFilter = 'all' | 'free' | 'paid' | 'vip';

export default function HistoryPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAll, setLoadingAll] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'history' | 'completed'>('history');

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/matches');
            const data = await res.json();
            // Filter to only history matches
            const historyMatches = Array.isArray(data) 
                ? data.filter((m: Match) => m.isHistory || m.status === 'Finished' || m.status === 'FT')
                : [];
            setMatches(historyMatches);
        } catch (e) { 
            console.error(e); 
        }
        setLoading(false);
    }, []);

    const loadAllMatches = useCallback(async () => {
        setLoadingAll(true);
        try {
            const res = await fetch('/api/admin/matches');
            const data = await res.json();
            const notHistory = Array.isArray(data)
                ? data.filter((m: Match) => !m.isHistory && m.status !== 'Finished' && m.status !== 'FT')
                : [];
            setAllMatches(notHistory);
        } catch (e) { 
            console.error(e); 
        }
        setLoadingAll(false);
    }, []);

    useEffect(() => { loadHistory(); }, [loadHistory]);
    useEffect(() => { if (tab === 'completed') loadAllMatches(); }, [tab, loadAllMatches]);

    const updateResult = async (matchId: string, result: 'win' | 'lose' | 'draw') => {
        setUpdatingId(matchId);
        try {
            await fetch('/api/admin/matches', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    matchId, 
                    updates: { result, isHistory: true }
                }),
            });
            setMatches(prev => prev.map(m => m.id === matchId ? { ...m, result, isHistory: true } : m));
        } catch (e) { console.error(e); }
        setUpdatingId(null);
    };

    const markAsHistory = async (matchId: string, add: boolean) => {
        setUpdatingId(matchId);
        try {
            await fetch('/api/admin/matches', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    matchId, 
                    updates: { isHistory: add }
                }),
            });
            if (add) {
                const match = allMatches.find(m => m.id === matchId);
                if (match) {
                    setMatches(prev => [{ ...match, isHistory: true }, ...prev]);
                    setAllMatches(prev => prev.filter(m => m.id !== matchId));
                }
            } else {
                setMatches(prev => prev.filter(m => m.id !== matchId));
            }
        } catch (e) { console.error(e); }
        setUpdatingId(null);
    };

    const filteredHistory = matches.filter(m => {
        const q = search.toLowerCase();
        const matchesSearch = !search ||
            m.homeTeam.toLowerCase().includes(q) ||
            m.awayTeam.toLowerCase().includes(q) ||
            m.league.toLowerCase().includes(q);
        const matchesResult = resultFilter === 'all' ||
            (resultFilter === 'unmarked' ? !m.result : m.result === resultFilter);
        const matchesType = typeFilter === 'all' || m.matchType === typeFilter;
        return matchesSearch && matchesResult && matchesType;
    });

    const wins = matches.filter(m => m.result === 'win').length;
    const loses = matches.filter(m => m.result === 'lose').length;
    const draws = matches.filter(m => m.result === 'draw').length;
    const total = wins + loses + draws;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const resultBadge = (result?: string) => {
        if (!result) return <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>;
        const cfg = result === 'win'
            ? { cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 size={10} /> }
            : result === 'lose'
            ? { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={10} /> }
            : { cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', icon: <Minus size={10} /> };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                {cfg.icon}{result.toUpperCase()}
            </span>
        );
    };

    const typeBadge = (type?: string) => {
        const colors = {
            free: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            paid: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            vip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            unassigned: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
        };
        const labels = { free: 'Free', paid: 'Paid', vip: 'VIP', unassigned: '—' };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[type as keyof typeof colors] || colors.unassigned}`}>
                {labels[type as keyof typeof labels] || '—'}
            </span>
        );
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Match History</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track results and manage prediction outcomes.</p>
                </div>
                <button onClick={loadHistory} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm">
                    <RefreshCw size={14} />Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                    { label: 'Total', value: matches.length, color: 'text-zinc-900 dark:text-zinc-50', bg: 'bg-zinc-100 dark:bg-zinc-800' },
                    { label: 'Wins', value: wins, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Losses', value: loses, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                    { label: 'Win Rate', value: `${winRate}%`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ] as const).map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
                {(['history', 'completed'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'}`}>
                        {t === 'history' ? 'History & Results' : 'Mark as History'}
                    </button>
                ))}
            </div>

            {tab === 'history' && (
                <>
                    <div className="flex flex-col gap-3">
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or league..." className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500" />
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-zinc-500 py-1.5">Result:</span>
                            {(['all', 'win', 'lose', 'draw', 'unmarked'] as ResultFilter[]).map(f => (
                                <button key={f} onClick={() => setResultFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${resultFilter === f ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{f}</button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-zinc-500 py-1.5">Type:</span>
                            {(['all', 'free', 'paid', 'vip'] as TypeFilter[]).map(f => (
                                <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${typeFilter === f ? 'bg-purple-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-zinc-400">Loading history...</div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="p-12 text-center text-zinc-400">No match history. Use the Mark as History tab to add matches.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">League</th>
                                            <th className="px-4 py-3 text-right">Home</th>
                                            <th className="px-4 py-3 text-center">Score</th>
                                            <th className="px-4 py-3">Away</th>
                                            <th className="px-4 py-3 text-center">Type</th>
                                            <th className="px-4 py-3 text-center">Result</th>
                                            <th className="px-4 py-3 text-center">Mark</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {filteredHistory.map(match => (
                                            <tr key={match.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">{new Date(match.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50 max-w-28 truncate text-xs">{match.league}</td>
                                                <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50 text-xs">{match.homeTeam}</td>
                                                <td className="px-4 py-3 text-center font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                                                    {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50 text-xs">{match.awayTeam}</td>
                                                <td className="px-4 py-3 text-center">{typeBadge(match.matchType)}</td>
                                                <td className="px-4 py-3 text-center">{resultBadge(match.result)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => updateResult(match.id, 'win')} disabled={updatingId === match.id} title="Win" className={`p-1.5 rounded-lg transition-colors ${match.result === 'win' ? 'bg-green-500 text-white' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}><CheckCircle2 size={14} /></button>
                                                        <button onClick={() => updateResult(match.id, 'lose')} disabled={updatingId === match.id} title="Loss" className={`p-1.5 rounded-lg transition-colors ${match.result === 'lose' ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}><XCircle size={14} /></button>
                                                        <button onClick={() => updateResult(match.id, 'draw')} disabled={updatingId === match.id} title="Draw" className={`p-1.5 rounded-lg transition-colors ${match.result === 'draw' ? 'bg-zinc-500 text-white' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Minus size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === 'completed' && (
                <div className="space-y-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Add matches to history — they appear in the mobile Wins screen.</p>
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        {loadingAll ? (
                            <div className="p-12 text-center text-zinc-400">Loading matches...</div>
                        ) : allMatches.length === 0 ? (
                            <div className="p-12 text-center text-zinc-400">No pending matches to add.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">League</th>
                                            <th className="px-4 py-3 text-right">Home</th>
                                            <th className="px-4 py-3 text-center">Score</th>
                                            <th className="px-4 py-3">Away</th>
                                            <th className="px-4 py-3 text-center">Type</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {allMatches.map(match => (
                                            <tr key={match.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">{new Date(match.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                                <td className="px-4 py-3 text-xs max-w-28 truncate text-zinc-900 dark:text-zinc-50">{match.league}</td>
                                                <td className="px-4 py-3 text-right text-xs font-medium text-zinc-900 dark:text-zinc-50">{match.homeTeam}</td>
                                                <td className="px-4 py-3 text-center font-bold text-zinc-900 dark:text-zinc-50">{match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'vs'}</td>
                                                <td className="px-4 py-3 text-xs font-medium text-zinc-900 dark:text-zinc-50">{match.awayTeam}</td>
                                                <td className="px-4 py-3 text-center">{typeBadge(match.matchType)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => markAsHistory(match.id, true)} disabled={updatingId === match.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                                                        <History size={12} />Add to History
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
