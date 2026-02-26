
import React from 'react';
import { ScrapedData } from '@/lib/storage'; // Import type
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

// Server Component for Analytics
async function getAnalyticsData() {
    const { loadData } = await import('@/lib/storage');
    return loadData();
}

export default async function AnalyticsPage() {
    const data: ScrapedData = await getAnalyticsData();
    const matches = data.matches;

    // Calculate Stats
    const totalMatches = matches.length;
    const finishedMatches = matches.filter(m => m.status === 'Finished' || (m.homeScore !== undefined)).length;

    // Win/Draw/Loss
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalGoals = 0;

    matches.forEach(m => {
        if (m.homeScore !== undefined && m.awayScore !== undefined) {
            totalGoals += m.homeScore + m.awayScore;
            if (m.homeScore > m.awayScore) homeWins++;
            else if (m.awayScore > m.homeScore) awayWins++;
            else draws++;
        }
    });

    const avgGoals = finishedMatches > 0 ? (totalGoals / finishedMatches).toFixed(2) : '0.00';
    const homeWinRate = finishedMatches > 0 ? ((homeWins / finishedMatches) * 100).toFixed(1) : '0';
    const awayWinRate = finishedMatches > 0 ? ((awayWins / finishedMatches) * 100).toFixed(1) : '0';
    const drawRate = finishedMatches > 0 ? ((draws / finishedMatches) * 100).toFixed(1) : '0';

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Analytics Overview
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
                    Performance insights and statistical breakdown of scanned matches.
                </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Scanned"
                    value={totalMatches.toString()}
                    icon={Activity}
                    trend="All Time"
                />
                <StatCard
                    title="Matches Finished"
                    value={finishedMatches.toString()}
                    icon={TrendingUp}
                    trend={`${((finishedMatches / (totalMatches || 1)) * 100).toFixed(0)}% Completion`}
                />
                <StatCard
                    title="Avg Goals / Match"
                    value={avgGoals}
                    icon={BarChart3}
                    trend="Scoring Rate"
                />
                <StatCard
                    title="Home Win Rate"
                    value={`${homeWinRate}%`}
                    icon={PieChart}
                    trend={`Away: ${awayWinRate}%`}
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
                                <span className="font-medium dark:text-zinc-200">{homeWins} ({homeWinRate}%)</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${homeWinRate}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Away Wins</span>
                                <span className="font-medium dark:text-zinc-200">{awayWins} ({awayWinRate}%)</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${awayWinRate}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Draws</span>
                                <span className="font-medium dark:text-zinc-200">{draws} ({drawRate}%)</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${drawRate}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-6 space-y-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Activity size={18} className="text-purple-600" />
                        Data Health
                    </h3>
                    <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <p>Total data points analyzed: <span className="font-bold text-zinc-900 dark:text-zinc-50">{data.matches.length + data.leagues.length}</span></p>
                        <p>Leagues tracked: <span className="font-bold text-zinc-900 dark:text-zinc-50">{data.leagues.length}</span></p>
                        <p>Last updated: <span className="font-bold text-zinc-900 dark:text-zinc-50">{data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Never'}</span></p>
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
