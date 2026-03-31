'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Search, ChevronRight, Globe, Filter, Loader2, Star, Plus, X, Sparkles, Wand2, Cpu } from 'lucide-react';
import { LeagueInfo } from '@trophy-games/shared';
import { ModelSelector } from '@/components/ModelSelector';
import { cn } from '@/lib/utils';
import { DEFAULT_MODEL, AIModel } from '@/app/constants/models';

interface LeagueFormData {
    name: string;
    country: string;
    type: 'league' | 'cup';
    logo?: string;
}

export default function LeaguesPage() {
    const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'league' | 'cup'>('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'matchCount'>('name');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<LeagueFormData>({
        name: '',
        country: '',
        type: 'league',
        logo: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI assistance states
    const [aiContext, setAiContext] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
    const [aiMetadata, setAiMetadata] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leaguesRes, matchesRes] = await Promise.all([
                fetch('/api/admin/leagues'),
                fetch('/api/admin/matches')
            ]);

            const leaguesData = await leaguesRes.json();
            const matchesData = await matchesRes.json();

            if (Array.isArray(leaguesData)) setLeagues(leaguesData);
            if (Array.isArray(matchesData)) setMatches(matchesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeague = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/leagues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ league: formData })
            });
            
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ name: '', country: '', type: 'league', logo: '' });
                await fetchData();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create league');
            }
        } catch (e) {
            console.error('Failed to create league:', e);
            alert('Failed to create league');
        }
        setIsSubmitting(false);
    };

    const handleAiSuggest = async () => {
        if (!aiContext.trim()) return;
        setIsAiLoading(true);
        setAiMetadata(null);
        try {
            const res = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'suggest-league', 
                    context: aiContext,
                    modelId: selectedModel.id 
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAiSuggestion(data.suggestions);
                if (data.metadata) {
                    setAiMetadata(data.metadata);
                }
                // Apply suggestions to form
                if (data.suggestions.name) {
                    setFormData(prev => ({ ...prev, name: data.suggestions.name }));
                }
                if (data.suggestions.country) {
                    setFormData(prev => ({ ...prev, country: data.suggestions.country }));
                }
                if (data.suggestions.type) {
                    setFormData(prev => ({ ...prev, type: data.suggestions.type }));
                }
                if (data.suggestions.logo) {
                    setFormData(prev => ({ ...prev, logo: data.suggestions.logo }));
                }
            }
        } catch (e) {
            console.error('AI suggestion failed:', e);
        }
        setIsAiLoading(false);
    };

    const handleDeleteLeague = async (leagueId: number) => {
        if (!confirm('Are you sure you want to delete this league?')) return;
        
        try {
            const res = await fetch(`/api/admin/leagues?id=${leagueId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                await fetchData();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete league');
            }
        } catch (e) {
            console.error('Failed to delete league:', e);
        }
    };

    const uniqueCountries = Array.from(new Set(leagues.map(l => l.country).filter(Boolean))).sort();

    const filteredAndSortedLeagues = leagues
        .filter(l => {
            const matchesSearch =
                l.name.toLowerCase().includes(search.toLowerCase()) ||
                l.country?.toLowerCase().includes(search.toLowerCase());

            const matchesType = typeFilter === 'All' || l.type === typeFilter;
            const matchesCountry = countryFilter === 'All' || l.country === countryFilter;

            return matchesSearch && matchesType && matchesCountry;
        })
        .sort((a, b) => {
            if (sortBy === 'matchCount') return (b.matchCount || 0) - (a.matchCount || 0);
            return a.name.localeCompare(b.name);
        });

    // Calculate match counts for each league
    const getLeagueMatchCounts = (leagueName: string) => {
        const leagueMatches = matches.filter(m => m.league === leagueName);
        return {
            total: leagueMatches.length,
            free: leagueMatches.filter(m => !m.matchType || m.matchType === 'free').length,
            paid: leagueMatches.filter(m => m.matchType === 'paid').length,
            vip: leagueMatches.filter(m => m.matchType === 'vip').length,
        };
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Leagues</h1>
                    <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">Manage leagues for match assignments.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                    <Plus size={16} />
                    Add League
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900/50 p-3 md:p-4 rounded-xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search leagues..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                    >
                        <option value="All">All Countries</option>
                        {uniqueCountries.map(c => <option key={c} value={c!}>{c!}</option>)}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'matchCount')}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="matchCount">Sort by Matches</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-sm font-medium">Loading leagues...</p>
                </div>
            ) : filteredAndSortedLeagues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Trophy size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {leagues.length === 0 ? 'No leagues yet' : 'No matching leagues'}
                        </p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">
                            {leagues.length === 0 
                                ? 'Create your first league to start adding matches.' 
                                : 'Adjust your filters to find different competitions.'}
                        </p>
                    </div>
                    {leagues.length === 0 && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                        >
                            <Plus size={18} />
                            Add First League
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedLeagues.map((league, i) => {
                        const counts = getLeagueMatchCounts(league.name);

                        return (
                            <div
                                key={`${league.id}-${league.name}-${i}`}
                                className="group p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500/50 hover:shadow-lg transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/50"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500">
                                        <Trophy size={20} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                                            league.type === 'cup' ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"
                                        )}>
                                            {league.type}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteLeague(league.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Delete league"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{league.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                                        <Globe size={12} />
                                        <span>{league.country || 'International'}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    {counts.vip > 0 && (
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                            ★ {counts.vip} VIP
                                        </span>
                                    )}
                                    {counts.paid > 0 && (
                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                            $ {counts.paid}
                                        </span>
                                    )}
                                    {counts.free > 0 && (
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {counts.free} Free
                                        </span>
                                    )}
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                    <span className="text-xs text-zinc-400">{counts.total} matches</span>
                                    <Link 
                                        href="/matches"
                                        className="text-blue-600 dark:text-blue-500 hover:translate-x-1 transition-transform"
                                    >
                                        <ChevronRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add League Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Add New League</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateLeague} className="p-4 space-y-4">
                            {/* AI Assistance Panel */}
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
                                            Describe the league in natural language (e.g., &quot;English Premier League&quot;, &quot;UEFA Champions League&quot;, &quot;Bundesliga in Germany&quot;)
                                        </p>
                                        
                                        {/* Model Selector */}
                                        <ModelSelector
                                            selectedModel={selectedModel}
                                            onModelChange={setSelectedModel}
                                            disabled={isAiLoading}
                                        />
                                        
                                        {/* Failover indicator */}
                                        {aiMetadata && aiMetadata.attempts > 1 && (
                                            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                                <Cpu size={14} />
                                                <span>
                                                    Auto-switched to {aiMetadata.usedModel.name} after {aiMetadata.attempts - 1} failed attempt(s)
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={aiContext}
                                                onChange={(e) => setAiContext(e.target.value)}
                                                placeholder="Describe the league..."
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
                                                    {aiSuggestion.name && (
                                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                            Name: {aiSuggestion.name}
                                                        </span>
                                                    )}
                                                    {aiSuggestion.country && (
                                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                                            Country: {aiSuggestion.country}
                                                        </span>
                                                    )}
                                                    {aiSuggestion.type && (
                                                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                                            Type: {aiSuggestion.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    League Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., English Premier League"
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    placeholder="e.g., England"
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Type
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'league' })}
                                        className={cn(
                                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            formData.type === 'league'
                                                ? "bg-blue-600 text-white"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        League
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'cup' })}
                                        className={cn(
                                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            formData.type === 'cup'
                                                ? "bg-purple-600 text-white"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        Cup
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Logo URL (optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.logo}
                                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create League'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
