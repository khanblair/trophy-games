'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Search, ChevronRight, Globe, Filter, Loader2 } from 'lucide-react';
import { LeagueInfo, MatchData } from '@/lib/scraper/parsers';
import { LeagueDetailModal } from '@/components/LeagueDetailModal';
import { cn } from '@/lib/utils';

export default function LeaguesPage() {
    const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);

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
                const [leaguesRes, matchesRes] = await Promise.all([
                    fetch('/api/leagues'),
                    fetch('/api/matches')
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
        fetchData();
    }, []);

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

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Leagues</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Manage and explore all scraped competitions from the Goaloo database.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search league or country..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        />
                    </div>

                    <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm font-medium"
                    >
                        <option value="All">All Countries</option>
                        {uniqueCountries.map(c => <option key={c} value={c!}>{c!}</option>)}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'matchCount')}
                        className="px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm font-medium"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="matchCount">Sort by Match Count</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    {(['All', 'league', 'cup'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                                typeFilter === t
                                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            {t}
                        </button>
                    ))}
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
                    {filteredAndSortedLeagues.map((league, i) => (
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
                            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                <span className="text-xs text-zinc-400">Last Scraped: 2h ago</span>
                                <button className="text-blue-600 dark:text-blue-500 group-hover:translate-x-1 transition-transform">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <LeagueDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                league={selectedLeague}
                matches={matches}
            />
        </div>
    );
}


