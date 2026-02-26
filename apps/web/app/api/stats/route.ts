import { NextResponse } from 'next/server';
import { loadData } from '@/lib/storage';

export async function GET() {
    const data = await loadData();
    const matches = data.matches;
    const leagues = data.leagues;

    // Calculate Summary Stats
    const totalMatches = matches.length;

    // Matches today (naive check against local string match)
    const today = new Date().toISOString().split('T')[0];
    const matchesToday = matches.filter(m => m.timestamp.startsWith(today)).length;


    // Success Rate (Mock logic: finished / total for now, or could be prediction accuracy later)
    // Let's use % of matches with valid scores as "Success" of data quality
    const matchesWithScores = matches.filter(m => m.homeScore !== undefined && m.awayScore !== undefined).length;
    const successRate = totalMatches > 0 ? (matchesWithScores / totalMatches) * 100 : 0;

    return NextResponse.json({
        totalLeagues: leagues.length,
        totalMatches,
        matchesToday,
        successRate: successRate.toFixed(1),
        lastUpdated: data.lastUpdated
    });
}
