'use client';

import React from 'react';
import {
  Trophy,
  Target,
  TrendingUp,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';


export default function DashboardPage() {
  const [task, setTask] = React.useState<{
    status: string;
    processedCount: number;
    totalCount: number;
  } | null>(null);

  const [stats, setStats] = React.useState([
    { name: 'Total Leagues', value: '1,284', icon: Trophy, trend: '+12' },
    { name: 'Matches Today', value: '42', icon: Target, trend: '+5' },
    { name: 'AI Confidence', value: '88%', icon: Zap, trend: '+2.4%' },
    { name: 'Success Rate', value: '74.2%', icon: TrendingUp, trend: '+1.1%' },
  ]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      // Update stats with real data
      setStats([
        { name: 'Total Leagues', value: data.totalLeagues?.toString() || '0', icon: Trophy, trend: 'Tracked' },
        { name: 'Total Matches', value: data.totalMatches?.toString() || '0', icon: Target, trend: 'Scanned' },
        { name: 'Matches Today', value: data.matchesToday?.toString() || '0', icon: Zap, trend: 'Live' },
        { name: 'Data Health', value: `${data.successRate}%` || '0%', icon: TrendingUp, trend: 'Valid Scores' },
      ]);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };


  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch('/api/scrape');
      const data = await res.json();
      setTask(data);
    } catch (e) {
      console.error('Failed to fetch scraper status', e);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
    fetchStats();
    const interval = setInterval(() => {
      fetchStatus();
      fetchStats(); // Poll stats too to see live updates
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleScrape = async (action: 'start' | 'live_scrape', limit?: number) => {
    try {
      await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          sitemapUrl: 'http://www.goaloo.com/sitemap.xml',
          limit
        })
      });
      fetchStatus();
    } catch (e) {
      console.error('Failed to start scrape', e);
    }
  };

  const isRunning = task?.status === 'running';

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Trophy Games <span className="text-blue-600">100%</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Advanced sports analytics and real-time scraping dashboard.
          Analyze market trends, extract odds, and get AI-powered predictions for thousands of global matches.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-400">
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-green-500/10">
                {stat.trend}
              </span>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.name}</h3>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Activity size={20} className={cn("text-blue-600", isRunning && "animate-pulse")} />
              Real-time Scraper Activity
            </h2>
            {isRunning && (
              <span className="flex items-center gap-2 text-xs font-bold text-blue-600 animate-pulse bg-blue-50 px-3 py-1.5 rounded-full dark:bg-blue-500/10">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                LIVE PROCESSING
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden min-h-[200px] flex items-center justify-center">
            {!task || task.status === 'idle' ? (
              <div className="p-12 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center dark:bg-zinc-800">
                  <Activity size={24} className="text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-zinc-900 font-medium dark:text-zinc-50">Scraper is Idle</h3>
                  <p className="text-sm text-zinc-500 max-w-[280px] mx-auto">
                    Start a new scraping job from the quick actions to see live updates.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 w-full space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">Processing Progress</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {task.processedCount} <span className="text-zinc-400 text-lg font-normal">/ {task.totalCount} URLs</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {Math.round((task.processedCount / (task.totalCount || 1)) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                    style={{ width: `${(task.processedCount / (task.totalCount || 1)) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="animate-spin" size={12} />
                  {task.status === 'running' ? 'Crawling sitemap and parsing match data...' : 'Finalizing batch...'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h2>
          <div className="grid gap-4">
            <button
              onClick={() => handleScrape('live_scrape')}
              disabled={isRunning}
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 group"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">Run Live Scrape</h4>
                <p className="text-xs text-zinc-500">Scan active matches from live data</p>
              </div>
            </button>
            <button
              onClick={() => handleScrape('start', 5)}
              disabled={isRunning}
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50 group"
            >
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Target size={20} />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">Test Small Batch</h4>
                <p className="text-xs text-zinc-500">Process 5 URLs for verification</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | null | boolean | number)[]) {
  return inputs.filter(Boolean).join(' ');
}
