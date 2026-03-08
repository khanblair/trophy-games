'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Crown, DollarSign, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface MembershipRequest {
    _id: string;
    deviceId: string;
    type: 'vip' | 'paid';
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    approvedAt?: string;
    token?: string;
    notes?: string;
}

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<MembershipRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [tab, setTab] = useState<'pending' | 'all'>('pending');

    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    const handleAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
        setProcessingId(requestId);
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action, notes }),
            });
            const data = await res.json();

            if (action === 'approve' && data.token) {
                toast.success('Request approved and token generated!');
                navigator.clipboard.writeText(data.token).catch(() => { });
                setCopiedToken(data.token);
                setTimeout(() => setCopiedToken(null), 4000);
            } else if (action === 'reject') {
                toast.success('Request rejected successfully.');
            }

            await loadRequests();
        } catch (e) {
            console.error(e);
            toast.error(`Failed to ${action} request`);
        }
        setProcessingId(null);
    };

    const filtered = tab === 'pending'
        ? requests.filter(r => r.status === 'pending')
        : requests;

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Membership Requests</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Review and approve VIP/Paid access requests from users.</p>
                </div>
                <button onClick={loadRequests} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm">
                    <RefreshCw size={14} />Refresh
                </button>
            </div>

            {copiedToken && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">Token generated and copied!</p>
                        <p className="font-mono text-sm text-green-600 dark:text-green-300 mt-1">{copiedToken}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Share this token with the user so they can enter it in the app.</p>
                    </div>
                </div>
            )}

            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
                <button onClick={() => setTab('pending')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'}`}>
                    Pending
                    {pendingCount > 0 && <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full">{pendingCount}</span>}
                </button>
                <button onClick={() => setTab('all')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'}`}>
                    All Requests
                </button>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400">Loading requests...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">
                        {tab === 'pending' ? 'No pending requests.' : 'No requests yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Device ID</th>
                                    <th className="px-4 py-3 text-center">Type</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3">Requested</th>
                                    <th className="px-4 py-3">Token</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {filtered.map(req => (
                                    <tr key={req._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 max-w-40 truncate">{req.deviceId}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${req.type === 'vip' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                {req.type === 'vip' ? <Crown size={10} /> : <DollarSign size={10} />}
                                                {req.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {req.status === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500"><Clock size={12} />Pending</span>}
                                            {req.status === 'approved' && <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 size={12} />Approved</span>}
                                            {req.status === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><XCircle size={12} />Rejected</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                                            {new Date(req.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {req.token ? (
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(req.token!).catch(() => { }); }}
                                                    className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                                                    title="Copy token"
                                                >
                                                    <Copy size={10} />{req.token}
                                                </button>
                                            ) : <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(req._id, 'approve')}
                                                        disabled={processingId === req._id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={12} />Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req._id, 'reject')}
                                                        disabled={processingId === req._id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle size={12} />Reject
                                                    </button>
                                                </div>
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
