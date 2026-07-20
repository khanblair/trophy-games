'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, Ban, UserCheck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    _id: string;
    username: string;
    deviceId: string;
    createdAt: string;
    lastActiveAt: string;
    failedAttempts: number;
    isBlocked: boolean;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleAction = async (username: string, action: 'block' | 'unblock' | 'clear_attempts') => {
        setProcessingId(username);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, action }),
            });
            const data = await res.json();

            if (data.success) {
                if (action === 'block') toast.success(`User ${username} blocked`);
                if (action === 'unblock') toast.success(`User ${username} unblocked`);
                if (action === 'clear_attempts') toast.success(`Cleared failed attempts for ${username}`);
                await loadUsers();
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (e) {
            console.error(e);
            toast.error(`Failed to execute ${action}`);
        }
        setProcessingId(null);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Users</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage registered users, reset failed attempts, and block access.</p>
                </div>
                <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm">
                    <RefreshCw size={14} />Refresh
                </button>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-400">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Username</th>
                                    <th className="px-4 py-3">Device ID</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Failed Attempts</th>
                                    <th className="px-4 py-3">Last Active</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {users.map(user => (
                                    <tr key={user._id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${user.isBlocked ? 'opacity-70 bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{user.username}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-500 max-w-40 truncate">{user.deviceId}</td>
                                        <td className="px-4 py-3 text-center">
                                            {user.isBlocked ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><ShieldAlert size={12} />Blocked</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green"><ShieldCheck size={12} />Active</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${user.failedAttempts > 0 ? (user.failedAttempts >= 5 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400') : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                {user.failedAttempts}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                                            {new Date(user.lastActiveAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {user.failedAttempts > 0 && (
                                                    <button
                                                        onClick={() => handleAction(user.username, 'clear_attempts')}
                                                        disabled={processingId === user.username}
                                                        className="flex items-center gap-1 p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Clear Failed Attempts"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}
                                                {user.isBlocked ? (
                                                    <button
                                                        onClick={() => handleAction(user.username, 'unblock')}
                                                        disabled={processingId === user.username}
                                                        className="flex items-center gap-1 p-1.5 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Unblock User"
                                                    >
                                                        <UserCheck size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction(user.username, 'block')}
                                                        disabled={processingId === user.username}
                                                        className="flex items-center gap-1 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Block User"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </div>
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
