
import React from 'react';
import { ScrapedData } from '@/lib/storage';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

async function getHistoryData() {
    // Dynamic import to avoid build issues if fs is used on client
    const { loadData } = await import('@/lib/storage');
    return loadData();
}

export default async function HistoryPage() {
    const data: ScrapedData = await getHistoryData();

    // Filter for finished matches or matches with scores
    // Based on our parser, status might be 'Finished' or score might be present
    const historyMatches = data.matches.filter(m =>
        m.status === 'Finished' ||
        (m.homeScore !== undefined && m.awayScore !== undefined)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Match History
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
                    Archive of past match results and outcomes.
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-medium">
                        <Calendar size={18} className="text-blue-600" />
                        Recent Results
                    </div>
                </div>

                {historyMatches.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                        No match history found. Run the scraper to populate data.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">League</th>
                                    <th className="px-6 py-4 text-right">Home</th>
                                    <th className="px-6 py-4 text-center">Score</th>
                                    <th className="px-6 py-4">Away</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {historyMatches.map((match) => (
                                    <tr key={match.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                            {format(new Date(match.timestamp), 'MMM d, HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                                            {match.league}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-50">
                                            {match.homeTeam}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-lg mx-2">
                                            {match.homeScore} - {match.awayScore}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                                            {match.awayTeam}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                                                {match.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
