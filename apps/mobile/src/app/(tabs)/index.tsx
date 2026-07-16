import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConvexReactClient } from "convex/react";
import { api } from '@trophy-games/backend';
import { MatchCard } from '../../components/MatchCard';
import { DatePickerStrip } from '../../components/DatePickerStrip';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
// Mobile reads ONLY from Convex — the background cron sync fetches FootyStats
// data every 5 minutes and upserts it into Convex. No direct API calls from mobile.

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

export default function FreeTipsScreen() {
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leagues, setLeagues] = useState<any[]>([]);
    const [apiSource, setApiSource] = useState<'footystats' | 'convex'>('footystats');
    const { themeColors } = useTheme();

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        // Mobile reads ONLY from Convex. The background cron sync fetches
        // FootyStats data every 5 minutes and upserts it into Convex.
        if (convex) {
            try {
                const freeMatches = await convex.query(api.matches.getByTypeAndDate, {
                    matchType: 'free',
                    date: selectedDate,
                    limit: 100
                });
                setMatches(freeMatches || []);
                setApiSource('convex');
                console.log(`[Home Screen] Loaded ${freeMatches?.length || 0} free matches from Convex for ${selectedDate}`);
                // Derive the league chips from the actual matches (not the stale
                // leagues table), most-matches first so World Cup leads.
                const counts = new Map<string, number>();
                for (const m of (freeMatches || [])) counts.set(m.league, (counts.get(m.league) || 0) + 1);
                const leagueNames = [...counts.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([name]) => ({ name, id: name }));
                setLeagues(leagueNames);
            } catch (convexError) {
                console.warn('[Home Screen] Convex failed:', convexError);
                setMatches([]);
                setLeagues([]);
            }
        } else {
            setMatches([]);
            setLeagues([]);
        }

        setLoading(false);
        setRefreshing(false);
    }, [selectedDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredMatches = matches.filter(m => {
        const leagueMatch = selectedLeague === 'All' || m.league === selectedLeague;
        return leagueMatch;
    });

    const onRefresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    const dates = useMemo(() => {
        const d: string[] = [];
        for (let i = -3; i <= 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            d.push(date.toISOString().split('T')[0]);
        }
        return d;
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={[styles.subHeader, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                <View style={styles.filterSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.leagueFilterContent}
                    >
                        <TouchableOpacity
                            activeOpacity={0.75}
                            style={[
                                styles.leagueChip,
                                { borderColor: themeColors.border },
                                selectedLeague === 'All' && {
                                    backgroundColor: themeColors.primary,
                                    borderColor: themeColors.primary,
                                    shadowColor: themeColors.primary,
                                    ...styles.leagueChipActiveShadow,
                                }
                            ]}
                            onPress={() => setSelectedLeague('All')}
                        >
                            <Text style={[styles.leagueChipText, selectedLeague === 'All' ? { color: 'white' } : { color: themeColors.textMuted }]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        {leagues.map((league) => (
                            <TouchableOpacity
                                key={league.id}
                                activeOpacity={0.75}
                                style={[
                                    styles.leagueChip,
                                    { borderColor: themeColors.border },
                                    selectedLeague === league.name && {
                                        backgroundColor: themeColors.primary,
                                        borderColor: themeColors.primary,
                                        shadowColor: themeColors.primary,
                                        ...styles.leagueChipActiveShadow,
                                    }
                                ]}
                                onPress={() => setSelectedLeague(league.name)}
                            >
                                <Text style={[styles.leagueChipText, selectedLeague === league.name ? { color: 'white' } : { color: themeColors.textMuted }]}>
                                    {toTitleCase(league.name)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.dateStripWrapper}>
                    <DatePickerStrip
                        dates={dates}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.fixtureList}
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
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                        <Text style={[styles.loadingLabel, { color: themeColors.textMuted }]}>
                            Loading today's fixtures…
                        </Text>
                    </View>
                ) : filteredMatches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {filteredMatches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                matchId={match.id}
                                matchData={match}
                                leagueName={match.league}
                                leagueLogo={match.leagueLogo}
                                countryFlag={match.countryFlag}
                                time={new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                homeTeam={match.homeTeam}
                                homeTeamLogo={match.homeTeamLogo}
                                awayTeam={match.awayTeam}
                                awayTeamLogo={match.awayTeamLogo}
                                prediction={match.aiPrediction?.prediction || "TIPS"}
                                odds={match.odds?.home || "1.85"}
                                homeScore={match.homeScore}
                                awayScore={match.awayScore}
                                aiInsight={match.aiPrediction}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={[
                            styles.emptyIconWrapper,
                            { backgroundColor: themeColors.cardBgSecondary, borderColor: themeColors.border }
                        ]}>
                            <Zap size={36} color={themeColors.primary} />
                        </View>
                        <View style={styles.emptyTextGroup}>
                            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No free tips today</Text>
                            <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                                Our AI is still processing the matches.{'\n'}Pull down to check for updates.
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    subHeader: {
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 14,
    },
    filterSection: {
        marginBottom: 0,
    },
    leagueFilterContent: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    leagueChip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
    },
    leagueChipActiveShadow: {
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    leagueChipText: {
        ...typography.chipText,
        letterSpacing: 0.2,
    },
    dateStripWrapper: {
        // No extra paddingHorizontal — the strip manages its own padding
    },
    fixtureList: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },
    loadingContainer: {
        paddingVertical: 72,
        alignItems: 'center',
        gap: 14,
    },
    loadingLabel: {
        fontSize: 13,
        letterSpacing: 0.2,
    },
    fixtureGrid: {
        gap: 12,
    },
    emptyContainer: {
        paddingVertical: 88,
        alignItems: 'center',
        gap: 20,
    },
    emptyIconWrapper: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    emptyTextGroup: {
        alignItems: 'center',
        gap: 8,
    },
    emptyTitle: {
        ...typography.emptyTitle,
        letterSpacing: 0.3,
    },
    emptySubtitle: {
        ...typography.emptySubtitle,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },
});
