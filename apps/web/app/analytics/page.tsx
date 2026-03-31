'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Loader2 } from 'lucide-react';

interface AnalyticsData {
    totalMatches: number;
    finishedMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    totalGoals: number;
    avgGoals: string;
    homeWinRate: string;
    awayWinRate: string;
    drawRate: string;
    loading: boolean;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData>({
        totalMatches: 0,
        finishedMatches: 0,
        homeWins: 0,
        awayWins: 0,
        draws: 0,
        totalGoals: 0,
        avgGoals: '0.00',
        homeWinRate: '0',
        awayWinRate: '0',
        drawRate: '0',
        loading: true,
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/matches');
            const matches = await res.json();

            const totalMatches = matches.length;
            const finishedMatches = matches.filter((m: any) => 
                m.status === 'Finished' || m.status === 'FT' || m.isHistory
            ).length;

            let homeWins = 0;
            let awayWins = 0;
            let draws = 0;
            let totalGoals = 0;

            matches.forEach((m: any) => {
                if (m.homeScore !== undefined && m.awayScore !== undefined) {
                    totalGoals += (m.homeScore || 0) + (m.awayScore || 0);
                    if (m.homeScore > m.awayScore) homeWins++;
                    else if (m.awayScore > m.homeScore) awayWins++;
                    else draws++;
                }
            });

            const avgGoals = finishedMatches > 0 ? (totalGoals / finishedMatches).toFixed(2) : '0.00';
            const homeWinRate = finishedMatches > 0 ? ((homeWins / finishedMatches) * 100).toFixed(1) : '0';
            const awayWinRate = finishedMatches > 0 ? ((awayWins / finishedMatches) * 100).toFixed(1) : '0';
            const drawRate = finishedMatches > 0 ? ((draws / finishedMatches) * 100).toFixed(1) : '0';

            setData({
                totalMatches,
                finishedMatches,
                homeWins,
                awayWins,
                draws,
                totalGoals,
                avgGoals,
                homeWinRate,
                awayWinRate,
                drawRate,
                loading: false,
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setData(prev => ({ ...prev, loading: false }));
        }
    };

    if (data.loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-zinc-500">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Analytics
                </h1>
                <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
                    Performance insights and statistical breakdown of all matches.
                </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    title="Total Matches"
                    value={data.totalMatches.toString()}
                    icon={Activity}
                    trend="All Time"
                />
                <StatCard
                    title="Matches Finished"
                    value={data.finishedMatches.toString()}
                    icon={TrendingUp}
                    trend={`${((data.finishedMatches / (data.totalMatches || 1)) * 100).toFixed(0)}% Completion`}
                />
                <StatCard
                    title="Avg Goals / Match"
                    value={data.avgGoals}
                    icon={BarChart3}
                    trend="Scoring Rate"
                />
                <StatCard
                    title="Home Win Rate"
                    value={`${data.homeWinRate}%`}
                    icon={PieChart}
                    trend={`Away: ${data.awayWinRate}%`}
                />
            </div>

            {/* Distribution Analysis */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-6 space-y-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <PieChart size={18} className="text-blue-600" />
                        Outcome Distribution
                    </h3>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Home Wins</span>
                                <span className="font-medium dark:text-zinc-200">{data.homeWins} ({data.homeWinRate}%)</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${data.homeWinRate}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Away Wins</span>
                                <span className="font-medium dark:text-zinc-200">{data.awayWins} ({data.awayWinRate}%)</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.awayWinRate}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Draws</span>
                                <span className="font-medium dark:text-zinc-200">{data.draws} ({data.drawRate}%)</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${data.drawRate}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-6 space-y-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Activity size={18} className="text-purple-600" />
                        Data Overview
                    </h3>
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500">Total Goals Scored</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">{data.totalGoals}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500">Finished Matches</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">{data.finishedMatches}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-500">Pending Matches</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">{data.totalMatches - data.finishedMatches}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-zinc-500">Total Data Points</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">{data.totalMatches}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: React.ElementType, trend: string }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-400">
                    <Icon size={24} />
                </div>
                <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-400">
                    {trend}
                </span>
            </div>
            <div className="mt-4 space-y-1">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
            </div>
        </div>
    );
}
