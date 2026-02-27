
'use client';

import React, { useState } from 'react';
import { Timer, Trophy, TrendingUp, AlertCircle, CheckCircle2, BarChart3, History, Layers, BrainCircuit } from 'lucide-react';
import { MatchData } from '@/lib/scraper/parsers';
import { analyzeMatch, AIAnalysis } from '@/lib/ai';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';

interface MatchDetailModalProps {
    match: MatchData | null;
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'Overview' | 'Odds' | 'H2H' | 'Standings';

export function MatchDetailModal({ match, isOpen, onClose }: MatchDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Overview');
    const [analyzing, setAnalyzing] = useState(false);

    if (!match) return null;

    const hasLiveOdds = match.detailedOdds && !match.detailedOdds.isGenerated;
    const hasLiveH2h = match.h2h && !match.h2h.isGenerated;

    const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'Overview', icon: Trophy, label: 'Overview' },
        ...(hasLiveOdds ? [{ id: 'Odds' as Tab, icon: TrendingUp, label: 'Odds' }] : []),
        ...(hasLiveH2h ? [{ id: 'H2H' as Tab, icon: History, label: 'H2H' }] : []),
        { id: 'Standings', icon: Layers, label: 'Standings' },
    ];

    const handleAnalyze = async () => {
        setAnalyzing(true);
        const result = await analyzeMatch(match);
        // Save to Convex
        try {
            await fetch('/api/mobile/ai-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    aiPrediction: result
                })
            });
        } catch (e) {
            console.error('Failed to save AI prediction:', e);
        }
        setAnalyzing(false);
    };

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
                            <span className="text-[10px] font-bold uppercase tracking-widest">{match.status}</span>
                        </div>

                        <div className="flex items-center justify-between w-full">
                            {/* Home Team */}
                            <div className="flex-1 space-y-2">
                                {match.homeTeamLogo && (
                                    <img 
                                        src={match.homeTeamLogo} 
                                        alt={match.homeTeam}
                                        className="w-16 h-16 mx-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="text-2xl font-black">{match.homeTeam}</div>
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Home</div>
                            </div>

                            {/* Score */}
                            <div className="px-8 space-y-1">
                                <div className="text-5xl font-black tracking-tighter tabular-nums">
                                    {match.score || '0-0'}
                                </div>
                                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Score</div>
                            </div>

                            {/* Away Team */}
                            <div className="flex-1 space-y-2">
                                {match.awayTeamLogo && (
                                    <img 
                                        src={match.awayTeamLogo} 
                                        alt={match.awayTeam}
                                        className="w-16 h-16 mx-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="text-2xl font-black">{match.awayTeam}</div>
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Away</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                                {match.leagueLogo && (
                                    <img 
                                        src={match.leagueLogo} 
                                        alt={match.league}
                                        className="w-4 h-4 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <Trophy size={14} />
                                <span>{match.league}</span>
                            </div>
                            {match.countryFlag && (
                                <img 
                                    src={match.countryFlag} 
                                    alt={match.country}
                                    className="w-5 h-3 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <div className="h-1 w-1 rounded-full bg-zinc-700" />
                            <div className="text-zinc-400 text-xs font-medium">
                                {match.timestamp}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {/* AI Prediction Section */}
                            <div className="md:col-span-2">
                                {match.aiPrediction ? (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                                            <BrainCircuit size={16} className="text-purple-500" />
                                            AI Prediction
                                            <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                                {match.aiPrediction.confidence}% confidence
                                            </span>
                                        </h3>
                                        <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 dark:border-purple-500/20 dark:bg-purple-500/5">
                                            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                                {match.aiPrediction.prediction}
                                            </p>
                                            <div className="mt-3 grid gap-2">
                                                {match.aiPrediction.reasoning.map((reason, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                                                        <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                                                        <span>{reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {match.aiPrediction.suggestedBet && (
                                                <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                    <span className="font-bold text-blue-600">Pro Tip:</span> {match.aiPrediction.suggestedBet}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={analyzing}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {analyzing ? 'Analyzing...' : 'Re-run AI Analysis'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                                            <BrainCircuit size={16} className="text-blue-600" />
                                            AI Prediction
                                        </h3>
                                        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-6 text-center">
                                            <p className="text-sm text-zinc-500 mb-3">Generate AI-powered match predictions</p>
                                            <button
                                                onClick={handleAnalyze}
                                                disabled={analyzing}
                                                className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {analyzing ? (
                                                    <>
                                                        <span className="animate-spin">⟳</span>
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BrainCircuit size={16} />
                                                        Generate Prediction
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stats Snapshot */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle size={16} className="text-zinc-500" />
                                    Match Info
                                </h3>
                                <div className="space-y-3">
                                    {match.homeStanding && (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <span className="text-xs font-semibold text-zinc-500">{match.homeTeam} Position</span>
                                            <span className="text-xs font-bold text-blue-600">{match.homeStanding}</span>
                                        </div>
                                    )}
                                    {match.awayStanding && (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <span className="text-xs font-semibold text-zinc-500">{match.awayTeam} Position</span>
                                            <span className="text-xs font-bold text-blue-600">{match.awayStanding}</span>
                                        </div>
                                    )}
                                    {match.referee && (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <span className="text-xs font-semibold text-zinc-500">Referee</span>
                                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{match.referee}</span>
                                        </div>
                                    )}
                                    {match.weather && (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
                                            <span className="text-xs font-semibold text-zinc-500">Weather</span>
                                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{match.weather}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Odds' && match.detailedOdds && !match.detailedOdds.isGenerated && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {['FT', 'HT'].map((period) => {
                                const oddsData = period === 'FT' ? match.detailedOdds?.ft : match.detailedOdds?.ht;
                                if (!oddsData) return null;

                                return (
                                    <div key={period} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                            <span className="text-xs font-bold text-zinc-500 uppercase">{period === 'FT' ? 'Full Time' : 'Half Time'} Odds</span>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Market</th>
                                                    <th className="px-4 py-3 text-center text-blue-600">Home</th>
                                                    <th className="px-4 py-3 text-center text-zinc-600">Line/Draw</th>
                                                    <th className="px-4 py-3 text-center text-purple-600">Away</th>
                                                    <th className="px-4 py-3 text-center text-zinc-400 border-l border-zinc-100 dark:border-zinc-800">Init Home</th>
                                                    <th className="px-4 py-3 text-center text-zinc-400">Init Line</th>
                                                    <th className="px-4 py-3 text-center text-zinc-400">Init Away</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                                <tr className="bg-white dark:bg-zinc-900/20">
                                                    <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">1x2</td>
                                                    <td className="px-4 py-3 text-center font-bold bg-green-500/10 text-green-700 dark:text-green-400">{oddsData['1x2'].home}</td>
                                                    <td className="px-4 py-3 text-center font-bold">{oddsData['1x2'].draw}</td>
                                                    <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{oddsData['1x2'].away}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400 border-l border-zinc-100 dark:border-zinc-800">{oddsData['1x2'].initHome}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">{oddsData['1x2'].initDraw}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">{oddsData['1x2'].initAway}</td>
                                                </tr>
                                                <tr className="bg-white dark:bg-zinc-900/20">
                                                    <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">O/U</td>
                                                    <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{oddsData['ou'].over}</td>
                                                    <td className="px-4 py-3 text-center font-bold">{oddsData['ou'].line}</td>
                                                    <td className="px-4 py-3 text-center font-bold bg-green-500/10 text-green-700 dark:text-green-400">{oddsData['ou'].under}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400 border-l border-zinc-100 dark:border-zinc-800">{oddsData['ou'].initOver}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">{oddsData['ou'].initLine}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">{oddsData['ou'].initUnder}</td>
                                                </tr>
                                                <tr className="bg-white dark:bg-zinc-900/20">
                                                    <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">AH</td>
                                                    <td className="px-4 py-3 text-center font-bold bg-green-500/10 text-green-700 dark:text-green-400">{oddsData['ah'].home}</td>
                                                    <td className="px-4 py-3 text-center font-bold">{oddsData['ah'].line}</td>
                                                    <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{oddsData['ah'].away}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400 border-l border-zinc-100 dark:border-zinc-800">{oddsData['ah'].initHome}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">{oddsData['ah'].initLine}</td>
                                                    <td className="px-4 py-3 text-center text-zinc-400">{oddsData['ah'].initAway}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'Odds' && (!match.detailedOdds || match.detailedOdds.isGenerated) && (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-4">
                            <TrendingUp size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Odds data unavailable from live source.</p>
                        </div>
                    )}

                    {activeTab === 'H2H' && match.h2h && !match.h2h.isGenerated && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {/* Stats Summary */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase text-zinc-500">
                                    <span>Win {match.h2h.summary.wins} ({Math.round(match.h2h.summary.wins / match.h2h.summary.total * 100)}%)</span>
                                    <span>Draw {match.h2h.summary.draws} ({Math.round(match.h2h.summary.draws / match.h2h.summary.total * 100)}%)</span>
                                    <span>Loss {match.h2h.summary.losses} ({Math.round(match.h2h.summary.losses / match.h2h.summary.total * 100)}%)</span>
                                </div>
                                <div className="flex h-3 rounded-full overflow-hidden">
                                    <div style={{ width: `${match.h2h.summary.wins / match.h2h.summary.total * 100}%` }} className="bg-green-500" />
                                    <div style={{ width: `${match.h2h.summary.draws / match.h2h.summary.total * 100}%` }} className="bg-zinc-300 dark:bg-zinc-600" />
                                    <div style={{ width: `${match.h2h.summary.losses / match.h2h.summary.total * 100}%` }} className="bg-red-500" />
                                </div>

                                <div className="pt-2 flex justify-between text-xs font-bold">
                                    <span className="text-green-600">{match.h2h.summary.homeGoalsAvg} goals/game</span>
                                    <span className="text-red-600">{match.h2h.summary.awayGoalsAvg} goals/game</span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                    <div style={{ width: '60%' }} className="bg-gradient-to-r from-green-500 to-red-500" />
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <table className="w-full text-xs">
                                    <thead className="bg-zinc-100 dark:bg-zinc-800/50 uppercase text-zinc-500 font-bold">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Date</th>
                                            <th className="px-3 py-2 text-left">League</th>
                                            <th className="px-3 py-2 text-right">Home</th>
                                            <th className="px-3 py-2 text-center">Score</th>
                                            <th className="px-3 py-2 text-left">Away</th>
                                            <th className="px-3 py-2 text-center">HT</th>
                                            <th className="px-3 py-2 text-center">Corner</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {match.h2h.history.map((game, i) => (
                                            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                                <td className="px-3 py-2 text-zinc-500">{game.date}</td>
                                                <td className="px-3 py-2 font-medium text-blue-600 dark:text-blue-400">{game.league}</td>
                                                <td className={cn("px-3 py-2 text-right font-medium", game.home === match.homeTeam ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>
                                                    {game.home}
                                                </td>
                                                <td className="px-3 py-2 text-center font-bold">
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded",
                                                        game.outcome === 'W' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                                                            game.outcome === 'L' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                                                                "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                    )}>
                                                        {game.score}
                                                    </span>
                                                </td>
                                                <td className={cn("px-3 py-2 text-left font-medium", game.away === match.awayTeam ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>
                                                    {game.away}
                                                </td>
                                                <td className="px-3 py-2 text-center text-zinc-400">{game.htScore}</td>
                                                <td className="px-3 py-2 text-center text-zinc-400">{game.corner}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'H2H' && (!match.h2h || match.h2h.isGenerated) && (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-4">
                            <History size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Head-to-head data unavailable from live source.</p>
                        </div>
                    )}

                    {activeTab === 'Standings' && (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-4">
                            <BarChart3 size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Standings data not available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
