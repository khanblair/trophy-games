import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Timer, Trophy, TrendingUp, ChevronLeft, BrainCircuit, CheckCircle2, Zap, ShieldCheck, Target, BarChart2 } from 'lucide-react-native';
import { ConvexReactClient } from "convex/react";
import { api } from '@trophy-games/backend';
import { useTheme } from '../../context/ThemeContext';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const { width } = Dimensions.get('window');

export default function MatchDetailScreen() {
    const { id, matchData } = useLocalSearchParams();
    const router = useRouter();
    const { themeColors } = useTheme();

    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMatch = async () => {
            setLoading(true);
            try {
                if (matchData) {
                    setMatch(JSON.parse(decodeURIComponent(matchData as string)));
                } else if (convex) {
                    // Fetch all matches and find the specific one by ID
                    const matches = await convex.query(api.matches.getAll, { limit: 500 });
                    const found = matches.find((m: any) => m.id === id);
                    setMatch(found);
                    console.log(`[Match Detail] Found match ${id} from Convex`);
                }
            } catch (e) {
                console.error('Failed to load match:', e);
            }
            setLoading(false);
        };
        loadMatch();
    }, [id, matchData]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </SafeAreaView>
        );
    }

    if (!match) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
                <Text style={{ color: themeColors.textMuted }}>Match details unavailable</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: themeColors.primary, fontWeight: '900' }}>GO BACK</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isLive = match.status?.includes('Live') || match.status === 'Halftime';
    const isFinished = match.status === 'Finished' || match.status === 'FT';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
            {/* Custom Header */}
            <View style={[styles.customHeader, { backgroundColor: themeColors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
                    <ChevronLeft size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                    {match.league?.toUpperCase() || 'MATCH DETAILS'}
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Hero Scoreboard */}
                <View style={[styles.scoreboard, { backgroundColor: themeColors.cardBgSecondary }]}>
                    <View style={styles.leagueRow}>
                        <ShieldCheck size={11} color={themeColors.textMuted} />
                        <Text style={[styles.leagueText, { color: themeColors.textMuted }]}>
                            {match.league?.toUpperCase()}
                        </Text>
                        {match.country && (
                            <Text style={[styles.countryText, { color: themeColors.textMuted }]}>• {match.country}</Text>
                        )}
                    </View>

                    {/* Status Badge */}
                    <View style={[
                        styles.statusBadge,
                        {
                            backgroundColor: isLive ? '#ef4444' : isFinished ? themeColors.cardBg : themeColors.cardBg,
                        }
                    ]}>
                        {isLive && <View style={styles.liveDot} />}
                        <Text style={[
                            styles.statusText,
                            { color: isLive ? 'white' : themeColors.textMuted }
                        ]}>
                            {isLive ? match.status?.toUpperCase() : isFinished ? 'FULL TIME' : 'UPCOMING'}
                        </Text>
                    </View>

                    {/* Teams + Score */}
                    <View style={styles.teamsRow}>
                        <View style={styles.teamCol}>
                            <View style={[styles.logoBox, { backgroundColor: themeColors.cardBg }]}>
                                {match.homeTeamLogo
                                    ? <Image source={{ uri: match.homeTeamLogo }} style={styles.teamLogo} />
                                    : <Trophy size={26} color={themeColors.textMuted} />
                                }
                            </View>
                            <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={2}>{match.homeTeam}</Text>
                            {match.homeStanding && (
                                <Text style={[styles.standingText, { color: themeColors.textMuted }]}>#{match.homeStanding}</Text>
                            )}
                        </View>

                        <View style={styles.scoreCol}>
                            {(match.homeScore !== undefined) ? (
                                <Text style={[styles.scoreText, { color: themeColors.primary }]}>
                                    {match.homeScore} — {match.awayScore}
                                </Text>
                            ) : (
                                <Text style={[styles.vsText, { color: themeColors.text }]}>VS</Text>
                            )}
                            <Text style={[styles.kickoffText, { color: themeColors.textMuted }]}>
                                {new Date(match.timestamp).toLocaleString([], {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </Text>
                            {match.isTrending && (
                                <View style={[styles.hotBadge, { backgroundColor: themeColors.orange9 }]}>
                                    <Zap size={9} color="black" fill="black" />
                                    <Text style={styles.hotText}>HOT</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.teamCol}>
                            <View style={[styles.logoBox, { backgroundColor: themeColors.cardBg }]}>
                                {match.awayTeamLogo
                                    ? <Image source={{ uri: match.awayTeamLogo }} style={styles.teamLogo} />
                                    : <Trophy size={26} color={themeColors.textMuted} />
                                }
                            </View>
                            <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={2}>{match.awayTeam}</Text>
                            {match.awayStanding && (
                                <Text style={[styles.standingText, { color: themeColors.textMuted }]}>#{match.awayStanding}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* AI Smart Analytics */}
                <View style={[styles.section, { backgroundColor: themeColors.cardBg, borderColor: `${themeColors.primary}40` }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <BrainCircuit size={16} color={themeColors.primary} />
                            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>AI SMART ANALYTICS</Text>
                        </View>
                    </View>

                    {match.aiPrediction ? (
                        <View style={styles.aiBody}>
                            <View style={[styles.predictionCard, { backgroundColor: themeColors.cardBgSecondary }]}>
                                <View style={styles.probRow}>
                                    <Text style={[styles.probLabel, { color: themeColors.textMuted }]}>WIN PROBABILITY</Text>
                                    <Text style={[styles.probValue, { color: themeColors.primary }]}>
                                        {match.aiPrediction.confidence}%
                                    </Text>
                                </View>
                                <Text style={[styles.mainPick, { color: themeColors.text }]}>
                                    {match.aiPrediction.prediction}
                                </Text>
                                {match.aiPrediction.suggestedBet && (
                                    <View style={[styles.suggestedBet, { borderColor: `${themeColors.primary}30`, backgroundColor: `${themeColors.primary}10` }]}>
                                        <Target size={12} color={themeColors.primary} />
                                        <Text style={[styles.suggestedBetText, { color: themeColors.primary }]}>
                                            {match.aiPrediction.suggestedBet}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {match.aiPrediction.reasoning?.length > 0 && (
                                <View style={styles.reasoningContainer}>
                                    <Text style={[styles.subLabel, { color: themeColors.textMuted }]}>KEY INSIGHTS</Text>
                                    {match.aiPrediction.reasoning.map((reason: string, i: number) => (
                                        <View key={i} style={styles.reasonRow}>
                                            <CheckCircle2 size={13} color={themeColors.primary} />
                                            <Text style={[styles.reasonText, { color: themeColors.text }]}>{reason}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.emptyBox, { backgroundColor: themeColors.cardBgSecondary, borderColor: `${themeColors.border}` }]}>
                            <BrainCircuit size={22} color={themeColors.textMuted} />
                            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                                No AI insights available yet.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Market Odds */}
                {match.detailedOdds && (
                    <View style={styles.outerPad}>
                        <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>MARKET ODDS</Text>
                        <View style={styles.oddsGrid}>
                            <View style={[styles.oddsTile, { backgroundColor: themeColors.cardBg }]}>
                                <Text style={[styles.tileLabel, { color: themeColors.textMuted }]}>FULL TIME 1X2</Text>
                                <View style={styles.oddsRow}>
                                    <View style={styles.oddsCell}>
                                        <Text style={[styles.oddsVal, { color: themeColors.primary }]}>{match.detailedOdds.ft?.['1x2']?.home || '—'}</Text>
                                        <Text style={[styles.oddsSub, { color: themeColors.textMuted }]}>HOME</Text>
                                    </View>
                                    <View style={[styles.oddsDivider, { backgroundColor: themeColors.border }]} />
                                    <View style={styles.oddsCell}>
                                        <Text style={[styles.oddsVal, { color: themeColors.text }]}>{match.detailedOdds.ft?.['1x2']?.draw || '—'}</Text>
                                        <Text style={[styles.oddsSub, { color: themeColors.textMuted }]}>DRAW</Text>
                                    </View>
                                    <View style={[styles.oddsDivider, { backgroundColor: themeColors.border }]} />
                                    <View style={styles.oddsCell}>
                                        <Text style={[styles.oddsVal, { color: themeColors.text }]}>{match.detailedOdds.ft?.['1x2']?.away || '—'}</Text>
                                        <Text style={[styles.oddsSub, { color: themeColors.textMuted }]}>AWAY</Text>
                                    </View>
                                </View>
                            </View>

                            {match.detailedOdds.ft?.['ou'] && (
                                <View style={[styles.oddsTile, { backgroundColor: themeColors.cardBg }]}>
                                    <Text style={[styles.tileLabel, { color: themeColors.textMuted }]}>GOALS OVER / UNDER</Text>
                                    <View style={styles.oddsRow}>
                                        <View style={styles.oddsCell}>
                                            <Text style={[styles.oddsVal, { color: themeColors.text }]}>{match.detailedOdds.ft['ou'].over || '—'}</Text>
                                            <Text style={[styles.oddsSub, { color: themeColors.textMuted }]}>OVER {match.detailedOdds.ft['ou'].line}</Text>
                                        </View>
                                        <View style={[styles.oddsDivider, { backgroundColor: themeColors.border }]} />
                                        <View style={styles.oddsCell}>
                                            <Text style={[styles.oddsVal, { color: themeColors.text }]}>{match.detailedOdds.ft['ou'].under || '—'}</Text>
                                            <Text style={[styles.oddsSub, { color: themeColors.textMuted }]}>UNDER {match.detailedOdds.ft['ou'].line}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* H2H Summary */}
                {match.h2h?.summary && (
                    <View style={styles.outerPad}>
                        <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>HEAD TO HEAD</Text>
                        <View style={[styles.h2hCard, { backgroundColor: themeColors.cardBg }]}>
                            <View style={styles.h2hRow}>
                                <View style={styles.h2hStat}>
                                    <Text style={[styles.h2hVal, { color: themeColors.primary }]}>{match.h2h.summary.wins}</Text>
                                    <Text style={[styles.h2hLabel, { color: themeColors.textMuted }]}>HOME WINS</Text>
                                </View>
                                <View style={styles.h2hStat}>
                                    <Text style={[styles.h2hVal, { color: themeColors.text }]}>{match.h2h.summary.draws}</Text>
                                    <Text style={[styles.h2hLabel, { color: themeColors.textMuted }]}>DRAWS</Text>
                                </View>
                                <View style={styles.h2hStat}>
                                    <Text style={[styles.h2hVal, { color: themeColors.text }]}>{match.h2h.summary.losses}</Text>
                                    <Text style={[styles.h2hLabel, { color: themeColors.textMuted }]}>AWAY WINS</Text>
                                </View>
                            </View>
                            {/* Visual bar */}
                            <View style={styles.h2hBar}>
                                <View style={[styles.h2hBarSegment, {
                                    backgroundColor: themeColors.primary,
                                    flex: match.h2h.summary.wins || 1,
                                }]} />
                                <View style={[styles.h2hBarSegment, {
                                    backgroundColor: themeColors.border,
                                    flex: match.h2h.summary.draws || 1,
                                }]} />
                                <View style={[styles.h2hBarSegment, {
                                    backgroundColor: themeColors.textMuted,
                                    flex: match.h2h.summary.losses || 1,
                                }]} />
                            </View>
                        </View>
                    </View>
                )}

                {/* Match Info */}
                {(match.referee || match.weather) && (
                    <View style={styles.outerPad}>
                        <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>MATCH INFO</Text>
                        <View style={[styles.infoCard, { backgroundColor: themeColors.cardBg }]}>
                            {match.referee && (
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoKey, { color: themeColors.textMuted }]}>REFEREE</Text>
                                    <Text style={[styles.infoVal, { color: themeColors.text }]}>{match.referee}</Text>
                                </View>
                            )}
                            {match.weather && (
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoKey, { color: themeColors.textMuted }]}>WEATHER</Text>
                                    <Text style={[styles.infoVal, { color: themeColors.text }]}>{match.weather}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 48 },

    // Scoreboard
    scoreboard: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
        alignItems: 'center',
        gap: 12,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    leagueText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    countryText: {
        fontSize: 10,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    teamsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 4,
    },
    teamCol: {
        flex: 1,
        alignItems: 'center',
        gap: 10,
    },
    logoBox: {
        width: 72,
        height: 72,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
    teamLogo: {
        width: 46,
        height: 46,
        resizeMode: 'contain',
    },
    teamName: {
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 18,
    },
    standingText: {
        fontSize: 10,
        fontWeight: '700',
    },
    scoreCol: {
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 6,
    },
    scoreText: {
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: -1,
    },
    vsText: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
    },
    kickoffText: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    hotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    hotText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'black',
    },

    // Section card
    section: {
        margin: 16,
        marginTop: 8,
        padding: 18,
        borderRadius: 22,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // AI body
    aiBody: { gap: 16 },
    predictionCard: {
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    probRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    probLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    probValue: { fontSize: 14, fontWeight: '900' },
    mainPick: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    suggestedBet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        marginTop: 4,
    },
    suggestedBetText: { fontSize: 11, fontWeight: '700' },
    subLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    reasoningContainer: { gap: 10 },
    reasonRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    reasonText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        flex: 1,
    },
    emptyBox: {
        padding: 28,
        borderRadius: 16,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

    // Outer padding wrapper
    outerPad: { paddingHorizontal: 16, paddingBottom: 4 },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 12,
        opacity: 0.7,
    },

    // Odds
    oddsGrid: { gap: 10 },
    oddsTile: { padding: 16, borderRadius: 18 },
    tileLabel: { fontSize: 9, fontWeight: '900', marginBottom: 14, letterSpacing: 0.5 },
    oddsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    oddsCell: { alignItems: 'center', flex: 1 },
    oddsDivider: { width: 1, height: 30 },
    oddsVal: { fontSize: 20, fontWeight: '900' },
    oddsSub: { fontSize: 8, fontWeight: '900', marginTop: 4, opacity: 0.5 },

    // H2H
    h2hCard: { padding: 16, borderRadius: 18, gap: 14 },
    h2hRow: { flexDirection: 'row', justifyContent: 'space-around' },
    h2hStat: { alignItems: 'center', gap: 4 },
    h2hVal: { fontSize: 22, fontWeight: '900' },
    h2hLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    h2hBar: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        gap: 2,
    },
    h2hBarSegment: { borderRadius: 3 },

    // Info
    infoCard: { padding: 16, borderRadius: 18, gap: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoKey: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    infoVal: { fontSize: 13, fontWeight: '600' },

    // Custom Header
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerLeft: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
});
