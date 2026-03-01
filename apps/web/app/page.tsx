'use client';

import React from 'react';
import {
  Trophy,
  Target,
  TrendingUp,
  Activity,
  Zap,
  Radio,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';


export default function DashboardPage() {
  const [stats, setStats] = React.useState([
    { name: 'Total Leagues', value: '0', icon: Trophy, trend: 'Tracked' },
    { name: 'Pre-match Odds', value: '0', icon: Target, trend: 'From API' },
    { name: 'Live Matches', value: '0', icon: Radio, trend: 'Goaloo' },
    { name: 'Last Sync', value: 'Never', icon: Clock, trend: '' },
  ]);
  const [syncing, setSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{oddsMatches: number; liveMatches: number; lastOddsSync: string | null} | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      
      const syncRes = await fetch('/api/sync');
      const syncData = await syncRes.json();

      setSyncStatus({
        oddsMatches: syncData.oddsMatchesCount || 0,
        liveMatches: syncData.liveMatchesCount || 0,
        lastOddsSync: syncData.lastOddsSync
      });

      setStats([
        { name: 'Total Leagues', value: data.totalLeagues?.toString() || '0', icon: Trophy, trend: 'Tracked' },
        { name: 'Pre-match Odds', value: syncData.oddsMatchesCount?.toString() || '0', icon: Target, trend: 'The Odds API' },
        { name: 'Live Matches', value: syncData.liveMatchesCount?.toString() || '0', icon: Radio, trend: 'Goaloo Live' },
        { name: 'Last Sync', value: syncData.lastOddsSync ? new Date(syncData.lastOddsSync).toLocaleTimeString() : 'Never', icon: Clock, trend: '' },
      ]);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    console.log('[Dashboard] Starting full sync...');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all' })
      });
      const data = await res.json();
      console.log('[Dashboard] Sync response:', data);
      
      setTimeout(async () => {
        await fetchStats();
        setSyncing(false);
        console.log('[Dashboard] Sync completed!');
      }, 3000);
    } catch (e) {
      console.error('[Dashboard] Sync failed:', e);
      setSyncing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchStats();
  };

  React.useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Trophy Games <span className="text-blue-600">100%</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Real-time sports analytics with live match data from Goaloo and pre-match odds from The Odds API.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {syncing ? 'Syncing...' : 'Sync All Data'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="bg-gradient-to-r from-green-400/10 via-blue-500/10 to-red-500/10 rounded-2xl p-4 border border-green-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-green-600 font-medium">📊 Odds API: {syncStatus.oddsMatches} matches</span>
              <span className="text-red-600 font-medium">⚽ Live: {syncStatus.liveMatches} matches</span>
            </div>
            <span className="text-zinc-500 text-sm">Last sync: {syncStatus.lastOddsSync ? new Date(syncStatus.lastOddsSync).toLocaleString() : 'Never'}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-400">
                <stat.icon size={24} />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-green-500/10">
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.name}</h3>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            Data Sources
          </h2>

          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Target size={18} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-50">The Odds API</h4>
                    <p className="text-xs text-zinc-500">Pre-match odds for European leagues</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Radio size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-50">Goaloo Live</h4>
                    <p className="text-xs text-zinc-500">Live scores and in-play matches</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Zap size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-50">AI Predictions</h4>
                    <p className="text-xs text-zinc-500">Generated on-demand with Groq</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h2>
          <div className="grid gap-4">
            <a
              href="/live"
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 group"
            >
              <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Radio size={20} />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">View Live Matches</h4>
                <p className="text-xs text-zinc-500">See all currently live matches</p>
              </div>
            </a>
            <a
              href="/matches"
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 group"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Target size={20} />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50">Browse Matches</h4>
                <p className="text-xs text-zinc-500">View all matches with odds and predictions</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: (string | undefined | null | boolean | number)[]) {
  return inputs.filter(Boolean).join(' ');
}
