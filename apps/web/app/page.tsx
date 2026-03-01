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
  const [syncStatus, setSyncStatus] = React.useState<{ oddsMatches: number; liveMatches: number; lastOddsSync: string | null } | null>(null);

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
    if (syncing) return;

    setSyncing(true);
    console.log('[Dashboard] Starting full sync...');

    try {
      // 1. Kick off the sync
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all' })
      });

      if (!res.ok) throw new Error('Failed to start sync');

      // 2. Poll for status
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2s = 60s max polling

      const poll = async () => {
        const statusRes = await fetch('/api/sync');
        const data = await statusRes.json();
        console.log('[Dashboard] Sync status:', data.status);

        if (data.status === 'completed') {
          await fetchStats();
          setSyncing(false);
          console.log('[Dashboard] Sync completed successfully!');
          return;
        }

        if (data.status === 'failed') {
          console.error('[Dashboard] Sync failed:', data.error);
          setSyncing(false);
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          console.warn('[Dashboard] Sync polling timed out');
          setSyncing(false);
        }
      };

      setTimeout(poll, 1000);

    } catch (e) {
      console.error('[Dashboard] Sync failed to start:', e);
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Trophy Games <span className="text-blue-600">100%</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
            Real-time sports analytics with live match data and AI predictions.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors text-sm"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync All'}</span>
            <span className="sm:hidden">{syncing ? '...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="bg-gradient-to-r from-green-400/10 via-blue-500/10 to-red-500/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-green-400/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 md:gap-6">
              <span className="text-green-600 font-medium text-sm">📊 {syncStatus.oddsMatches} Odds</span>
              <span className="text-red-600 font-medium text-sm">⚽ {syncStatus.liveMatches} Live</span>
            </div>
            <span className="text-zinc-500 text-xs">{syncStatus.lastOddsSync ? new Date(syncStatus.lastOddsSync).toLocaleString() : 'Never'}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-zinc-200 bg-white p-4 md:p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-zinc-50 text-zinc-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-zinc-800 dark:text-zinc-400">
                <stat.icon size={18} className="md:size-24" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">{stat.name}</h3>
              <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Sources & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            Data Sources
          </h2>

          <div className="rounded-xl md:rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-3 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Target size={14} className="md:size-18 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">The Odds API</h4>
                    <p className="text-xs text-zinc-500 hidden sm:block">Pre-match odds</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>

              <div className="p-3 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Radio size={14} className="md:size-18 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">Goaloo Live</h4>
                    <p className="text-xs text-zinc-500 hidden sm:block">Live scores</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>

              <div className="p-3 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Zap size={14} className="md:size-18 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">AI Predictions</h4>
                    <p className="text-xs text-zinc-500 hidden sm:block">Groq powered</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <a
              href="/live"
              className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-red-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Radio size={18} />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">Live Matches</h4>
                <p className="text-xs text-zinc-500 hidden sm:block">Currently live</p>
              </div>
            </a>
            <a
              href="/matches"
              className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-left dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Target size={18} />
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-50 text-sm">All Matches</h4>
                <p className="text-xs text-zinc-500 hidden sm:block">Browse & predict</p>
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
