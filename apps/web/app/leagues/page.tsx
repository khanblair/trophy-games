'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Search, ChevronRight, Globe, Filter, Loader2, Star, TrendingUp, Zap, Radio } from 'lucide-react';
import { LeagueInfo, MatchData } from '@/lib/scraper/parsers';
import { LeagueDetailModal } from '@/components/LeagueDetailModal';
import { cn } from '@/lib/utils';

export default function LeaguesPage() {
    const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingOdds, setSyncingOdds] = useState(false);
    const [syncingLive, setSyncingLive] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{oddsMatches: number; liveMatches: number; lastSync: string} | null>(null);

    // Filter State
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'league' | 'cup'>('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'matchCount'>('name');

    // Selection state
    const [selectedLeague, setSelectedLeague] = useState<LeagueInfo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leaguesRes, matchesRes, syncRes] = await Promise.all([
                    fetch('/api/leagues'),
                    fetch('/api/matches'),
                    fetch('/api/sync')
                ]);

                const leaguesData = await leaguesRes.json();
                const matchesData = await matchesRes.json();
                const syncData = await syncRes.json();

                if (Array.isArray(leaguesData)) setLeagues(leaguesData);
                if (Array.isArray(matchesData)) setMatches(matchesData);
                setSyncStatus({
                    oddsMatches: syncData.oddsMatchesCount || 0,
                    liveMatches: syncData.liveMatchesCount || 0,
                    lastSync: syncData.lastOddsSync || 'Never'
                });
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchMatches = async () => {
        try {
            const [matchesRes, syncRes] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/sync')
            ]);
            setMatches(await matchesRes.json());
            const syncData = await syncRes.json();
            setSyncStatus({
                oddsMatches: syncData.oddsMatchesCount || 0,
                liveMatches: syncData.liveMatchesCount || 0,
                lastSync: syncData.lastOddsSync || 'Never'
            });
        } catch (error) {
            console.error('Failed to fetch matches:', error);
        }
    };

    const handleSyncOdds = async () => {
        setSyncingOdds(true);
        console.log('[Leagues] Starting Odds API sync...');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_odds' })
            });
            const data = await res.json();
            console.log('[Leagues] Odds sync response:', data);
            
            setTimeout(async () => {
                const [leaguesRes, matchesRes, syncRes] = await Promise.all([
                    fetch('/api/leagues'),
                    fetch('/api/matches'),
                    fetch('/api/sync')
                ]);
                setLeagues(await leaguesRes.json());
                setMatches(await matchesRes.json());
                const syncData = await syncRes.json();
                setSyncStatus({
                    oddsMatches: syncData.oddsMatchesCount || 0,
                    liveMatches: syncData.liveMatchesCount || 0,
                    lastSync: syncData.lastOddsSync || 'Never'
                });
                setSyncingOdds(false);
                console.log('[Leagues] Odds sync completed!');
            }, 3000);
        } catch (e) {
            console.error('[Leagues] Odds sync failed:', e);
            setSyncingOdds(false);
        }
    };

    const handleSyncLive = async () => {
        setSyncingLive(true);
        console.log('[Leagues] Starting Live sync...');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_live' })
            });
            const data = await res.json();
            console.log('[Leagues] Live sync response:', data);
            
            setTimeout(async () => {
                const [, matchesRes, syncRes] = await Promise.all([
                    fetch('/api/leagues'),
                    fetch('/api/matches'),
                    fetch('/api/sync')
                ]);
                setMatches(await matchesRes.json());
                const syncData = await syncRes.json();
                setSyncStatus({
                    oddsMatches: syncData.oddsMatchesCount || 0,
                    liveMatches: syncData.liveMatchesCount || 0,
                    lastSync: syncData.lastOddsSync || 'Never'
                });
                setSyncingLive(false);
                console.log('[Leagues] Live sync completed!');
            }, 3000);
        } catch (e) {
            console.error('[Leagues] Live sync failed:', e);
            setSyncingLive(false);
        }
    };

    const handleOpenModal = (league: LeagueInfo) => {
        setSelectedLeague(league);
        setIsModalOpen(true);
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

    // Get match counts by type
    const matchTypeCounts = {
        free: matches.filter(m => !m.matchType || m.matchType === 'free').length,
        paid: matches.filter(m => m.matchType === 'paid').length,
        vip: matches.filter(m => m.matchType === 'vip').length,
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Leagues</h1>
                    <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">Manage tracked competitions.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleSyncOdds}
                        disabled={syncingOdds}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                    >
                        {syncingOdds ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        <span className="hidden sm:inline">{syncingOdds ? 'Syncing...' : 'Odds'}</span>
                    </button>
                    <button
                        onClick={handleSyncLive}
                        disabled={syncingLive}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                    >
                        {syncingLive ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                        <span className="hidden sm:inline">{syncingLive ? 'Syncing...' : 'Live'}</span>
                    </button>
                </div>
            </div>

            {/* Sync Status */}
            {syncStatus && (
                <div className="bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-xl p-3 md:p-4 border border-green-400/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                        <div className="flex flex-wrap gap-3">
                            <span className="text-green-600 font-medium text-sm">📊 {syncStatus.oddsMatches}</span>
                            <span className="text-red-600 font-medium text-sm">⚽ {syncStatus.liveMatches}</span>
                        </div>
                        <span className="text-zinc-500 text-xs">{syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}</span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900/50 p-3 md:p-4 rounded-xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
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
                        <option value="name">Name</option>
                        <option value="matchCount">Matches</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-sm font-medium">Fetching leagues from database...</p>
                </div>
            ) : filteredAndSortedLeagues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Filter size={32} className="text-zinc-300" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No matching leagues</p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">Adjust your filters to discover different competitions.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedLeagues.map((league, i) => {
                        const leagueMatches = matches.filter(m => m.league === league.name);
                        const trendingCount = leagueMatches.filter(m => m.isTrending).length;
                        const matchTypeCounts = {
                            free: leagueMatches.filter(m => !m.matchType || m.matchType === 'free').length,
                            paid: leagueMatches.filter(m => m.matchType === 'paid').length,
                            vip: leagueMatches.filter(m => m.matchType === 'vip').length,
                        };

                        return (
                            <div
                                key={`${league.id}-${league.name}-${i}`}
                                className="group p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/50"
                                onClick={() => handleOpenModal(league)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500">
                                        <Trophy size={20} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                                        league.type === 'cup' ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"
                                    )}>
                                        {league.type}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{league.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                                        <Globe size={12} />
                                        <span>{league.country || 'International'}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    {trendingCount > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                                            <Star size={10} /> {trendingCount} trending
                                        </span>
                                    )}
                                    {matchTypeCounts.vip > 0 && (
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                            ★ {matchTypeCounts.vip} VIP
                                        </span>
                                    )}
                                    {matchTypeCounts.paid > 0 && (
                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                            $ {matchTypeCounts.paid}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                    <span className="text-xs text-zinc-400">{league.matchCount || 0} matches</span>
                                    <button className="text-blue-600 dark:text-blue-500 group-hover:translate-x-1 transition-transform">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            <LeagueDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                league={selectedLeague}
                matches={matches}
                onRefreshData={fetchMatches}
            />
        </div>
    );
}
