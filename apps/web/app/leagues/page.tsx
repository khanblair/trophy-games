'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Search, ChevronRight, Globe, Loader2, Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { leagueTier, rankOrInfinity } from '@/lib/trending';

interface League {
    id: number;
    name: string;
    country: string;
    type: 'league' | 'cup';
    logo?: string;
    matchCount?: number;
}

export default function LeaguesPage() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'league' | 'cup'>('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'matchCount'>('name');

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

    useEffect(() => {
        fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

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

    // Match-type counts per league (from the Convex overlay merged into matches)
    const getLeagueMatchCounts = (leagueName: string) => {
        const leagueMatches = matches.filter(m => m.league === leagueName);
        return {
            total: leagueMatches.length,
            free: leagueMatches.filter(m => m.matchType === 'free').length,
            paid: leagueMatches.filter(m => m.matchType === 'paid').length,
            vip: leagueMatches.filter(m => m.matchType === 'vip').length,
        };
    };

    // Categorise into importance tiers so the leagues people care about show first.
    const byRank = (a: League, b: League) => rankOrInfinity(a.name, a.country) - rankOrInfinity(b.name, b.country);
    const topLeagues = filteredAndSortedLeagues.filter(l => leagueTier(l.name, l.country) === 1).sort(byRank);
    const popularLeagues = filteredAndSortedLeagues.filter(l => leagueTier(l.name, l.country) === 2).sort(byRank);
    const otherLeagues = filteredAndSortedLeagues.filter(l => leagueTier(l.name, l.country) === null);

    const renderLeagueCard = (league: League, i: number) => {
        const counts = getLeagueMatchCounts(league.name);
        return (
            <Link
                key={`${league.id}-${league.name}-${i}`}
                href={`/matches?league=${encodeURIComponent(league.name)}`}
                className="group block p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-500/50 hover:shadow-lg transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/50"
            >
                <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500 overflow-hidden">
                        {league.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={league.logo} alt={league.name} className="h-full w-full object-contain" />
                        ) : (
                            <Trophy size={20} />
                        )}
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
                <div className="mt-4 flex items-center gap-2 flex-wrap">
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
                    <span className="text-xs text-zinc-400">{league.matchCount ?? counts.total} matches</span>
                    <ChevronRight size={18} className="text-blue-600 dark:text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        );
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Leagues</h1>
                <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">Live leagues from the data feed — the same competitions shown in the mobile app.</p>
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
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'All' | 'league' | 'cup')}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
                    >
                        <option value="All">All Types</option>
                        <option value="league">Leagues</option>
                        <option value="cup">Cups</option>
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
                            {leagues.length === 0 ? 'No leagues available' : 'No matching leagues'}
                        </p>
                        <p className="text-sm max-w-[280px] mx-auto text-zinc-500">
                            {leagues.length === 0
                                ? 'There are no leagues in the data feed right now.'
                                : 'Adjust your filters to find different competitions.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {topLeagues.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Flame size={18} className="text-orange-500" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Top Competitions</h2>
                                <span className="text-xs text-zinc-400">{topLeagues.length}</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {topLeagues.map((l, i) => renderLeagueCard(l, i))}
                            </div>
                        </section>
                    )}

                    {popularLeagues.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-blue-500" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Popular Leagues</h2>
                                <span className="text-xs text-zinc-400">{popularLeagues.length}</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {popularLeagues.map((l, i) => renderLeagueCard(l, i))}
                            </div>
                        </section>
                    )}

                    {otherLeagues.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Globe size={18} className="text-zinc-400" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">All Other Leagues</h2>
                                <span className="text-xs text-zinc-400">{otherLeagues.length}</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {otherLeagues.map((l, i) => renderLeagueCard(l, i))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
