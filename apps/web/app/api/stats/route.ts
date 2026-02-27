import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET() {
    try {
        let data;
        try {
            data = await loadData();
        } catch (loadError) {
            console.error('[API Stats] Load data failed:', loadError);
            return NextResponse.json({
                totalLeagues: 0,
                totalMatches: 0,
                matchesToday: 0,
                successRate: '0',
                lastUpdated: ''
            });
        }

        const matches = data.matches || [];
        const leagues = data.leagues || [];

        const totalMatches = matches.length;

        const today = new Date().toISOString().split('T')[0];
        const matchesToday = matches.filter(m => m.timestamp.startsWith(today)).length;

        const matchesWithScores = matches.filter(m => m.homeScore !== undefined && m.awayScore !== undefined).length;
        const successRate = totalMatches > 0 ? (matchesWithScores / totalMatches) * 100 : 0;

        return NextResponse.json({
            totalLeagues: leagues.length,
            totalMatches,
            matchesToday,
            successRate: successRate.toFixed(1),
            lastUpdated: data.lastUpdated
        });
    } catch (error) {
        console.error('[API Stats] Error:', error);
        return NextResponse.json({
            totalLeagues: 0,
            totalMatches: 0,
            matchesToday: 0,
            successRate: '0',
            lastUpdated: ''
        });
    }
}
