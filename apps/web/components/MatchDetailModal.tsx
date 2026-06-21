
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Timer, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { MatchData } from '@trophy-games/shared';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';


interface MatchDetailModalProps {
    match: MatchData | null;
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'Overview' | 'Odds';

export function MatchDetailModal({ match, isOpen, onClose }: MatchDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Overview');
    const [details, setDetails] = useState<Partial<MatchData> | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch rich per-match details from the proxy when the modal opens.
    const matchId = match?.id;
    useEffect(() => {
        if (!isOpen || !matchId) {
            setDetails(null); // eslint-disable-line react-hooks/set-state-in-effect
            return;
        }
        let cancelled = false;
        setLoadingDetails(true);
        fetch(`/api/match-stats?id=${matchId}`)
            .then((r) => r.json())
            .then((d) => { if (!cancelled && d && !d.error) setDetails(d); })
            .catch((e) => console.error('Failed to load match stats:', e))
            .finally(() => { if (!cancelled) setLoadingDetails(false); });
        return () => { cancelled = true; };
    }, [isOpen, matchId]);

    if (!match) return null;

    // Merge: proxy details fill in the rich fields/logos, list data stays
    // authoritative for the basics (teams, league, status, score, odds).
    const m: MatchData = {
        ...match,
        ...(details || {}),
        league: match.league,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        country: match.country ?? details?.country,
        status: match.status,
        score: match.score,
        timestamp: match.timestamp,
        matchType: match.matchType,
        odds: match.odds || details?.odds,
        homeScore: match.homeScore ?? details?.homeScore,
        awayScore: match.awayScore ?? details?.awayScore,
    };

    const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'Overview', icon: Trophy, label: 'Overview' },
        { id: 'Odds', icon: TrendingUp, label: 'Odds' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Match Insights"
            className="max-w-4xl"
        >
            <div className="space-y-6 pb-4">
                {/* Scoreboard Header */}
                <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 text-white shadow-xl dark:bg-black border border-zinc-800">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                            <Timer size={14} className="text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{m.status}</span>
                        </div>

                        <div className="flex items-center justify-between w-full">
                            {/* Home Team */}
                            <div className="flex-1 space-y-2">
                                {m.homeTeamLogo && (
                                    <Image 
                                        src={m.homeTeamLogo} 
                                        alt={m.homeTeam}
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 mx-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="text-2xl font-black">{m.homeTeam}</div>
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Home</div>
                            </div>

                            {/* Score */}
                            <div className="px-8 space-y-1">
                                <div className="text-5xl font-black tracking-tighter tabular-nums">
                                    {m.score || '0-0'}
                                </div>
                                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Score</div>
                                {(m.htHomeScore !== undefined && m.htAwayScore !== undefined) && (
                                    <div className="text-zinc-500 text-[10px]">
                                        HT {m.htHomeScore} - {m.htAwayScore}
                                    </div>
                                )}
                            </div>

                            {/* Away Team */}
                            <div className="flex-1 space-y-2">
                                {m.awayTeamLogo && (
                                    <Image 
                                        src={m.awayTeamLogo} 
                                        alt={m.awayTeam}
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 mx-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="text-2xl font-black">{m.awayTeam}</div>
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Away</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                                {m.leagueLogo && (
                                    <Image 
                                        src={m.leagueLogo} 
                                        alt={m.league}
                                        width={16}
                                        height={16}
                                        className="w-4 h-4 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <Trophy size={14} />
                                <span>{m.league}</span>
                            </div>
                            {m.countryFlag && (
                                <Image 
                                    src={m.countryFlag} 
                                    alt={m.country || 'Country flag'}
                                    width={20}
                                    height={12}
                                    className="w-5 h-3 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <div className="h-1 w-1 rounded-full bg-zinc-700" />
                            <div className="text-zinc-400 text-xs font-medium">
                                {m.timestamp}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1 space-x-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold rounded-lg transition-all',
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
<div className="min-h-[300px]">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {loadingDetails && (
                                <div className="flex items-center justify-center gap-2 py-3 text-sm text-zinc-400">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading match details…
                                </div>
                            )}
                            {/* Simple Odds in Overview */}
                            {m.odds && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Match Odds (1X2)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">Home</div>
                                            <div className="text-xl font-bold text-brand-green">{m.odds.home}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                                            <div className="text-xs text-zinc-500 mb-1">Draw</div>
                                            <div className="text-xl font-bold text-zinc-700 dark:text-zinc-300">{m.odds.draw || '-'}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">Away</div>
                                            <div className="text-xl font-bold text-red-600">{m.odds.away}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Over/Under in Overview */}
                            {m.detailedOdds?.ft?.['ou'] && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Over/Under (Line: {m.detailedOdds.ft['ou'].line})
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">Over</div>
                                            <div className="text-xl font-bold text-red-600">{m.detailedOdds.ft['ou'].over}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">Under</div>
                                            <div className="text-xl font-bold text-brand-green">{m.detailedOdds.ft['ou'].under}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bookmaker Odds Comparison — professional grid */}
                            {m.oddsComparison && m.oddsComparison.length > 0 && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">Odds Comparison</span>
                                    </div>
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {m.oddsComparison.map((market, mi) => {
                                            // Gather every unique bookie across all selections in this market
                                            const allBookies = Array.from(
                                                new Set(market.selections.flatMap(s => s.odds.map(o => o.bookie)))
                                            );
                                            return (
                                                <div key={mi} className="p-4">
                                                    <div className="text-xs font-bold text-zinc-500 uppercase mb-3">{market.market}</div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                                                                    <th className="text-left py-2 pr-4 text-xs font-semibold text-zinc-400 uppercase">Selection</th>
                                                                    {allBookies.map(b => (
                                                                        <th key={b} className="text-center py-2 px-2 text-xs font-semibold text-zinc-400 uppercase min-w-[72px]">{b}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {market.selections.map((sel, si) => {
                                                                    // Find the highest odds for this selection to highlight
                                                                    const values = sel.odds.map(o => parseFloat(o.value)).filter(v => !isNaN(v));
                                                                    const best = values.length > 0 ? Math.max(...values) : null;
                                                                    return (
                                                                        <tr key={si} className="border-b border-zinc-50 dark:border-zinc-800/30 last:border-0">
                                                                            <td className="py-2.5 pr-4 font-medium text-zinc-700 dark:text-zinc-300">{sel.name}</td>
                                                                            {allBookies.map(b => {
                                                                                const odd = sel.odds.find(o => o.bookie === b);
                                                                                const val = odd ? parseFloat(odd.value) : null;
                                                                                const isBest = val !== null && best !== null && val === best;
                                                                                return (
                                                                                    <td key={b} className="py-2.5 px-2 text-center">
                                                                                        {odd ? (
                                                                                            <span className={cn(
                                                                                                'inline-block px-2 py-0.5 rounded-md text-xs font-bold',
                                                                                                isBest
                                                                                                    ? 'bg-brand-green/10 text-brand-green'
                                                                                                    : 'text-zinc-600 dark:text-zinc-400'
                                                                                            )}>
                                                                                                {odd.value}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-zinc-300 dark:text-zinc-700">—</span>
                                                                                        )}
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* H2H Summary */}
                            {m.h2h?.summary && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Head to Head
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">Home Wins</div>
                                            <div className="text-xl font-bold text-brand-green">{m.h2h.summary.wins}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                                            <div className="text-xs text-zinc-500 mb-1">Draws</div>
                                            <div className="text-xl font-bold text-zinc-700 dark:text-zinc-300">{m.h2h.summary.draws}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">Away Wins</div>
                                            <div className="text-xl font-bold text-red-600">{m.h2h.summary.losses}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* H2H History */}
                            {m.h2h?.history && m.h2h.history.length > 0 && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        H2H History
                                    </h3>
                                    <div className="space-y-2">
                                        {m.h2h.history.map((h, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                                                <div>
                                                    <div className="text-xs text-zinc-500">{h.date}</div>
                                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{h.home} vs {h.away}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-brand-green">{h.score}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Team Form */}
                            {(m.homeForm || m.awayForm) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Recent Form
                                    </h3>
                                    <div className="space-y-3">
                                        {m.homeForm && (
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 w-32 truncate">{m.homeTeam}</span>
                                                <div className="flex gap-1">
                                                    {m.homeForm.split('').slice(0, 5).map((char, i) => (
                                                        <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${
                                                            char === 'W' ? 'bg-brand-green' : char === 'D' ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}>
                                                            {char}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {m.awayForm && (
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 w-32 truncate">{m.awayTeam}</span>
                                                <div className="flex gap-1">
                                                    {m.awayForm.split('').slice(0, 5).map((char, i) => (
                                                        <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${
                                                            char === 'W' ? 'bg-brand-green' : char === 'D' ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}>
                                                            {char}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Corner Stats */}
                            {(m.homeCorners !== undefined || m.awayCorners !== undefined) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Corner Stats
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">{m.homeTeam}</div>
                                            <div className="text-xl font-bold text-brand-green">{m.homeCorners ?? 0}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">{m.awayTeam}</div>
                                            <div className="text-xl font-bold text-red-600">{m.awayCorners ?? 0}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            {m.preview && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Match Preview
                                    </h3>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                                        {m.preview}
                                    </p>
                                </div>
                            )}

                            {/* Potentials */}
                            {m.potentials && m.potentials.length > 0 && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Match Predictions
                                    </h3>
                                    <div className="space-y-3">
                                        {m.potentials.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{p.label}</span>
                                                {p.percent !== undefined ? (
                                                    <div className="flex items-center gap-3 flex-1 ml-4">
                                                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand-green rounded-full" style={{ width: `${p.percent}%` }} />
                                                        </div>
                                                        <span className="text-sm font-bold text-brand-green w-10 text-right">{p.percent}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{p.value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expected Goals */}
                            {(m.homeXg !== undefined || m.awayXg !== undefined) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Expected Goals (xG)
                                    </h3>
                                    <div className="flex items-center justify-around">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-brand-green">{(m.homeXg ?? 0).toFixed(2)}</div>
                                            <div className="text-xs text-zinc-500">{m.homeTeam}</div>
                                        </div>
                                        <div className="text-xs text-zinc-400 font-bold">xG</div>
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-zinc-700 dark:text-zinc-300">{(m.awayXg ?? 0).toFixed(2)}</div>
                                            <div className="text-xs text-zinc-500">{m.awayTeam}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Match Stats */}
                            {m.stats && m.stats.length > 0 && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Match Stats
                                    </h3>
                                    <div className="space-y-3">
                                        {m.stats.map((s, i) => {
                                            const total = (s.home + s.away) || 1;
                                            const homePct = Math.round((s.home / total) * 100);
                                            return (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                                        <span>{s.home}{s.percent ? '%' : ''}</span>
                                                        <span>{s.label}</span>
                                                        <span>{s.away}{s.percent ? '%' : ''}</span>
                                                    </div>
                                                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-green rounded-full" style={{ width: `${homePct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Goal Timeline */}
                            {m.goals && m.goals.length > 0 && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Goals
                                    </h3>
                                    <div className="space-y-2">
                                        {m.goals.map((g, i) => (
                                            <div key={i} className={`flex items-center gap-3 py-2 ${g.team === 'away' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex-1 ${g.team === 'away' ? 'text-right' : ''}`}>
                                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{g.scorer} <span className="text-xs text-zinc-400">{g.time}&apos;</span></div>
                                                    {g.assist && <div className="text-xs text-zinc-500">assist: {g.assist}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lineups */}
                            {(m.homeLineup?.length || m.awayLineup?.length) ? (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Starting Lineups
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-bold text-brand-green mb-2 truncate">{m.homeTeam}</div>
                                            <div className="space-y-1">
                                                {(m.homeLineup || []).map((p, i) => (
                                                    <div key={i} className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                                                        {p.number ? `${p.number}. ` : ''}{p.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 truncate">{m.awayTeam}</div>
                                            <div className="space-y-1">
                                                {(m.awayLineup || []).map((p, i) => (
                                                    <div key={i} className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                                                        {p.number ? `${p.number}. ` : ''}{p.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Match Info */}
                            {(m.stadium || m.attendance || m.tvStations?.length || m.referee || m.weather) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Match Info
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        {m.stadium && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Venue</span>
                                                <span className="text-zinc-900 dark:text-zinc-50">{m.stadium}</span>
                                            </div>
                                        )}
                                        {m.attendance && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Attendance</span>
                                                <span className="text-zinc-900 dark:text-zinc-50">{m.attendance.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {m.tvStations && m.tvStations.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">TV</span>
                                                <span className="text-zinc-900 dark:text-zinc-50 text-right">{m.tvStations.join(', ')}</span>
                                            </div>
                                        )}
                                        {m.referee && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Referee</span>
                                                <span className="text-zinc-900 dark:text-zinc-50">{m.referee}</span>
                                            </div>
                                        )}
                                        {m.weather && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Weather</span>
                                                <span className="text-zinc-900 dark:text-zinc-50">{m.weather}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                        </div>
                    )}

                    {activeTab === 'Odds' && m.detailedOdds?.ft && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                    <span className="text-xs font-bold text-zinc-500 uppercase">Full Time Odds</span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Market</th>
                                            <th className="px-4 py-3 text-center text-brand-green">Home</th>
                                            <th className="px-4 py-3 text-center text-zinc-600">Draw</th>
                                            <th className="px-4 py-3 text-center text-red-600">Away</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        <tr className="bg-white dark:bg-zinc-900/20">
                                            <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">1X2</td>
                                            <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{m.detailedOdds.ft['1x2'].home}</td>
                                            <td className="px-4 py-3 text-center font-bold">{m.detailedOdds.ft['1x2'].draw}</td>
                                            <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{m.detailedOdds.ft['1x2'].away}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {m.detailedOdds.ft['ou'] && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">
                                            Over/Under (Line: {m.detailedOdds.ft['ou'].line})
                                        </span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Market</th>
                                                <th className="px-4 py-3 text-center text-red-600">Over</th>
                                                <th className="px-4 py-3 text-center text-zinc-600">Line</th>
                                                <th className="px-4 py-3 text-center text-brand-green">Under</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            <tr className="bg-white dark:bg-zinc-900/20">
                                                <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">O/U</td>
                                                <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{m.detailedOdds.ft['ou'].over}</td>
                                                <td className="px-4 py-3 text-center font-bold">{m.detailedOdds.ft['ou'].line}</td>
                                                <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{m.detailedOdds.ft['ou'].under}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {m.detailedOdds.ft['ah'] && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">
                                            Asian Handicap (Line: {m.detailedOdds.ft['ah'].line})
                                        </span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Market</th>
                                                <th className="px-4 py-3 text-center text-brand-green">Home</th>
                                                <th className="px-4 py-3 text-center text-zinc-600">Line</th>
                                                <th className="px-4 py-3 text-center text-red-600">Away</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            <tr className="bg-white dark:bg-zinc-900/20">
                                                <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">AH</td>
                                                <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{m.detailedOdds.ft['ah'].home}</td>
                                                <td className="px-4 py-3 text-center font-bold">{m.detailedOdds.ft['ah'].line}</td>
                                                <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{m.detailedOdds.ft['ah'].away}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {m.detailedOdds.ht?.['1x2'] && (m.detailedOdds.ht['1x2'].home || m.detailedOdds.ht['1x2'].draw || m.detailedOdds.ht['1x2'].away) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">Half Time Odds</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Market</th>
                                                <th className="px-4 py-3 text-center text-brand-green">Home</th>
                                                <th className="px-4 py-3 text-center text-zinc-600">Draw</th>
                                                <th className="px-4 py-3 text-center text-red-600">Away</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            <tr className="bg-white dark:bg-zinc-900/20">
                                                <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">HT 1X2</td>
                                                <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{m.detailedOdds.ht['1x2'].home}</td>
                                                <td className="px-4 py-3 text-center font-bold">{m.detailedOdds.ht['1x2'].draw}</td>
                                                <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{m.detailedOdds.ht['1x2'].away}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {m.detailedOdds.ht?.['ou'] && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">
                                            HT Over/Under (Line: {m.detailedOdds.ht['ou'].line})
                                        </span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Market</th>
                                                <th className="px-4 py-3 text-center text-red-600">Over</th>
                                                <th className="px-4 py-3 text-center text-zinc-600">Line</th>
                                                <th className="px-4 py-3 text-center text-brand-green">Under</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            <tr className="bg-white dark:bg-zinc-900/20">
                                                <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">HT O/U</td>
                                                <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{m.detailedOdds.ht['ou'].over}</td>
                                                <td className="px-4 py-3 text-center font-bold">{m.detailedOdds.ht['ou'].line}</td>
                                                <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{m.detailedOdds.ht['ou'].under}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <p className="text-xs text-zinc-400 text-center">
                                Odds from FootyStats Proxy
                            </p>
                        </div>
                    )}

                    {activeTab === 'Odds' && !m.detailedOdds?.ft && (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-4">
                            <TrendingUp size={48} className="opacity-20" />
                            <p className="text-sm font-medium">No odds data available for this m.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
