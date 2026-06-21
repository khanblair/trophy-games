'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Minus, RefreshCw } from 'lucide-react';

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
    aiPrediction?: { prediction: string; confidence: number };
}

type OutcomeFilter = 'all' | 'home' | 'away' | 'draw';
type TypeFilter = 'all' | 'free' | 'paid' | 'vip';

// Derive the match outcome from the final score (home perspective), mirroring
// the mobile Wins screen.
function outcomeOf(m: Match): 'home' | 'away' | 'draw' | undefined {
    if (m.homeScore === undefined || m.awayScore === undefined) return undefined;
    if (m.homeScore > m.awayScore) return 'home';
    if (m.awayScore > m.homeScore) return 'away';
    return 'draw';
}

export default function HistoryPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [leagueFilter, setLeagueFilter] = useState('All');
    const [search, setSearch] = useState('');

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/matches');
            const data = await res.json();
            // Finished matches only — same source the mobile Wins screen uses.
            const finished = Array.isArray(data)
                ? data.filter((m: Match) => m.status === 'Finished' || m.status === 'FT' || (m.homeScore !== undefined && m.awayScore !== undefined))
                : [];
            setMatches(finished);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadHistory(); }, [loadHistory]);

    const uniqueLeagues = ['All', ...Array.from(new Set(matches.map(m => m.league))).sort()];

    const filteredHistory = matches.filter(m => {
        const q = search.toLowerCase();
        const matchesSearch = !search ||
            m.homeTeam.toLowerCase().includes(q) ||
            m.awayTeam.toLowerCase().includes(q) ||
            m.league.toLowerCase().includes(q);
        const matchesOutcome = outcomeFilter === 'all' || outcomeOf(m) === outcomeFilter;
        const matchesType = typeFilter === 'all' || m.matchType === typeFilter;
        const matchesLeague = leagueFilter === 'All' || m.league === leagueFilter;
        return matchesSearch && matchesOutcome && matchesType && matchesLeague;
    });

    // Mirror the mobile Wins screen: "win" = home side won, strike rate = wins / total.
    const total = matches.length;
    const homeWins = matches.filter(m => outcomeOf(m) === 'home').length;
    const awayWins = matches.filter(m => outcomeOf(m) === 'away').length;
    const draws = matches.filter(m => outcomeOf(m) === 'draw').length;
    const strikeRate = total > 0 ? Math.round((homeWins / total) * 100) : 0;

    const outcomeBadge = (m: Match) => {
        const o = outcomeOf(m);
        if (!o) return <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>;
        const cfg = o === 'home'
            ? { cls: 'bg-brand-green/10 text-brand-green dark:bg-brand-green/10 dark:text-brand-green/80', icon: <CheckCircle2 size={10} />, label: 'HOME' }
            : o === 'away'
            ? { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <XCircle size={10} />, label: 'AWAY' }
            : { cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', icon: <Minus size={10} />, label: 'DRAW' };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                {cfg.icon}{cfg.label}
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
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Proven Results</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Completed matches from Convex — the same results shown in the mobile Wins screen.</p>
                </div>
                <button onClick={loadHistory} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm">
                    <RefreshCw size={14} />Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                    { label: 'Strike Rate', value: `${strikeRate}%`, color: 'text-brand-green', bg: 'bg-brand-green/10 dark:bg-brand-green/10' },
                    { label: 'Wins / Total', value: `${homeWins}/${total}`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Away Wins', value: awayWins, color: 'text-zinc-900 dark:text-zinc-50', bg: 'bg-zinc-100 dark:bg-zinc-800' },
                    { label: 'Draws', value: draws, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-900/40' },
                ] as const).map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or league..." className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-zinc-500 py-1.5">Outcome:</span>
                    {(['all', 'home', 'away', 'draw'] as OutcomeFilter[]).map(f => (
                        <button key={f} onClick={() => setOutcomeFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${outcomeFilter === f ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{f}</button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-zinc-500 py-1.5">Type:</span>
                    {(['all', 'free', 'paid', 'vip'] as TypeFilter[]).map(f => (
                        <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${typeFilter === f ? 'bg-purple-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{f}</button>
                    ))}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {uniqueLeagues.map(l => (
                        <button key={l} onClick={() => setLeagueFilter(l)} className={`flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${leagueFilter === l ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{l}</button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400">Loading history...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">No completed matches in the feed right now.</div>
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
                                    <th className="px-4 py-3 text-center">Outcome</th>
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
                                        <td className="px-4 py-3 text-center">{outcomeBadge(match)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
