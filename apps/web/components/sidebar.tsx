'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Trophy,
    Swords,
    Database,
    BrainCircuit,
    Radio
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leagues', href: '/leagues', icon: Trophy },
    { name: 'Live', href: '/live', icon: Radio },
    { name: 'Matches', href: '/matches', icon: Swords },
    { name: 'Analytics', href: '/analytics', icon: BrainCircuit },
    { name: 'History', href: '/history', icon: Database },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
            <div className="flex h-20 items-center px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                        <Trophy size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Trophy Games
                        <span className="text-blue-600"> 100%</span>
                    </span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500"
                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                            )}
                        >
                            <item.icon size={18} className={cn(
                                "transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-500" : "text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-50"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600" />
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">Admin User</span>
                        <span className="text-[10px] text-zinc-500">System Administrator</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
