'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Key, Plus, Trash2, RefreshCw, Clock, CheckCircle2, XCircle, Crown, DollarSign } from 'lucide-react';

interface Token {
    _id: string;
    token: string;
    deviceId: string;
    type: 'vip' | 'paid';
    matchId?: string;
    createdAt: string;
    expiresAt?: string;
    isActive: boolean;
}

export default function AdminTokensPage() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ deviceId: '', type: 'vip' as 'vip' | 'paid', matchId: '', expiresAt: '' });
    const [showForm, setShowForm] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const loadTokens = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tokens');
            const data = await res.json();
            setTokens(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { loadTokens(); }, [loadTokens]);

    const createToken = async () => {
        if (!form.deviceId) return;
        setCreating(true);
        try {
            const res = await fetch('/api/admin/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: form.deviceId,
                    type: form.type,
                    matchId: form.matchId || undefined,
                    expiresAt: form.expiresAt || undefined,
                }),
            });
            const data = await res.json();
            if (data.token) {
                copyToClipboard(data.token);
                await loadTokens();
                setShowForm(false);
                setForm({ deviceId: '', type: 'vip', matchId: '', expiresAt: '' });
            }
        } catch (e) { console.error(e); }
        setCreating(false);
    };

    const revokeToken = async (token: string) => {
        try {
            await fetch('/api/admin/tokens', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            setTokens(prev => prev.map(t => t.token === token ? { ...t, isActive: false } : t));
        } catch (e) { console.error(e); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopiedToken(text);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const isExpired = (expiresAt?: string) => expiresAt && new Date(expiresAt) < new Date();

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Access Tokens</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Generate and manage VIP & Paid access tokens for users.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadTokens} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm">
                        <RefreshCw size={14} />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
                        <Plus size={16} />Generate Token
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">New Access Token</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Device ID *</label>
                            <input
                                value={form.deviceId}
                                onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))}
                                placeholder="User device identifier"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Access Type *</label>
                            <select
                                value={form.type}
                                onChange={e => setForm(f => ({ ...f, type: e.target.value as 'vip' | 'paid' }))}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="vip">VIP Access</option>
                                <option value="paid">Paid Access</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Match ID (optional — leave blank for all matches)</label>
                            <input
                                value={form.matchId}
                                onChange={e => setForm(f => ({ ...f, matchId: e.target.value }))}
                                placeholder="e.g. odds_abc123 (leave blank for all)"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Expires At (optional)</label>
                            <input
                                type="datetime-local"
                                value={form.expiresAt}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={createToken} disabled={creating || !form.deviceId} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                            <Key size={14} />{creating ? 'Generating...' : 'Generate & Copy Token'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400">Loading tokens...</div>
                ) : tokens.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">No tokens generated yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Token</th>
                                    <th className="px-4 py-3">Device ID</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3">Match ID</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Expires</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {tokens.map(token => (
                                    <tr key={token._id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${!token.isActive ? 'opacity-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => copyToClipboard(token.token)}
                                                className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                title="Click to copy"
                                            >
                                                {copiedToken === token.token ? '✓ Copied' : token.token}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-500 max-w-32 truncate">{token.deviceId}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${token.type === 'vip' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                {token.type === 'vip' ? <Crown size={10} /> : <DollarSign size={10} />}
                                                {token.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-500 max-w-32 truncate">{token.matchId || 'All matches'}</td>
                                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(token.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                                            {token.expiresAt
                                                ? <span className={isExpired(token.expiresAt) ? 'text-red-500' : ''}>{new Date(token.expiresAt).toLocaleDateString()}</span>
                                                : 'Never'
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {token.isActive && !isExpired(token.expiresAt)
                                                ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={12} />Active</span>
                                                : <span className="inline-flex items-center gap-1 text-xs text-zinc-400"><XCircle size={12} />Inactive</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {token.isActive && (
                                                <button onClick={() => revokeToken(token.token)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Revoke">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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
