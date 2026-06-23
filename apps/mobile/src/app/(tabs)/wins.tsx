import { View, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { CheckCircle2, Trophy, TrendingUp } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ConvexReactClient } from "convex/react";
import { api } from '@trophy-games/backend';
import { MatchCard } from '../../components/MatchCard';
import { DatePickerStrip } from '../../components/DatePickerStrip';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
// Mobile reads ONLY from Convex — no direct FootyStats API calls.

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

function getDateRange() {
    const dates: string[] = [];
    for (let i = -7; i <= 0; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

export default function WinsScreen() {
    const { themeColors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [matches, setMatches] = useState<any[]>([]);
    const [apiSource, setApiSource] = useState<'footystats' | 'convex'>('footystats');

    const dates = useMemo(() => getDateRange(), []);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        // Mobile reads ONLY from Convex.
        if (convex) {
            try {
                const historyData = await convex.query(api.matches.getHistory, { limit: 200 });
                setMatches(historyData || []);
                setApiSource('convex');
                console.log(`[Wins Screen] Loaded ${historyData?.length || 0} matches from Convex`);
            } catch (convexError) {
                console.warn('[Wins Screen] Convex failed:', convexError);
                setMatches([]);
            }
        } else {
            setMatches([]);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Finished matches for the selected date only.
    const dayMatches = useMemo(() => {
        return matches.filter(match => {
            const matchDate = match.matchDate || match.timestamp?.split('T')[0];
            return matchDate === selectedDate;
        });
    }, [matches, selectedDate]);

    const uniqueLeagues = useMemo(() => {
        const counts = new Map<string, number>();
        for (const m of dayMatches) counts.set(m.league, (counts.get(m.league) || 0) + 1);
        const leagues = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
        return ['All', ...leagues];
    }, [dayMatches]);

    const filteredMatches = useMemo(() => {
        return dayMatches.filter(match => selectedLeague === 'All' || match.league === selectedLeague);
    }, [dayMatches, selectedLeague]);

    const onRefresh = useCallback(async () => {
        await loadData(true);
    }, [loadData]);

    // "Win" = home side won (final score), matching the web History strike rate.
    const isWin = (m: any) => m.homeScore !== undefined && m.awayScore !== undefined && m.homeScore > m.awayScore;
    const winCount = dayMatches.filter(isWin).length;
    const winRate = dayMatches.length > 0 ? Math.round((winCount / dayMatches.length) * 100) : 0;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>

            {/* Date strip */}
            <View style={[styles.calendarStrip, { borderBottomColor: themeColors.border }]}>
                <DatePickerStrip
                    dates={dates}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    labelOverrides={{
                        [new Date().toISOString().split('T')[0]]: 'TODAY',
                    }}
                />
            </View>

            {/* League filter */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leaguesScroll}>
                    {uniqueLeagues.map(league => (
                        <TouchableOpacity
                            key={league}
                            onPress={() => setSelectedLeague(league)}
                            style={[
                                styles.leagueChip,
                                { backgroundColor: selectedLeague === league ? themeColors.primary : themeColors.cardBgSecondary }
                            ]}
                        >
                            <Text style={[
                                styles.leagueChipText,
                                { color: selectedLeague === league ? 'white' : themeColors.textMuted }
                            ]}>
                                {league === 'All' ? 'All' : toTitleCase(league)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Stats banner */}
            <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                <View style={styles.statBox}>
                    <Trophy size={18} color={themeColors.primary} />
                    <View>
                        <Text style={[styles.statValue, { color: themeColors.text }]}>{winRate}%</Text>
                        <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>STRIKE RATE</Text>
                    </View>
                </View>
                <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
                <View style={styles.statBox}>
                    <TrendingUp size={18} color={themeColors.blue10} />
                    <View>
                        <Text style={[styles.statValue, { color: themeColors.text }]}>{winCount}/{dayMatches.length}</Text>
                        <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>WINS / TOTAL</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={themeColors.primary}
                        colors={[themeColors.primary]}
                    />
                }
            >
                <View style={styles.sectionHeader}>
                    <CheckCircle2 size={14} color={themeColors.primary} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>PROVEN RESULTS</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                    </View>
                ) : filteredMatches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {filteredMatches.map((match: any) => (
                            <MatchCard
                                key={match._id || match.id}
                                matchId={match.id}
                                matchData={match}
                                leagueName={match.league}
                                leagueLogo={match.leagueLogo}
                                time="FT"
                                homeTeam={match.homeTeam}
                                homeTeamLogo={match.homeTeamLogo}
                                awayTeam={match.awayTeam}
                                awayTeamLogo={match.awayTeamLogo}
                                prediction={match.result ? match.result.toUpperCase() : (match.aiPrediction?.prediction || 'FT')}
                                odds={match.odds?.home || '—'}
                                homeScore={match.homeScore}
                                awayScore={match.awayScore}
                                aiInsight={match.aiPrediction}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Trophy size={36} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Results Yet</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            No finished matches for this date.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    calendarStrip: {
        borderBottomWidth: 1,
        paddingBottom: 2,
    },
    filterSection: { paddingHorizontal: 14, paddingTop: 8 },
    leaguesScroll: { paddingVertical: 4, gap: 8 },
    leagueChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    leagueChipText: { ...typography.chipText },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    statBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statValue: { ...typography.statValue },
    statLabel: { ...typography.statLabel },
    statDivider: { width: 1, height: 22 },
    content: { flex: 1 },
    scrollContent: { padding: 14, paddingBottom: 40 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        marginTop: 6,
    },
    sectionTitle: { ...typography.sectionTitle },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    fixtureGrid: { gap: 8 },
    emptyContainer: { paddingVertical: 70, alignItems: 'center', gap: 14 },
    emptyIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: { ...typography.emptyText },
    emptySubtext: { ...typography.emptySubtext, textAlign: 'center', paddingHorizontal: 36 },
});
