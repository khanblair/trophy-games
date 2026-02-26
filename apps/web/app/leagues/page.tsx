'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Search, ChevronRight, Globe, Filter, Loader2, Zap, Star, TrendingUp } from 'lucide-react';
import { LeagueInfo, MatchData } from '@/lib/scraper/parsers';
import { LeagueDetailModal } from '@/components/LeagueDetailModal';
import { cn } from '@/lib/utils';

export default function LeaguesPage() {
    const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [scrapeStatus, setScrapeStatus] = useState<any>(null);

    // Filter State
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'league' | 'cup'>('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'name' | 'matchCount'>('name');
    const [trendingLeagues, setTrendingLeagues] = useState<{url: string; name: string; country: string}[]>([]);

    // Selection state
    const [selectedLeague, setSelectedLeague] = useState<LeagueInfo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leaguesRes, matchesRes, scrapeRes] = await Promise.all([
                    fetch('/api/leagues'),
                    fetch('/api/matches'),
                    fetch('/api/scrape')
                ]);

                const leaguesData = await leaguesRes.json();
                const matchesData = await matchesRes.json();
                const scrapeData = await scrapeRes.json();

                if (Array.isArray(leaguesData)) setLeagues(leaguesData);
                if (Array.isArray(matchesData)) setMatches(matchesData);
                setScrapeStatus(scrapeData);
                setTrendingLeagues(scrapeData.trendingLeagues || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Poll scrape status
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/scrape');
                const data = await res.json();
                setScrapeStatus(data);
                if (data.status === 'completed' || data.status === 'failed') {
                    setScraping(false);
                    // Refresh data
                    const [leaguesRes, matchesRes] = await Promise.all([
                        fetch('/api/leagues'),
                        fetch('/api/matches')
                    ]);
                    setLeagues(await leaguesRes.json());
                    setMatches(await matchesRes.json());
                }
            } catch (e) {}
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleLiveScrape = async () => {
        setScraping(true);
        await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'live_scrape' })
        });
    };

    const handleTrendingScrape = async () => {
        setScraping(true);
        await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'scrape_trending' })
        });
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
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Leagues</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Manage and explore all scraped competitions from the Goaloo database.</p>
            </div>

            {/* Trending Leagues Section */}
            <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-3xl p-6 border border-yellow-400/20">
                {scrapeStatus?.isProduction ? (
                    <div className="text-center py-4">
                        <p className="text-orange-600 dark:text-orange-400 font-medium mb-2">
                            ⚠️ Scraping is disabled in production
                        </p>
                        <p className="text-sm text-zinc-500">
                            Run <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">bun run dev</code> locally to scrape data, then deploy. The data will be stored in Convex and available in production.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-400 rounded-xl">
                                    <TrendingUp size={20} className="text-black" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Trending Leagues</h2>
                                    <p className="text-xs text-zinc-500">Top leagues being tracked</p>
                                </div>
                            </div>
                            <button
                                onClick={handleTrendingScrape}
                                disabled={scraping}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {scraping ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                {scraping ? 'Scraping...' : 'Scrape Trending'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                            {trendingLeagues.map((league, i) => (
                                <div key={i} className="text-center p-2 bg-white/50 dark:bg-zinc-800/50 rounded-lg">
                                    <p className="text-xs font-bold truncate">{league.name}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Filters */}
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
            />
        </div>
    );
}
