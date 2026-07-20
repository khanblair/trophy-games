'use client';

import React from 'react';
import {
  Trophy,
  Target,
  TrendingUp,
  Activity,
  Clock,
  RefreshCw,
  Swords,
  Users,
  Crown,
  DollarSign,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalMatches: number;
  totalLeagues: number;
  freeTips: number;
  paidTips: number;
  vipTips: number;
  winRate: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalMatches: 0,
    totalLeagues: 0,
    freeTips: 0,
    paidTips: 0,
    vipTips: 0,
    winRate: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();

      setStats({
        totalMatches: data.totalMatches || 0,
        totalLeagues: data.totalLeagues || 0,
        freeTips: data.freeTips || 0,
        paidTips: data.paidTips || 0,
        vipTips: data.vipTips || 0,
        winRate: data.winRate || 0,
        totalUsers: data.totalUsers || 0,
      });
      setLastUpdated(data.lastUpdated || null);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const statCards = [
    { 
      name: 'Total Matches', 
      value: stats.totalMatches.toString(), 
      icon: Swords, 
      trend: 'All Time',
      color: 'bg-blue-600'
    },
    { 
      name: 'Total Leagues', 
      value: stats.totalLeagues.toString(), 
      icon: Trophy, 
      trend: 'Tracked',
      color: 'bg-zinc-600'
    },
    { 
      name: 'Free Tips', 
      value: stats.freeTips.toString(), 
      icon: Star, 
      trend: 'Available',
      color: 'bg-brand-green'
    },
    { 
      name: 'Win Rate', 
      value: `${stats.winRate}%`, 
      icon: TrendingUp, 
      trend: 'Historical',
      color: 'bg-purple-600'
    },
    { 
      name: 'Total Users', 
      value: stats.totalUsers.toString(), 
      icon: Users, 
      trend: 'Registered',
      color: 'bg-indigo-600'
    },
  ];

  const matchTypeStats = [
    { label: 'Free', value: stats.freeTips, color: 'bg-blue-500', icon: Star },
    { label: 'Paid', value: stats.paidTips, color: 'bg-orange-500', icon: DollarSign },
    { label: 'VIP', value: stats.vipTips, color: 'bg-purple-500', icon: Crown },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted">
            Live match data with AI predictions and performance tracking.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-surface-secondary text-foreground border border-border-hairline font-bold rounded-xl transition-colors text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="bg-surface-secondary rounded-[20px] p-3 md:p-4 border border-border-hairline">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-brand-green" />
              <span className="text-muted">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </span>
            </div>
            <span className="text-muted text-xs">Data syncs automatically</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="group relative overflow-hidden rounded-[20px] border border-border-hairline bg-surface p-4 md:p-6 shadow-lg shadow-black/20 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl ${stat.color} text-white transition-colors`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs md:text-sm font-medium text-muted truncate uppercase tracking-widest">{stat.name}</h3>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Match Type Distribution & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Match Type Distribution */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-foreground flex items-center gap-2">
            <Activity size={18} className="text-brand-green" />
            Match Distribution
          </h2>

          <div className="rounded-[20px] border border-border-hairline bg-surface p-6 shadow-lg shadow-black/20">
            <div className="space-y-4">
              {matchTypeStats.map((type) => (
                <div key={type.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg ${type.color} flex items-center justify-center text-white`}>
                      <type.icon size={14} />
                    </div>
                    <span className="font-medium text-foreground">{type.label} Tips</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">{type.value}</span>
                    <div className="w-24 h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${type.color} rounded-full`}
                        style={{ width: `${stats.totalMatches > 0 ? (type.value / stats.totalMatches) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              href="/matches"
              className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-[20px] border border-border-hairline bg-surface hover:bg-surface-secondary shadow-lg shadow-black/20 hover:shadow-xl transition-all text-left group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Swords size={18} />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm uppercase tracking-wider">View Matches</h4>
                <p className="text-xs text-muted hidden sm:block">Browse & tag tips</p>
              </div>
            </Link>
            <Link
              href="/leagues"
              className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-[20px] border border-border-hairline bg-surface hover:bg-surface-secondary shadow-lg shadow-black/20 hover:shadow-xl transition-all text-left group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-zinc-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Trophy size={18} />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm uppercase tracking-wider">View Leagues</h4>
                <p className="text-xs text-muted hidden sm:block">Browse competitions</p>
              </div>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-[20px] border border-border-hairline bg-surface hover:bg-surface-secondary shadow-lg shadow-black/20 hover:shadow-xl transition-all text-left group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-brand-green flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Target size={18} />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm uppercase tracking-wider">Match History</h4>
                <p className="text-xs text-muted hidden sm:block">View completed results</p>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-[20px] border border-border-hairline bg-surface hover:bg-surface-secondary shadow-lg shadow-black/20 hover:shadow-xl transition-all text-left group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Users size={18} />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm uppercase tracking-wider">Manage Users</h4>
                <p className="text-xs text-muted hidden sm:block">Block, clear attempts</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
