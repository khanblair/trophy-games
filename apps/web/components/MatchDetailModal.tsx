
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Timer, Trophy, TrendingUp, CheckCircle2, BrainCircuit, Cpu } from 'lucide-react';
import { MatchData } from '@trophy-games/shared';
import { analyzeMatch, AICallMetadata } from '@/lib/ai';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';
import { ModelSelector } from './ModelSelector';
import { DEFAULT_MODEL, AIModel } from '@/app/constants/models';


interface MatchDetailModalProps {
    match: MatchData | null;
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'Overview' | 'Odds';

export function MatchDetailModal({ match, isOpen, onClose }: MatchDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Overview');
    const [analyzing, setAnalyzing] = useState(false);
    const [localPrediction, setLocalPrediction] = useState(match?.aiPrediction || null);
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
    const [lastCallMetadata, setLastCallMetadata] = useState<AICallMetadata | null>(null);

    if (!match) return null;

    // Use local prediction if available (after just generating), otherwise use match data
    const aiPred = localPrediction || match.aiPrediction;

    const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'Overview', icon: Trophy, label: 'Overview' },
        { id: 'Odds', icon: TrendingUp, label: 'Odds' },
    ];

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setLastCallMetadata(null);
        
        try {
            const result = await analyzeMatch(match, selectedModel);
            
            // Store metadata about which model was actually used
            if (result.metadata) {
                setLastCallMetadata(result.metadata);
            }
            
            // Save to Convex via API route
            await fetch('/api/admin/save-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    aiPrediction: {
                        prediction: result.prediction,
                        confidence: result.confidence,
                        reasoning: result.reasoning,
                        suggestedBet: result.suggestedBet,
                    }
                })
            });
            
            // Update local state to show the prediction immediately
            setLocalPrediction({
                prediction: result.prediction,
                confidence: result.confidence,
                reasoning: result.reasoning,
                suggestedBet: result.suggestedBet,
                generatedAt: new Date().toISOString()
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
                                    <Image 
                                        src={match.homeTeamLogo} 
                                        alt={match.homeTeam}
                                        width={64}
                                        height={64}
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
                                    <Image 
                                        src={match.awayTeamLogo} 
                                        alt={match.awayTeam}
                                        width={64}
                                        height={64}
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
                                    <Image 
                                        src={match.leagueLogo} 
                                        alt={match.league}
                                        width={16}
                                        height={16}
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
                                <Image 
                                    src={match.countryFlag} 
                                    alt={match.country || 'Country flag'}
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
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {/* Simple Odds in Overview */}
                            {match.odds && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Match Odds (1X2)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">Home</div>
                                            <div className="text-xl font-bold text-brand-green">{match.odds.home}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                                            <div className="text-xs text-zinc-500 mb-1">Draw</div>
                                            <div className="text-xl font-bold text-zinc-700 dark:text-zinc-300">{match.odds.draw || '-'}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">Away</div>
                                            <div className="text-xl font-bold text-red-600">{match.odds.away}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Over/Under in Overview */}
                            {match.detailedOdds?.ft?.['ou'] && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Over/Under (Line: {match.detailedOdds.ft['ou'].line})
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">Over</div>
                                            <div className="text-xl font-bold text-red-600">{match.detailedOdds.ft['ou'].over}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">Under</div>
                                            <div className="text-xl font-bold text-brand-green">{match.detailedOdds.ft['ou'].under}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* H2H Summary */}
                            {match.h2h?.summary && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Head to Head
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">Home Wins</div>
                                            <div className="text-xl font-bold text-brand-green">{match.h2h.summary.wins}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                                            <div className="text-xs text-zinc-500 mb-1">Draws</div>
                                            <div className="text-xl font-bold text-zinc-700 dark:text-zinc-300">{match.h2h.summary.draws}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">Away Wins</div>
                                            <div className="text-xl font-bold text-red-600">{match.h2h.summary.losses}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* H2H History */}
                            {match.h2h?.history && match.h2h.history.length > 0 && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        H2H History
                                    </h3>
                                    <div className="space-y-2">
                                        {match.h2h.history.map((h, i) => (
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
                            {(match.homeForm || match.awayForm) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Recent Form
                                    </h3>
                                    <div className="space-y-3">
                                        {match.homeForm && (
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 w-32 truncate">{match.homeTeam}</span>
                                                <div className="flex gap-1">
                                                    {match.homeForm.split('').slice(0, 5).map((char, i) => (
                                                        <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${
                                                            char === 'W' ? 'bg-brand-green' : char === 'D' ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}>
                                                            {char}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {match.awayForm && (
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 w-32 truncate">{match.awayTeam}</span>
                                                <div className="flex gap-1">
                                                    {match.awayForm.split('').slice(0, 5).map((char, i) => (
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
                            {(match.homeCorners !== undefined || match.awayCorners !== undefined) && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-3">
                                        Corner Stats
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 rounded-lg bg-brand-green/10 dark:bg-brand-green/10">
                                            <div className="text-xs text-zinc-500 mb-1">{match.homeTeam}</div>
                                            <div className="text-xl font-bold text-brand-green">{match.homeCorners ?? 0}</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                                            <div className="text-xs text-zinc-500 mb-1">{match.awayTeam}</div>
                                            <div className="text-xl font-bold text-red-600">{match.awayCorners ?? 0}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Prediction Section */}
                            <div className="md:col-span-2">
                                {aiPred ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                                                <BrainCircuit size={16} className="text-purple-500" />
                                                AI Prediction
                                                <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                                    {aiPred.confidence}% confidence
                                                </span>
                                            </h3>
                                        </div>
                                        
                                        {/* Model Selector & Metadata */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <ModelSelector 
                                                    selectedModel={selectedModel}
                                                    onModelChange={setSelectedModel}
                                                    disabled={analyzing}
                                                />
                                            </div>
                                        </div>
                                        {lastCallMetadata && lastCallMetadata.attempts > 1 && (
                                            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                                <Cpu size={14} />
                                                <span>
                                                    Auto-switched to {lastCallMetadata.usedModel.name} after {lastCallMetadata.attempts - 1} failed attempt(s)
                                                </span>
                                            </div>
                                        )}
                                        <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 dark:border-purple-500/20 dark:bg-purple-500/5">
                                            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                                {aiPred.prediction}
                                            </p>
                                            <div className="mt-3 grid gap-2">
                                                {aiPred.reasoning?.map((reason: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                                                        <CheckCircle2 size={14} className="text-brand-green shrink-0 mt-0.5" />
                                                        <span>{reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {aiPred.suggestedBet && (
                                                <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                    <span className="font-bold text-blue-600">Pro Tip:</span> {aiPred.suggestedBet}
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
                                        
                                        {/* Model Selector */}
                                        <ModelSelector 
                                            selectedModel={selectedModel}
                                            onModelChange={setSelectedModel}
                                            disabled={analyzing}
                                        />
                                        
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
                        </div>
                    )}

                    {activeTab === 'Odds' && match.detailedOdds?.ft && (
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
                                            <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{match.detailedOdds.ft['1x2'].home}</td>
                                            <td className="px-4 py-3 text-center font-bold">{match.detailedOdds.ft['1x2'].draw}</td>
                                            <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{match.detailedOdds.ft['1x2'].away}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {match.detailedOdds.ft['ou'] && (
                                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-zinc-500 uppercase">
                                            Over/Under (Line: {match.detailedOdds.ft['ou'].line})
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
                                                <td className="px-4 py-3 text-center font-bold bg-red-500/10 text-red-700 dark:text-red-400">{match.detailedOdds.ft['ou'].over}</td>
                                                <td className="px-4 py-3 text-center font-bold">{match.detailedOdds.ft['ou'].line}</td>
                                                <td className="px-4 py-3 text-center font-bold bg-brand-green/10 text-brand-green dark:text-brand-green/80">{match.detailedOdds.ft['ou'].under}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <p className="text-xs text-zinc-400 text-center">
                                Odds from The Odds API (Free Tier)
                            </p>
                        </div>
                    )}

                    {activeTab === 'Odds' && !match.detailedOdds?.ft && (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-4">
                            <TrendingUp size={48} className="opacity-20" />
                            <p className="text-sm font-medium">No odds data available for this match.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
