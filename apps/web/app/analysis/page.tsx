'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Shield,
  Crown,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchRecommendation {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  timestamp: string;
  recommendedType: 'free' | 'paid' | 'vip';
  confidence: number;
  reasoning: string[];
  suggestedBet: string;
  keyStats: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
  _id: string;
  date: string;
  analysisType: 'daily' | 'weekly';
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  freeRecommendations: MatchRecommendation[];
  paidRecommendations: MatchRecommendation[];
  vipRecommendations: MatchRecommendation[];
  verificationNotes?: string[];
  removedMatches?: { matchId: string; reason: string }[];
  confidenceAdjustment?: number;
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  model: string;
}

const typeConfig = {
  free: { label: 'Free', color: 'bg-blue-500', icon: Star, bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-200 dark:border-blue-500/20', textColor: 'text-blue-600 dark:text-blue-400' },
  paid: { label: 'Paid', color: 'bg-orange-500', icon: TrendingUp, bgColor: 'bg-orange-50 dark:bg-orange-500/10', borderColor: 'border-orange-200 dark:border-orange-500/20', textColor: 'text-orange-600 dark:text-orange-400' },
  vip: { label: 'VIP', color: 'bg-purple-500', icon: Crown, bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-200 dark:border-purple-500/20', textColor: 'text-purple-600 dark:text-purple-400' },
};

const riskConfig = {
  low: { color: 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200' },
  medium: { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200' },
  high: { color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200' },
};

interface RecommendationCardProps {
  rec: MatchRecommendation;
  isSelected: boolean;
  onToggle: () => void;
}

function RecommendationCard({ rec, isSelected, onToggle }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[rec.recommendedType];
  const RiskIcon = rec.riskLevel === 'low' ? Shield : rec.riskLevel === 'medium' ? AlertTriangle : Zap;

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all relative",
      config.borderColor,
      isSelected ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900" : "",
      "bg-white dark:bg-zinc-900/50 hover:shadow-md"
    )}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute top-3 right-3 h-5 w-5 rounded border flex items-center justify-center transition-colors",
          isSelected
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "border-zinc-300 dark:border-zinc-600 hover:border-indigo-400"
        )}
      >
        {isSelected && <CheckCircle2 size={12} />}
      </button>

      <div className="flex items-start justify-between gap-3 pr-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white", config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-zinc-400">{rec.league}</span>
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
            {rec.homeTeam} vs {rec.awayTeam}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            {new Date(rec.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{rec.confidence}%</span>
            <span className="text-[10px] text-zinc-400">conf</span>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium border",
            riskConfig[rec.riskLevel].color
          )}>
            <RiskIcon size={10} className="inline mr-1" />
            {rec.riskLevel}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {rec.suggestedBet}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Less' : 'Details'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Reasoning</p>
            <ul className="space-y-1">
              {rec.reasoning.map((r, i) => (
                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-brand-green shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Key Stats</p>
            <div className="flex flex-wrap gap-1.5">
              {rec.keyStats.map((s, i) => (
                <span key={i} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [analysisType, setAnalysisType] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'free' | 'paid' | 'vip'>('free');
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/analysis/history');
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  }, []);

  const fetchResultForDate = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis?date=${selectedDate}`);
      const data = await res.json();
      if (data && data._id) {
        setResult(data);
      } else {
        setResult(null);
      }
    } catch (e) {
      console.error('Failed to fetch result:', e);
    }
  }, [selectedDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    fetchResultForDate();
  }, [fetchHistory, fetchResultForDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResultForDate();
  }, [fetchResultForDate]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);

    try {
      const res = await fetch('/api/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, analysisType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setSuccess(`Analysis complete! Free: ${data.freeCount}, Paid: ${data.paidCount}, VIP: ${data.vipCount}. Removed: ${data.removedCount}`);
      await fetchResultForDate();
      await fetchHistory();
    } catch (e: any) {
      setError(e.message || 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  const approveAll = async () => {
    if (!result) return;
    setApproving(true);
    setError(null);

    try {
      const res = await fetch('/api/analysis/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId: result._id,
          approveFree: true,
          approvePaid: true,
          approveVip: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      setSuccess(`Approved! ${data.applied} matches tagged.`);
      setSelectedMatches(new Set());
      await fetchResultForDate();
    } catch (e: any) {
      setError(e.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const applySelected = async () => {
    if (!result || selectedMatches.size === 0) return;
    setApproving(true);
    setError(null);

    try {
      const res = await fetch('/api/analysis/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId: result._id,
          selectedMatchIds: Array.from(selectedMatches),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      setSuccess(`Approved! ${data.applied} selected matches tagged.`);
      setSelectedMatches(new Set());
      await fetchResultForDate();
    } catch (e: any) {
      setError(e.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const toggleMatch = (matchId: string) => {
    setSelectedMatches(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  };

  const selectAllInTab = () => {
    const ids = new Set(currentRecs.map(r => r.matchId));
    setSelectedMatches(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  };

  const deselectAllInTab = () => {
    const ids = new Set(currentRecs.map(r => r.matchId));
    setSelectedMatches(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  };

  const currentRecs = result
    ? activeTab === 'free'
      ? result.freeRecommendations
      : activeTab === 'paid'
        ? result.paidRecommendations
        : result.vipRecommendations
    : [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">AI Match Analysis</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">DeepSeek-powered betting recommendations with verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Analysis Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm w-44"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Analysis Type</label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAnalysisType(t)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize",
                    analysisType === t
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Run Analysis
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                result.status === 'approved' ? 'bg-green-100 dark:bg-green-500/10' :
                result.status === 'rejected' ? 'bg-red-100 dark:bg-red-500/10' :
                'bg-yellow-100 dark:bg-yellow-500/10'
              )}>
                {result.status === 'approved' ? <CheckCircle2 size={20} className="text-green-600" /> :
                 result.status === 'rejected' ? <XCircle size={20} className="text-red-600" /> :
                 <Clock size={20} className="text-yellow-600" />}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Status: <span className="capitalize">{result.status}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  Generated {new Date(result.generatedAt).toLocaleString()} using {result.model}
                </p>
              </div>
            </div>

            {result.status === 'verified' && (
              <div className="flex items-center gap-2">
                {selectedMatches.size > 0 && (
                  <button
                    onClick={applySelected}
                    disabled={approving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Apply Selected ({selectedMatches.size})
                  </button>
                )}
                <button
                  onClick={approveAll}
                  disabled={approving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Approve All
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {(['free', 'paid', 'vip'] as const).map((type) => {
              const count = type === 'free' ? result.freeRecommendations.length :
                           type === 'paid' ? result.paidRecommendations.length :
                           result.vipRecommendations.length;
              const config = typeConfig[type];
              return (
                <div
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 transition-all",
                    activeTab === type ? config.borderColor : 'border-zinc-200 dark:border-zinc-800',
                    activeTab === type ? config.bgColor : 'bg-white dark:bg-zinc-900/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <config.icon size={16} className={config.textColor} />
                      <span className={cn("text-sm font-bold", config.textColor)}>{config.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{count}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">recommendations</p>
                </div>
              );
            })}
          </div>

          {/* Verification Notes */}
          {result.verificationNotes && result.verificationNotes.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-500/5 rounded-2xl border border-yellow-200 dark:border-yellow-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700 dark:text-yellow-400 mb-2">Verification Notes</p>
              <ul className="space-y-1">
                {result.verificationNotes.map((note, i) => (
                  <li key={i} className="text-xs text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                    <Shield size={12} className="shrink-0 mt-0.5" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Removed Matches */}
          {result.removedMatches && result.removedMatches.length > 0 && (
            <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-200 dark:border-red-500/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">
                Removed by Verifier ({result.removedMatches.length})
              </p>
              <ul className="space-y-1">
                {result.removedMatches.map((m, i) => (
                  <li key={i} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                    <XCircle size={12} className="shrink-0 mt-0.5" />
                    {m.matchId}: {m.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {typeConfig[activeTab].label} Recommendations
              </h3>
              <div className="flex items-center gap-3">
                {currentRecs.length > 0 && result?.status === 'verified' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={selectAllInTab}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllInTab}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
                <span className="text-xs text-zinc-500">{currentRecs.length} matches</span>
              </div>
            </div>

            {currentRecs.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <Zap size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recommendations in this category</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {currentRecs.map((rec, i) => (
                  <RecommendationCard
                    key={`${rec.matchId}-${i}`}
                    rec={rec}
                    isSelected={selectedMatches.has(rec.matchId)}
                    onToggle={() => toggleMatch(rec.matchId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-20 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700 mx-auto mb-4">
            <Brain size={32} className="text-zinc-300" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">No Analysis Yet</p>
          <p className="text-sm max-w-[320px] mx-auto">
            Select a date and click &quot;Run Analysis&quot; to generate AI-powered match recommendations.
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Analysis History</h3>
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Matches</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Generated</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((h) => (
                  <tr
                    key={h._id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer"
                    onClick={() => {
                      setSelectedDate(h.date);
                      setResult(h);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{h.date}</td>
                    <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">{h.analysisType}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold capitalize",
                        h.status === 'approved' ? 'bg-green-100 text-green-700' :
                        h.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        h.status === 'verified' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-zinc-100 text-zinc-600'
                      )}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {h.freeRecommendations.length + h.paidRecommendations.length + h.vipRecommendations.length}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(h.generatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
