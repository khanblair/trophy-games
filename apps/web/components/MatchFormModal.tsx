'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Users, MapPin, DollarSign, Star, Crown, Filter, ChevronDown, AlertCircle, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { MatchData, LeagueInfo } from '@trophy-games/shared';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';

interface MatchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (match: Partial<MatchData>) => void;
    onDelete?: () => void;
    match?: MatchData | null;
    mode: 'create' | 'edit';
}

const generateMatchId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `match_${timestamp}_${random}`;
};

export function MatchFormModal({ isOpen, onClose, onSubmit, onDelete, match, mode }: MatchFormModalProps) {
    const [formData, setFormData] = useState<Partial<MatchData>>({
        id: generateMatchId(),
        league: '',
        homeTeam: '',
        awayTeam: '',
        timestamp: new Date().toISOString().slice(0, 16),
        status: 'Scheduled',
        score: '0-0',
        matchType: 'unassigned',
        odds: { home: '1.85', away: '2.10', draw: '3.40' },
    });

    const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
    const [loadingLeagues, setLoadingLeagues] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);

    // AI assistance states
    const [aiContext, setAiContext] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [useWebSearch, setUseWebSearch] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLeagues();
        }
    }, [isOpen]);

    useEffect(() => {
        if (match && mode === 'edit') {
            setFormData({
                id: match.id,
                league: match.league,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                timestamp: match.timestamp.slice(0, 16),
                status: match.status,
                score: match.score || '0-0',
                matchType: match.matchType || 'unassigned',
                odds: match.odds || { home: '1.85', away: '2.10', draw: '3.40' },
                homeTeamLogo: match.homeTeamLogo,
                awayTeamLogo: match.awayTeamLogo,
                leagueLogo: match.leagueLogo,
                country: match.country,
            });
        } else {
            setFormData({
                id: generateMatchId(),
                league: '',
                homeTeam: '',
                awayTeam: '',
                timestamp: new Date().toISOString().slice(0, 16),
                status: 'Scheduled',
                score: '0-0',
                matchType: 'unassigned',
                odds: { home: '1.85', away: '2.10', draw: '3.40' },
            });
            setAiContext('');
            setAiSuggestion(null);
        }
    }, [match, mode, isOpen]);

    const fetchLeagues = async () => {
        setLoadingLeagues(true);
        try {
            const res = await fetch('/api/admin/leagues');
            const data = await res.json();
            if (Array.isArray(data)) {
                setLeagues(data);
            }
        } catch (e) {
            console.error('Failed to fetch leagues:', e);
        }
        setLoadingLeagues(false);
    };

    const handleAiSuggest = async () => {
        if (!aiContext.trim()) return;
        setIsAiLoading(true);
        try {
            const res = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'suggest', context: aiContext, useWebSearch }),
            });
            const data = await res.json();
            if (data.success) {
                setAiSuggestion(data.suggestions);
                // Apply suggestions to form
                if (data.suggestions.homeTeam) {
                    setFormData(prev => ({ ...prev, homeTeam: data.suggestions.homeTeam }));
                }
                if (data.suggestions.awayTeam) {
                    setFormData(prev => ({ ...prev, awayTeam: data.suggestions.awayTeam }));
                }
                if (data.suggestions.league) {
                    const matchedLeague = leagues.find(l => 
                        l.name.toLowerCase().includes(data.suggestions.league.toLowerCase())
                    );
                    if (matchedLeague) {
                        setFormData(prev => ({ 
                            ...prev, 
                            league: matchedLeague.name,
                            country: matchedLeague.country 
                        }));
                    }
                }
                if (data.suggestions.suggestedOdds) {
                    setFormData(prev => ({ 
                        ...prev, 
                        odds: data.suggestions.suggestedOdds 
                    }));
                }
            }
        } catch (e) {
            console.error('AI suggestion failed:', e);
        }
        setIsAiLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const formattedData = {
            ...formData,
            timestamp: formData.timestamp + ':00',
        };
        
        await onSubmit(formattedData);
        setIsSubmitting(false);
    };

    const handleChange = (field: keyof MatchData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOddsChange = (field: 'home' | 'away' | 'draw', value: string) => {
        setFormData(prev => ({
            ...prev,
            odds: { ...prev.odds, [field]: value } as any
        }));
    };

    const handleLeagueSelect = (league: LeagueInfo) => {
        setFormData(prev => ({
            ...prev,
            league: league.name,
            country: league.country,
            leagueLogo: league.logo,
        }));
        setShowLeagueDropdown(false);
    };

    const selectedLeague = leagues.find(l => l.name === formData.league);

    const matchTypes = [
        { value: 'unassigned', label: 'Unassigned', icon: Filter, color: 'bg-zinc-500' },
        { value: 'free', label: 'Free', icon: Star, color: 'bg-blue-500' },
        { value: 'paid', label: 'Paid', icon: DollarSign, color: 'bg-orange-500' },
        { value: 'vip', label: 'VIP', icon: Crown, color: 'bg-purple-500' },
    ];

    const statuses = ['Scheduled', 'Live', 'Halftime', 'Finished', 'Postponed', 'Cancelled'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Add New Match' : 'Edit Match'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* AI Assistance Panel */}
                {mode === 'create' && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <button
                            type="button"
                            onClick={() => setShowAiPanel(!showAiPanel)}
                            className="flex items-center gap-2 w-full text-left"
                        >
                            <Sparkles size={18} className="text-purple-600" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">AI Assist</span>
                            <span className="text-xs text-zinc-500 ml-auto">
                                {showAiPanel ? 'Hide' : 'Show'}
                            </span>
                        </button>
                        
                        {showAiPanel && (
                            <div className="mt-3 space-y-3">
                                <p className="text-xs text-zinc-500">
                                    Describe the match in natural language (e.g., &quot;Manchester United vs Liverpool in Premier League this Saturday&quot;)
                                </p>
                                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useWebSearch}
                                        onChange={(e) => setUseWebSearch(e.target.checked)}
                                        className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Use web search for better accuracy (slower)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={aiContext}
                                        onChange={(e) => setAiContext(e.target.value)}
                                        placeholder="Describe the match..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAiSuggest}
                                        disabled={isAiLoading || !aiContext.trim()}
                                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {isAiLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Wand2 size={16} />
                                        )}
                                        <span className="hidden sm:inline">Auto-fill</span>
                                    </button>
                                </div>
                                
                                {aiSuggestion && (
                                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
                                        <p className="text-xs font-medium text-zinc-500 mb-2">AI Suggestions Applied:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {aiSuggestion.homeTeam && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                    Home: {aiSuggestion.homeTeam}
                                                </span>
                                            )}
                                            {aiSuggestion.awayTeam && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                    Away: {aiSuggestion.awayTeam}
                                                </span>
                                            )}
                                            {aiSuggestion.prediction && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                                    Prediction: {aiSuggestion.prediction} ({aiSuggestion.confidence}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Match Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Match Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {matchTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => handleChange('matchType', type.value)}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                                    formData.matchType === type.value
                                        ? `border-${type.color.replace('bg-', '')} ${type.color} text-white`
                                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                )}
                            >
                                <type.icon size={18} />
                                <span className="text-xs font-semibold">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* League Dropdown */}
                <div className="relative">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        <Trophy size={14} className="inline mr-1" />
                        League *
                    </label>
                    
                    {leagues.length === 0 && !loadingLeagues ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">No leagues available</p>
                                    <p className="text-xs mt-1">Please <a href="/leagues" className="underline font-semibold">add a league</a> first before creating matches.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
                                className={cn(
                                    "w-full px-3 py-2.5 rounded-lg border text-left flex items-center justify-between transition-colors",
                                    showLeagueDropdown 
                                        ? "border-blue-500 ring-2 ring-blue-500/20" 
                                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
                                    "bg-white dark:bg-zinc-800 text-sm"
                                )}
                            >
                                <span className={formData.league ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}>
                                    {formData.league || 'Select a league...'}
                                </span>
                                <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showLeagueDropdown && "rotate-180")} />
                            </button>
                            
                            {showLeagueDropdown && (
                                <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
                                    {loadingLeagues ? (
                                        <div className="p-4 text-center text-sm text-zinc-500">Loading leagues...</div>
                                    ) : (
                                        <>
                                            <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
                                                Select League
                                            </div>
                                            {leagues.map((league) => (
                                                <button
                                                    key={league.id}
                                                    type="button"
                                                    onClick={() => handleLeagueSelect(league)}
                                                    className={cn(
                                                        "w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors",
                                                        formData.league === league.name && "bg-blue-50 dark:bg-blue-900/20"
                                                    )}
                                                >
                                                    <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500">
                                                        {league.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{league.name}</p>
                                                        <p className="text-xs text-zinc-500">{league.country}</p>
                                                    </div>
                                                    {formData.league === league.name && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                            
                            {showLeagueDropdown && (
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowLeagueDropdown(false)}
                                />
                            )}
                        </>
                    )}
                    
                    {selectedLeague && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                            <MapPin size={12} />
                            <span>{selectedLeague.country}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="capitalize">{selectedLeague.type}</span>
                        </div>
                    )}
                </div>

                {/* Teams */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            <Users size={14} className="inline mr-1" />
                            Home Team *
                        </label>
                        <input
                            type="text"
                            value={formData.homeTeam}
                            onChange={(e) => handleChange('homeTeam', e.target.value)}
                            placeholder="Home Team"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            <Users size={14} className="inline mr-1" />
                            Away Team *
                        </label>
                        <input
                            type="text"
                            value={formData.awayTeam}
                            onChange={(e) => handleChange('awayTeam', e.target.value)}
                            placeholder="Away Team"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            required
                        />
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            <Calendar size={14} className="inline mr-1" />
                            Date & Time *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.timestamp}
                            onChange={(e) => handleChange('timestamp', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            <Clock size={14} className="inline mr-1" />
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                        >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Score (if not Scheduled) */}
                {formData.status !== 'Scheduled' && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Current Score
                        </label>
                        <input
                            type="text"
                            value={formData.score}
                            onChange={(e) => handleChange('score', e.target.value)}
                            placeholder="e.g., 2-1"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                        />
                    </div>
                )}

                {/* Odds */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        <DollarSign size={14} className="inline mr-1" />
                        Odds
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-zinc-500">Home</label>
                            <input
                                type="text"
                                value={formData.odds?.home}
                                onChange={(e) => handleOddsChange('home', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500">Draw</label>
                            <input
                                type="text"
                                value={formData.odds?.draw}
                                onChange={(e) => handleOddsChange('draw', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500">Away</label>
                            <input
                                type="text"
                                value={formData.odds?.away}
                                onChange={(e) => handleOddsChange('away', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    {mode === 'edit' && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors"
                        >
                            Delete
                        </button>
                    )}
                    <div className="flex-1"></div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.league || leagues.length === 0}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Match' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
