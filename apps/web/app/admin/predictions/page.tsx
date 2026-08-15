'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Target, RefreshCw, ChevronDown, ChevronUp, CheckCircle2,
    Pencil, Loader2, Crown, DollarSign, Unlock, Search, X
} from 'lucide-react';
import { toast } from 'sonner';

interface Match {
    _id: string;
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    timestamp: string;
    matchDate?: string;
    status: string;
    matchType?: string;
    aiPrediction?: {
        prediction: string;
        confidence: number;
        reasoning: string[];
        suggestedBet?: string;
    };
}

interface PredictionForm {
    prediction: string;
    confidence: number;
    suggestedBet: string;
    reasoning: string;
}

const DEFAULT_FORM: PredictionForm = {
    prediction: '',
    confidence: 75,
    suggestedBet: '',
    reasoning: '',
};

const PREDICTION_TEMPLATES = [
    'Home Win', 'Away Win', 'Draw', 'Both Teams to Score', 'Over 2.5 Goals',
    'Under 2.5 Goals', 'Over 1.5 Goals', 'Home Win or Draw', 'Away Win or Draw',
    'Home Team to Score First', 'Clean Sheet - Home', 'Clean Sheet - Away',
];

const MATCH_TYPE_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    free: { label: 'Free', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', icon: <Unlock size={10} /> },
    paid: { label: 'Paid', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <DollarSign size={10} /> },
    vip: { label: 'VIP', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Crown size={10} /> },
    unassigned: { label: 'Unassigned', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500', icon: null },
};

export default function AdminPredictionsPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [forms, setForms] = useState<Record<string, PredictionForm>>({});
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterHasPrediction, setFilterHasPrediction] = useState<'all' | 'yes' | 'no'>('all');

    const loadMatches = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/matches');
            const data = await res.json();
            const list: Match[] = Array.isArray(data) ? data : [];
            // Sort: most recent first
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setMatches(list);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load matches');
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadMatches(); }, [loadMatches]);

    const getForm = (match: Match): PredictionForm => {
        if (forms[match._id]) return forms[match._id];
        if (match.aiPrediction) {
            return {
                prediction: match.aiPrediction.prediction || '',
                confidence: match.aiPrediction.confidence || 75,
                suggestedBet: match.aiPrediction.suggestedBet || '',
                reasoning: (match.aiPrediction.reasoning || []).join('\n'),
            };
        }
        return DEFAULT_FORM;
    };

    const updateForm = (matchId: string, field: keyof PredictionForm, value: string | number) => {
        setForms(prev => ({
            ...prev,
            [matchId]: { ...getForm(matches.find(m => m._id === matchId)!), [field]: value },
        }));
    };

    const handleSave = async (match: Match) => {
        const form = getForm(match);
        if (!form.prediction.trim()) {
            toast.error('Prediction text is required');
            return;
        }
        if (form.confidence < 1 || form.confidence > 100) {
            toast.error('Confidence must be between 1 and 100');
            return;
        }

        setSaving(match._id);
        try {
            const res = await fetch('/api/admin/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: match.id,
                    aiPrediction: {
                        prediction: form.prediction.trim(),
                        confidence: Number(form.confidence),
                        suggestedBet: form.suggestedBet.trim() || undefined,
                        reasoning: form.reasoning.trim()
                            ? form.reasoning.trim().split('\n').map(l => l.trim()).filter(Boolean)
                            : [],
                    },
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');

            toast.success(`Prediction saved for ${match.homeTeam} vs ${match.awayTeam}`);
            // Optimistically update local state
            setMatches(prev => prev.map(m =>
                m._id === match._id
                    ? {
                        ...m, aiPrediction: {
                            prediction: form.prediction.trim(),
                            confidence: Number(form.confidence),
                            suggestedBet: form.suggestedBet.trim() || undefined,
                            reasoning: form.reasoning.trim()
                                ? form.reasoning.trim().split('\n').map(l => l.trim()).filter(Boolean)
                                : [],
                        }
                    }
                    : m
            ));
            // Clear local form state so it re-reads from match
            setForms(prev => { const n = { ...prev }; delete n[match._id]; return n; });
            setExpanded(null);
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Failed to save prediction');
        }
        setSaving(null);
    };

    const filtered = matches.filter(m => {
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            m.homeTeam.toLowerCase().includes(q) ||
            m.awayTeam.toLowerCase().includes(q) ||
            m.league.toLowerCase().includes(q);
        const matchesType = filterType === 'all' || m.matchType === filterType;
        const hasPred = !!m.aiPrediction?.prediction;
        const matchesPred =
            filterHasPrediction === 'all' ||
            (filterHasPrediction === 'yes' && hasPred) ||
            (filterHasPrediction === 'no' && !hasPred);
        return matchesSearch && matchesType && matchesPred;
    });

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                        <Target size={28} className="text-blue-500" />
                        Predictions
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Manually add or edit AI predictions for any match.
                    </p>
                </div>
                <button
                    onClick={loadMatches}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm"
                >
                    <RefreshCw size={14} />Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: 'Total Matches', value: matches.length, color: 'text-zinc-900 dark:text-zinc-50' },
                    { label: 'With Prediction', value: matches.filter(m => !!m.aiPrediction?.prediction).length, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Missing Prediction', value: matches.filter(m => !m.aiPrediction?.prediction).length, color: 'text-orange-500' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search matches, teams, leagues…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700 dark:text-zinc-300"
                >
                    <option value="all">All Types</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="vip">VIP</option>
                    <option value="unassigned">Unassigned</option>
                </select>
                <select
                    value={filterHasPrediction}
                    onChange={e => setFilterHasPrediction(e.target.value as any)}
                    className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700 dark:text-zinc-300"
                >
                    <option value="all">All Predictions</option>
                    <option value="yes">Has Prediction</option>
                    <option value="no">Missing Prediction</option>
                </select>
            </div>

            {/* Match List */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />Loading matches…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">No matches found.</div>
                ) : (
                    filtered.map(match => {
                        const isOpen = expanded === match._id;
                        const form = getForm(match);
                        const hasPred = !!match.aiPrediction?.prediction;
                        const typeBadge = MATCH_TYPE_BADGE[match.matchType || 'unassigned'] || MATCH_TYPE_BADGE.unassigned;
                        const matchDate = match.matchDate || match.timestamp?.split('T')[0] || '—';

                        return (
                            <div key={match._id}>
                                {/* Row */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                                    onClick={() => setExpanded(isOpen ? null : match._id)}
                                >
                                    {/* Status dot */}
                                    <div className={`shrink-0 w-2 h-2 rounded-full ${hasPred ? 'bg-green-500' : 'bg-orange-400'}`} title={hasPred ? 'Has prediction' : 'No prediction'} />

                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                            {match.homeTeam} <span className="text-zinc-400 font-normal">vs</span> {match.awayTeam}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                            <span>{match.league}</span>
                                            <span>·</span>
                                            <span>{matchDate}</span>
                                            {match.status && <span className="text-zinc-400">· {match.status}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Type badge */}
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge.cls}`}>
                                            {typeBadge.icon}{typeBadge.label}
                                        </span>

                                        {/* Prediction chip */}
                                        {hasPred ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle2 size={10} />
                                                {match.aiPrediction!.prediction.length > 14
                                                    ? match.aiPrediction!.prediction.slice(0, 14) + '…'
                                                    : match.aiPrediction!.prediction}
                                                <span className="opacity-60">· {match.aiPrediction!.confidence}%</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                                <Pencil size={10} />Add
                                            </span>
                                        )}

                                        <span className="text-zinc-400">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                                    </div>
                                </div>

                                {/* Expanded form */}
                                {isOpen && (
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 px-4 py-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Prediction */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                    Prediction <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={form.prediction}
                                                        onChange={e => updateForm(match._id, 'prediction', e.target.value)}
                                                        placeholder="e.g. Home Win, Over 2.5 Goals…"
                                                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                                                    />
                                                    <select
                                                        value=""
                                                        onChange={e => { if (e.target.value) updateForm(match._id, 'prediction', e.target.value); }}
                                                        className="px-2 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-500 dark:text-zinc-400"
                                                        title="Quick-select a prediction template"
                                                    >
                                                        <option value="">Templates…</option>
                                                        {PREDICTION_TEMPLATES.map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Confidence */}
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                    Confidence: <span className="text-blue-500 font-bold">{form.confidence}%</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min={1} max={100}
                                                    value={form.confidence}
                                                    onChange={e => updateForm(match._id, 'confidence', Number(e.target.value))}
                                                    className="w-full accent-blue-500"
                                                />
                                                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                                                    <span>1%</span><span>50%</span><span>100%</span>
                                                </div>
                                            </div>

                                            {/* Suggested Bet */}
                                            <div>
                                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                    Suggested Bet <span className="text-zinc-400 font-normal">(optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.suggestedBet}
                                                    onChange={e => updateForm(match._id, 'suggestedBet', e.target.value)}
                                                    placeholder="e.g. Back Home Win @ 1.85"
                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                                                />
                                            </div>

                                            {/* Reasoning */}
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                                    Reasoning <span className="text-zinc-400 font-normal">(one line per bullet point)</span>
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    value={form.reasoning}
                                                    onChange={e => updateForm(match._id, 'reasoning', e.target.value)}
                                                    placeholder={"Strong home form (W5 in last 5)\nAway team missing key striker\nHistorically scores first at home"}
                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 resize-y"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 pt-1">
                                            <button
                                                onClick={() => setExpanded(null)}
                                                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave(match)}
                                                disabled={saving === match._id}
                                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                                            >
                                                {saving === match._id
                                                    ? <><Loader2 size={14} className="animate-spin" />Saving…</>
                                                    : <><CheckCircle2 size={14} />Save Prediction</>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
