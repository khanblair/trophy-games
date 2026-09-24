'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Swords, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
    Star, DollarSign, Crown, Filter, Brain, PlusCircle, ExternalLink,
    Flame,
} from 'lucide-react';
import Link from 'next/link';

const MATCH_TYPES = [
    { value: 'unassigned', label: 'Unassigned', icon: Filter, color: 'bg-zinc-500' },
    { value: 'free', label: 'Free', icon: Star, color: 'bg-blue-500' },
    { value: 'paid', label: 'Paid', icon: DollarSign, color: 'bg-orange-500' },
    { value: 'vip', label: 'VIP', icon: Crown, color: 'bg-purple-500' },
] as const;

const STATUS_OPTIONS = ['Scheduled', 'Live', 'Finished', 'Postponed', 'Cancelled'];

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

interface FormState {
    homeTeam: string;
    awayTeam: string;
    league: string;
    country: string;
    timestamp: string;
    status: string;
    matchType: 'free' | 'paid' | 'vip' | 'unassigned';
    homeOdds: string;
    drawOdds: string;
    awayOdds: string;
    leagueLogo: string;
    homeTeamLogo: string;
    awayTeamLogo: string;
    isTrending: boolean;
    score: string;
    // AI Prediction fields
    prediction: string;
    confidence: string;
    suggestedBet: string;
    reasoning: string;
}

const getDefaultTimestamp = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
};

const DEFAULT_FORM: FormState = {
    homeTeam: '',
    awayTeam: '',
    league: '',
    country: '',
    timestamp: getDefaultTimestamp(),
    status: 'Scheduled',
    matchType: 'free',
    homeOdds: '',
    drawOdds: '',
    awayOdds: '',
    leagueLogo: '',
    homeTeamLogo: '',
    awayTeamLogo: '',
    isTrending: false,
    score: '',
    prediction: '',
    confidence: '',
    suggestedBet: '',
    reasoning: '',
};

export default function AddMatchPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const set = (key: keyof FormState) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const toggleTrending = () => setForm(prev => ({ ...prev, isTrending: !prev.isTrending }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.homeTeam.trim() || !form.awayTeam.trim() || !form.league.trim() || !form.timestamp) {
            setError('Home team, away team, league, and kickoff time are required.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    homeTeam: form.homeTeam.trim(),
                    awayTeam: form.awayTeam.trim(),
                    league: form.league.trim(),
                    country: form.country.trim() || undefined,
                    timestamp: new Date(form.timestamp).toISOString(),
                    status: form.status,
                    matchType: form.matchType,
                    homeOdds: form.homeOdds || undefined,
                    drawOdds: form.drawOdds || undefined,
                    awayOdds: form.awayOdds || undefined,
                    leagueLogo: form.leagueLogo || undefined,
                    homeTeamLogo: form.homeTeamLogo || undefined,
                    awayTeamLogo: form.awayTeamLogo || undefined,
                    isTrending: form.isTrending,
                    score: form.score || undefined,
                    prediction: form.prediction || undefined,
                    confidence: form.confidence ? Number(form.confidence) : undefined,
                    suggestedBet: form.suggestedBet || undefined,
                    reasoning: form.reasoning || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to create match');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddAnother = () => {
        setSuccess(false);
        setForm(DEFAULT_FORM);
    };

    const inputClass =
        'w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-400';
    const labelClass = 'block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider';

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
            {/* Back + header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/matches"
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Swords size={22} className="text-blue-600" />
                        Add Match Manually
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Create a match with tip, prediction, and odds. It will sync to mobile immediately.
                    </p>
                </div>
            </div>

            {/* Success state */}
            {success && (
                <div className="rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-5 py-5 space-y-3">
                    <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                        <CheckCircle2 size={18} />
                        <span className="font-semibold text-sm">Match created successfully!</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddAnother}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <PlusCircle size={14} />
                            Add Another
                        </button>
                        <Link
                            href="/matches"
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
                        >
                            <ExternalLink size={14} />
                            Go to Matches
                        </Link>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-5 py-4 text-red-600 dark:text-red-400">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Teams */}
                <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider">Teams</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Home Team *</label>
                            <input
                                type="text"
                                value={form.homeTeam}
                                onChange={set('homeTeam')}
                                placeholder="e.g. Manchester City"
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Away Team *</label>
                            <input
                                type="text"
                                value={form.awayTeam}
                                onChange={set('awayTeam')}
                                placeholder="e.g. Arsenal"
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Home Team Logo URL</label>
                            <input
                                type="url"
                                value={form.homeTeamLogo}
                                onChange={set('homeTeamLogo')}
                                placeholder="https://..."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Away Team Logo URL</label>
                            <input
                                type="url"
                                value={form.awayTeamLogo}
                                onChange={set('awayTeamLogo')}
                                placeholder="https://..."
                                className={inputClass}
                            />
                        </div>
                    </div>
                </section>

                {/* Match Info */}
                <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider">Match Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>League *</label>
                            <input
                                type="text"
                                value={form.league}
                                onChange={set('league')}
                                placeholder="e.g. English Premier League"
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Country</label>
                            <input
                                type="text"
                                value={form.country}
                                onChange={set('country')}
                                placeholder="e.g. England"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Kickoff Time *</label>
                            <input
                                type="datetime-local"
                                value={form.timestamp}
                                onChange={set('timestamp')}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select value={form.status} onChange={set('status')} className={inputClass}>
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Score</label>
                            <input
                                type="text"
                                value={form.score}
                                onChange={set('score')}
                                placeholder="e.g. 2-1 (leave blank for 0-0)"
                                className={inputClass}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={toggleTrending}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all w-full justify-center',
                                    form.isTrending
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-300'
                                )}
                            >
                                <Flame size={16} />
                                <span className="text-sm font-semibold">{form.isTrending ? 'Trending ✓' : 'Mark as Trending'}</span>
                            </button>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>League Logo URL</label>
                            <input
                                type="url"
                                value={form.leagueLogo}
                                onChange={set('leagueLogo')}
                                placeholder="https://..."
                                className={inputClass}
                            />
                        </div>
                    </div>
                </section>

                {/* Tip Tier */}
                <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider">Tip Tier</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {MATCH_TYPES.map(({ value, label, icon: Icon, color }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, matchType: value }))}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                    form.matchType === value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                )}
                            >
                                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-white', color)}>
                                    <Icon size={16} />
                                </div>
                                <span className={cn(
                                    'text-xs font-bold capitalize',
                                    form.matchType === value
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                )}>{label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Odds */}
                <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider">
                        Odds <span className="text-zinc-400 font-normal normal-case">(optional)</span>
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Home (1)</label>
                            <input type="number" step="0.01" min="1.01" value={form.homeOdds} onChange={set('homeOdds')} placeholder="1.85" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Draw (X)</label>
                            <input type="number" step="0.01" min="1.01" value={form.drawOdds} onChange={set('drawOdds')} placeholder="3.40" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Away (2)</label>
                            <input type="number" step="0.01" min="1.01" value={form.awayOdds} onChange={set('awayOdds')} placeholder="4.50" className={inputClass} />
                        </div>
                    </div>
                </section>

                {/* AI Prediction / Tip */}
                <section className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-500/5 p-5 space-y-4">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Brain size={16} className="text-purple-600" />
                        AI Tip / Prediction <span className="text-zinc-400 font-normal normal-case">(optional)</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Prediction Verdict</label>
                            <input
                                type="text"
                                value={form.prediction}
                                onChange={set('prediction')}
                                placeholder="e.g. Home Win — Manchester City expected to dominate"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Confidence %</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={form.confidence}
                                onChange={set('confidence')}
                                placeholder="e.g. 85"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Suggested Bet</label>
                            <input
                                type="text"
                                value={form.suggestedBet}
                                onChange={set('suggestedBet')}
                                placeholder="e.g. Over 2.5 Goals"
                                className={inputClass}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Reasoning Notes</label>
                            <textarea
                                value={form.reasoning}
                                onChange={set('reasoning')}
                                placeholder="One reason per line, e.g.&#10;Man City unbeaten in 12 home games&#10;Arsenal missing 2 key defenders&#10;H2H favors City 7/10 recent meetings"
                                rows={4}
                                className={cn(inputClass, 'resize-none')}
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">Enter each reasoning point on a new line.</p>
                        </div>
                    </div>
                </section>

                {/* Live Preview */}
                {(form.homeTeam || form.awayTeam) && (
                    <section className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-500/5 p-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Preview</p>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-50">{form.homeTeam || '—'}</span>
                            <span className="text-xs text-zinc-400 mx-2">vs</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-50">{form.awayTeam || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                            <span>{form.league || 'League TBD'}</span>
                            {form.timestamp && (
                                <>
                                    <span>·</span>
                                    <span>{new Date(form.timestamp).toLocaleString([], { weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                </>
                            )}
                            <span>·</span>
                            <span className="capitalize font-semibold">{form.matchType}</span>
                            {form.isTrending && (
                                <>
                                    <span>·</span>
                                    <span className="text-orange-500 font-semibold flex items-center gap-1"><Flame size={10} /> Trending</span>
                                </>
                            )}
                        </div>
                        {(form.homeOdds || form.drawOdds || form.awayOdds) && (
                            <div className="flex gap-2 pt-1 text-xs font-mono">
                                {form.homeOdds && <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">1: {form.homeOdds}</span>}
                                {form.drawOdds && <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">X: {form.drawOdds}</span>}
                                {form.awayOdds && <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">2: {form.awayOdds}</span>}
                            </div>
                        )}
                        {form.prediction && (
                            <div className="mt-2 p-3 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-500/5">
                                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 mb-1">
                                    <Brain size={12} />
                                    <span className="font-bold">AI Prediction</span>
                                    {form.confidence && <span className="ml-auto font-mono">{form.confidence}% confidence</span>}
                                </div>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">{form.prediction}</p>
                                {form.suggestedBet && (
                                    <p className="text-xs text-zinc-500 mt-1">💡 Suggested: {form.suggestedBet}</p>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 pb-8">
                    <Link
                        href="/matches"
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting || success}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        {submitting ? (
                            <><Loader2 size={15} className="animate-spin" />Creating…</>
                        ) : success ? (
                            <><CheckCircle2 size={15} />Created!</>
                        ) : (
                            <><Swords size={15} />Create Match</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
