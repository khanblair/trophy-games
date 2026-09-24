'use client';

import React, { useState } from 'react';
import {
    Swords, Star, DollarSign, Crown, Filter,
    CheckCircle2, AlertCircle, Loader2, Sparkles, TrendingUp
} from 'lucide-react';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';

interface ManualMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const MATCH_TYPES = [
    { value: 'unassigned', label: 'Unassigned', icon: Filter, color: 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800' },
    { value: 'free', label: 'Free', icon: Star, color: 'border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
    { value: 'paid', label: 'Paid', icon: DollarSign, color: 'border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
    { value: 'vip', label: 'VIP', icon: Crown, color: 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
] as const;

const getDefaultTimestamp = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
};

export function ManualMatchModal({ isOpen, onClose, onSuccess }: ManualMatchModalProps) {
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [league, setLeague] = useState('');
    const [country, setCountry] = useState('');
    const [timestamp, setTimestamp] = useState(getDefaultTimestamp());
    const [matchType, setMatchType] = useState<'free' | 'paid' | 'vip' | 'unassigned'>('free');
    const [homeOdds, setHomeOdds] = useState('');
    const [drawOdds, setDrawOdds] = useState('');
    const [awayOdds, setAwayOdds] = useState('');
    const [prediction, setPrediction] = useState('');
    const [confidence, setConfidence] = useState('75');
    const [suggestedBet, setSuggestedBet] = useState('');
    const [reasoning, setReasoning] = useState('');
    const [isTrending, setIsTrending] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setHomeTeam('');
        setAwayTeam('');
        setLeague('');
        setCountry('');
        setTimestamp(getDefaultTimestamp());
        setMatchType('free');
        setHomeOdds('');
        setDrawOdds('');
        setAwayOdds('');
        setPrediction('');
        setConfidence('75');
        setSuggestedBet('');
        setReasoning('');
        setIsTrending(false);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Required-field validation
        if (!homeTeam.trim()) {
            setError('Home team name is required.');
            return;
        }
        if (!awayTeam.trim()) {
            setError('Away team name is required.');
            return;
        }
        if (!league.trim()) {
            setError('League/competition is required.');
            return;
        }
        if (!timestamp) {
            setError('Kickoff date & time is required.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    homeTeam: homeTeam.trim(),
                    awayTeam: awayTeam.trim(),
                    league: league.trim(),
                    country: country.trim() || undefined,
                    timestamp: new Date(timestamp).toISOString(),
                    status: 'Scheduled',
                    matchType,
                    homeOdds: homeOdds.trim() || undefined,
                    drawOdds: drawOdds.trim() || undefined,
                    awayOdds: awayOdds.trim() || undefined,
                    isTrending,
                    prediction: prediction.trim() || undefined,
                    confidence: confidence ? Number(confidence) : undefined,
                    suggestedBet: suggestedBet.trim() || undefined,
                    reasoning: reasoning.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to save match');
            }

            resetForm();
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the match.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create Manual Match">
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
                                value={homeTeam}
                                onChange={(e) => setHomeTeam(e.target.value)}
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
                                value={awayTeam}
                                onChange={(e) => setAwayTeam(e.target.value)}
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
                                value={league}
                                onChange={(e) => setLeague(e.target.value)}
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
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
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
                                value={timestamp}
                                onChange={(e) => setTimestamp(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                <input
                                    type="checkbox"
                                    checked={isTrending}
                                    onChange={(e) => setIsTrending(e.target.checked)}
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
                            const isSelected = matchType === t.value;
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setMatchType(t.value)}
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
                                value={homeOdds}
                                onChange={(e) => setHomeOdds(e.target.value)}
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
                                value={drawOdds}
                                onChange={(e) => setDrawOdds(e.target.value)}
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
                                value={awayOdds}
                                onChange={(e) => setAwayOdds(e.target.value)}
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
                                value={prediction}
                                onChange={(e) => setPrediction(e.target.value)}
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
                                value={confidence}
                                onChange={(e) => setConfidence(e.target.value)}
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
                            value={suggestedBet}
                            onChange={(e) => setSuggestedBet(e.target.value)}
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
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            placeholder="Enter key analysis points (one per line)..."
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                {/* Save / Cancel Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={handleClose}
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
                                Save Match
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
