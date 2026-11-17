'use client';

import React, { useState } from 'react';
import {
    Swords, Star, DollarSign, Crown, Filter,
    CheckCircle2, AlertCircle, Loader2, Sparkles, TrendingUp, Trophy
} from 'lucide-react';
import { MatchData } from '@trophy-games/shared';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';

interface ManualMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** When provided the modal edits this match instead of creating a new one. */
    match?: MatchData | null;
}

type MatchType = 'free' | 'paid' | 'vip' | 'unassigned';
type MatchResult = 'pending' | 'win' | 'lose' | 'draw';

interface FormState {
    homeTeam: string;
    awayTeam: string;
    league: string;
    country: string;
    timestamp: string;
    matchType: MatchType;
    homeOdds: string;
    drawOdds: string;
    awayOdds: string;
    prediction: string;
    confidence: string;
    suggestedBet: string;
    reasoning: string;
    isTrending: boolean;
    result: MatchResult;
}

type TextField = Exclude<keyof FormState, 'matchType' | 'isTrending' | 'result'>;

const MATCH_TYPES = [
    { value: 'unassigned', label: 'Unassigned', icon: Filter, color: 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800' },
    { value: 'free', label: 'Free', icon: Star, color: 'border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
    { value: 'paid', label: 'Paid', icon: DollarSign, color: 'border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
    { value: 'vip', label: 'VIP', icon: Crown, color: 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
] as const;

const MATCH_RESULTS = [
    { value: 'pending', label: 'Pending' },
    { value: 'win', label: 'Won' },
    { value: 'lose', label: 'Lost' },
    { value: 'draw', label: 'Draw' },
] as const;

const getDefaultTimestamp = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
};

// datetime-local inputs use local wall-clock time, while stored timestamps are
// ISO UTC strings — convert back to local time when prefilling the form.
const toDateTimeLocal = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formFromMatch = (match?: MatchData | null): FormState => ({
    homeTeam: match?.homeTeam ?? '',
    awayTeam: match?.awayTeam ?? '',
    league: match?.league ?? '',
    country: match?.country ?? '',
    timestamp: match ? toDateTimeLocal(match.timestamp) : getDefaultTimestamp(),
    matchType: match?.matchType ?? 'unassigned',
    homeOdds: match?.odds?.home ?? '',
    drawOdds: match?.odds?.draw ?? '',
    awayOdds: match?.odds?.away ?? '',
    prediction: match?.aiPrediction?.prediction ?? '',
    confidence: match?.aiPrediction ? String(match.aiPrediction.confidence) : '75',
    suggestedBet: match?.aiPrediction?.suggestedBet ?? '',
    reasoning: match?.aiPrediction?.reasoning.join('\n') ?? '',
    isTrending: match?.isTrending ?? false,
    result: match?.result ?? 'pending',
});

export function ManualMatchModal({ isOpen, onClose, onSuccess, match }: ManualMatchModalProps) {
    const isEdit = Boolean(match);
    const [form, setForm] = useState<FormState>(() => formFromMatch(match));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // The parent remounts this component with a new key whenever the edit
    // target changes, so the initializer always seeds the latest match data.

    const setText = (key: TextField) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Required-field validation
        if (!form.homeTeam.trim()) {
            setError('Home team name is required.');
            return;
        }
        if (!form.awayTeam.trim()) {
            setError('Away team name is required.');
            return;
        }
        if (!form.league.trim()) {
            setError('League/competition is required.');
            return;
        }
        if (!form.timestamp) {
            setError('Kickoff date & time is required.');
            return;
        }

        const kickoff = new Date(form.timestamp);
        if (Number.isNaN(kickoff.getTime())) {
            setError('Enter a valid kickoff date & time.');
            return;
        }

        const numericConfidence = form.confidence.trim() ? Number(form.confidence) : undefined;
        if (numericConfidence !== undefined &&
            (!Number.isFinite(numericConfidence) || numericConfidence < 1 || numericConfidence > 100)) {
            setError('Confidence must be between 1 and 100.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/matches', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(isEdit && match ? { matchId: match.id } : {}),
                    homeTeam: form.homeTeam.trim(),
                    awayTeam: form.awayTeam.trim(),
                    league: form.league.trim(),
                    country: form.country.trim() || undefined,
                    timestamp: kickoff.toISOString(),
                    ...(isEdit ? {} : { status: 'Scheduled' }),
                    matchType: form.matchType,
                    homeOdds: form.homeOdds.trim() || undefined,
                    drawOdds: form.drawOdds.trim() || undefined,
                    awayOdds: form.awayOdds.trim() || undefined,
                    isTrending: form.isTrending,
                    prediction: form.prediction.trim() || undefined,
                    confidence: numericConfidence,
                    suggestedBet: form.suggestedBet.trim() || undefined,
                    reasoning: form.reasoning.trim() || undefined,
                    result: form.result,
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} match`);
            }

            setForm(formFromMatch(match));
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error
                ? err.message
                : `An error occurred while ${isEdit ? 'updating' : 'creating'} the match.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Match' : 'Create Manual Match'}>
            <form onSubmit={handleSave} className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Match Information */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Swords size={14} className="text-blue-600" />
                        Match Teams & Competition
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Home Team <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.homeTeam}
                                onChange={setText('homeTeam')}
                                placeholder="e.g. Arsenal"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Away Team <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.awayTeam}
                                onChange={setText('awayTeam')}
                                placeholder="e.g. Chelsea"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                League / Competition <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.league}
                                onChange={setText('league')}
                                placeholder="e.g. Premier League"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Country (optional)
                            </label>
                            <input
                                type="text"
                                value={form.country}
                                onChange={setText('country')}
                                placeholder="e.g. England"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Kickoff Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={form.timestamp}
                                onChange={setText('timestamp')}
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                <input
                                    type="checkbox"
                                    checked={form.isTrending}
                                    onChange={(e) => setForm(prev => ({ ...prev, isTrending: e.target.checked }))}
                                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Mark as Trending Match 🔥</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tip Tier Selection */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Prediction Tier
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {MATCH_TYPES.map((t) => {
                            const Icon = t.icon;
                            const isSelected = form.matchType === t.value;
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, matchType: t.value }))}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all",
                                        isSelected
                                            ? t.color + " ring-2 ring-blue-500 shadow-sm"
                                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <Icon size={14} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Result Status */}
                <div className="space-y-2">
                    <label htmlFor="match-result" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Trophy size={14} className="text-amber-500" />
                        Result Status
                    </label>
                    <select
                        id="match-result"
                        value={form.result}
                        onChange={(e) => setForm(prev => ({ ...prev, result: e.target.value as MatchResult }))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {MATCH_RESULTS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                {/* Odds Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <TrendingUp size={14} className="text-brand-green" />
                        1X2 Match Odds (Optional)
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                1 (Home)
                            </label>
                            <input
                                type="text"
                                value={form.homeOdds}
                                onChange={setText('homeOdds')}
                                placeholder="e.g. 1.85"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                X (Draw)
                            </label>
                            <input
                                type="text"
                                value={form.drawOdds}
                                onChange={setText('drawOdds')}
                                placeholder="e.g. 3.40"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                2 (Away)
                            </label>
                            <input
                                type="text"
                                value={form.awayOdds}
                                onChange={setText('awayOdds')}
                                placeholder="e.g. 4.20"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Prediction / Pick */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-500" />
                        Prediction & Tip Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Prediction Pick / Verdict
                            </label>
                            <input
                                type="text"
                                value={form.prediction}
                                onChange={setText('prediction')}
                                placeholder="e.g. Arsenal to Win & Over 1.5 Goals"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Confidence %
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={form.confidence}
                                onChange={setText('confidence')}
                                placeholder="75"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Suggested Bet (Optional)
                        </label>
                        <input
                            type="text"
                            value={form.suggestedBet}
                            onChange={setText('suggestedBet')}
                            placeholder="e.g. Over 2.5 Goals @ 1.85"
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Reasoning & Analysis Notes (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={form.reasoning}
                            onChange={setText('reasoning')}
                            placeholder="Enter key analysis points (one per line)..."
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                {/* Save / Cancel Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-colors"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                {isEdit ? 'Save Changes' : 'Save Match'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
