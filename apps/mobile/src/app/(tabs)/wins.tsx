import { View, Text, ScrollView, ActivityIndicator, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { CheckCircle2, Trophy, TrendingUp, Filter } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

export default function WinsScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { themeColors } = useTheme();
    const [selectedLeague, setSelectedLeague] = useState('All');

    const uniqueLeagues = useMemo(() => {
        const leagues = Array.from(new Set(matches.map(m => m.league))).sort();
        return ['All', ...leagues];
    }, [matches]);

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            const leagueMatch = selectedLeague === 'All' || match.league === selectedLeague;
            return leagueMatch;
        });
    }, [matches, selectedLeague]);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        await webApi.clearCache();
        const data = await webApi.getHistory();
        setMatches(data || []);
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
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
                                { color: selectedLeague === league ? 'black' : themeColors.textMuted }
                            ]}>
                                {league.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.promoBanner}>
                <View style={[styles.statsRow, { borderBottomColor: themeColors.border }]}>
                    <View style={styles.statBox}>
                        <Trophy size={20} color={themeColors.primary} />
                        <View>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>92%</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>STRIKE RATE</Text>
                        </View>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
                    <View style={styles.statBox}>
                        <TrendingUp size={20} color={themeColors.blue10} />
                        <View>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>+420%</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>WEEKLY ROI</Text>
                        </View>
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
                    <CheckCircle2 size={16} color={themeColors.primary} />
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
                                key={match.id}
                                matchId={match.id}
                                leagueName={match.league}
                                leagueLogo={match.leagueLogo}
                                time="FT"
                                homeTeam={match.homeTeam}
                                homeTeamLogo={match.homeTeamLogo}
                                awayTeam={match.awayTeam}
                                awayTeamLogo={match.awayTeamLogo}
                                prediction={match.prediction || 'WIN'}
                                odds="2.10"
                                homeScore={match.homeScore}
                                awayScore={match.awayScore}
                                aiInsight={match.aiPrediction}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Trophy size={40} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>Start Winning Today</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            Our analysts are currently verifying the latest results.
                        </Text>
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
    promoBanner: {
        paddingTop: 8,
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    statBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statDivider: {
        width: 1,
        height: 24,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    leaguesScroll: {
        paddingVertical: 4,
        gap: 8,
    },
    leagueChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    leagueChipText: {
        fontSize: 10,
        fontWeight: '900',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    fixtureGrid: {
        gap: 8,
    },
    emptyContainer: {
        paddingVertical: 80,
        alignItems: 'center',
        gap: 16,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtext: {
        textAlign: 'center',
        fontSize: 14,
        paddingHorizontal: 40,
    },
});
