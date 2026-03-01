import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Timer, Trophy, TrendingUp, History, ChevronLeft, BrainCircuit, CheckCircle2, Star, Zap, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { webApi } from '../../api/web';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function MatchDetailScreen() {
    const { id, matchData } = useLocalSearchParams();
    const router = useRouter();
    const { themeColors } = useTheme();

    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    useEffect(() => {
        const loadMatch = async () => {
            setLoading(true);
            try {
                if (matchData) {
                    setMatch(JSON.parse(decodeURIComponent(matchData as string)));
                } else {
                    const matches = await webApi.getMatches();
                    const found = matches.find((m: any) => m.id === id);
                    setMatch(found);
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
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (!match) {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: themeColors.textMuted }}>Match details unavailable</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: themeColors.primary, fontWeight: '900' }}>GO BACK</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: match.league?.toUpperCase() || 'MATCH DETAILS',
                    headerStyle: { backgroundColor: themeColors.background },
                    headerTintColor: themeColors.text,
                    headerTitleStyle: { fontWeight: '900', fontSize: 13 },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                            <ChevronLeft size={24} color={themeColors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Scoreboard Section */}
                <View style={[styles.scoreboard, { backgroundColor: themeColors.cardBgSecondary }]}>
                    <View style={styles.leagueLabel}>
                        <ShieldCheck size={12} color={themeColors.textMuted} />
                        <Text style={[styles.leagueLabelText, { color: themeColors.textMuted }]}>
                            {match.league?.toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.vsContainer}>
                        <View style={styles.teamBox}>
                            <View style={[styles.logoWrapper, { backgroundColor: themeColors.cardBg }]}>
                                {match.homeTeamLogo ? (
                                    <Image source={{ uri: match.homeTeamLogo }} style={styles.teamLogo} />
                                ) : (
                                    <Trophy size={24} color={themeColors.textMuted} />
                                )}
                            </View>
                            <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={2}>{match.homeTeam}</Text>
                        </View>

                        <View style={styles.scoreBox}>
                            <Text style={[styles.scoreText, { color: themeColors.primary }]}>
                                {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: themeColors.cardBg }]}>
                                <Text style={[styles.statusText, { color: themeColors.text }]}>{match.status?.toUpperCase() || 'UPCOMING'}</Text>
                            </View>
                        </View>

                        <View style={styles.teamBox}>
                            <View style={[styles.logoWrapper, { backgroundColor: themeColors.cardBg }]}>
                                {match.awayTeamLogo ? (
                                    <Image source={{ uri: match.awayTeamLogo }} style={styles.teamLogo} />
                                ) : (
                                    <Trophy size={24} color={themeColors.textMuted} />
                                )}
                            </View>
                            <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={2}>{match.awayTeam}</Text>
                        </View>
                    </View>

                    <Text style={[styles.matchTime, { color: themeColors.textMuted }]}>
                        {new Date(match.timestamp).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* AI SMART ANALYTICS */}
                <View style={[styles.aiSection, { backgroundColor: themeColors.cardBg, borderColor: themeColors.primary }]}>
                    <View style={styles.aiHeader}>
                        <View style={styles.aiTitleRow}>
                            <BrainCircuit size={18} color={themeColors.primary} />
                            <Text style={[styles.aiTitle, { color: themeColors.text }]}>AI SMART ANALYTICS</Text>
                        </View>
                        {match.isTrending && (
                            <View style={[styles.hotBadge, { backgroundColor: themeColors.orange9 }]}>
                                <Zap size={10} color="black" fill="black" />
                                <Text style={styles.hotText}>HOT</Text>
                            </View>
                        )}
                    </View>

                    {(match.aiPrediction || aiInsight) ? (
                        <View style={styles.aiBody}>
                            <View style={[styles.predictionCard, { backgroundColor: themeColors.cardBgSecondary }]}>
                                <View style={styles.probRow}>
                                    <Text style={[styles.probLabel, { color: themeColors.textMuted }]}>WIN PROBABILITY</Text>
                                    <Text style={[styles.probValue, { color: themeColors.primary }]}>
                                        {match.aiPrediction?.confidence || 85}%
                                    </Text>
                                </View>
                                <Text style={[styles.mainPick, { color: themeColors.text }]}>
                                    {match.aiPrediction?.prediction || aiInsight}
                                </Text>
                            </View>

                            {match.aiPrediction?.reasoning && (
                                <View style={styles.reasoningContainer}>
                                    <Text style={[styles.reasoningTitle, { color: themeColors.textMuted }]}>KEY INSIGHTS</Text>
                                    {match.aiPrediction.reasoning.map((reason: string, i: number) => (
                                        <View key={i} style={styles.reasoningLine}>
                                            <CheckCircle2 size={14} color={themeColors.primary} />
                                            <Text style={[styles.reasoningText, { color: themeColors.text }]}>{reason}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.emptyAiContainer, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <BrainCircuit size={24} color={themeColors.textMuted} />
                            <Text style={[styles.emptyAiText, { color: themeColors.textMuted }]}>
                                No AI insights available yet for this match.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Market Odds */}
                {match.detailedOdds && (
                    <View style={styles.oddsSection}>
                        <Text style={[styles.sectionHeading, { color: themeColors.text }]}>MARKET ODDS</Text>
                        <View style={styles.oddsGrid}>
                            <View style={[styles.oddsTile, { backgroundColor: themeColors.cardBg }]}>
                                <Text style={[styles.tileLabel, { color: themeColors.textMuted }]}>FULL TIME 1X2</Text>
                                <View style={styles.tileValues}>
                                    <View style={styles.valBox}><Text style={[styles.val, { color: themeColors.primary }]}>{match.detailedOdds.ft?.['1x2']?.home || '1.85'}</Text><Text style={styles.valSub}>HOME</Text></View>
                                    <View style={styles.valBox}><Text style={[styles.val, { color: themeColors.text }]}>{match.detailedOdds.ft?.['1x2']?.draw || '3.40'}</Text><Text style={styles.valSub}>DRAW</Text></View>
                                    <View style={styles.valBox}><Text style={[styles.val, { color: themeColors.text }]}>{match.detailedOdds.ft?.['1x2']?.away || '4.20'}</Text><Text style={styles.valSub}>AWAY</Text></View>
                                </View>
                            </View>

                            <View style={[styles.oddsTile, { backgroundColor: themeColors.cardBg }]}>
                                <Text style={[styles.tileLabel, { color: themeColors.textMuted }]}>GOALS OVER/UNDER</Text>
                                <View style={styles.tileValues}>
                                    <View style={styles.valBox}><Text style={[styles.val, { color: themeColors.text }]}>{match.detailedOdds.ft?.['ou']?.over || '1.75'}</Text><Text style={styles.valSub}>OVER {match.detailedOdds.ft?.['ou']?.line || '2.5'}</Text></View>
                                    <View style={styles.valBox}><Text style={[styles.val, { color: themeColors.text }]}>{match.detailedOdds.ft?.['ou']?.under || '2.05'}</Text><Text style={styles.valSub}>UNDER {match.detailedOdds.ft?.['ou']?.line || '2.5'}</Text></View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Stats Preview */}
                <View style={styles.statsPreview}>
                    <Text style={[styles.sectionHeading, { color: themeColors.text }]}>PRE MATCH DATA</Text>
                    <View style={[styles.statsCard, { backgroundColor: themeColors.cardBg }]}>
                        <View style={styles.statRow}>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>65%</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>WIN RATE (LAST 5)</Text>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>40%</Text>
                        </View>
                        <View style={styles.statBarContainer}>
                            <View style={[styles.statBar, { backgroundColor: themeColors.primary, width: '65%' }]} />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    scoreboard: {
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    leagueLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    leagueLabelText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: 10,
    },
    teamBox: {
        flex: 1,
        alignItems: 'center',
    },
    logoWrapper: {
        width: 70,
        height: 70,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    teamLogo: {
        width: 44,
        height: 44,
        resizeMode: 'contain',
    },
    teamName: {
        fontSize: 14,
        fontWeight: '900',
        textAlign: 'center',
        height: 40,
    },
    scoreBox: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    scoreText: {
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: -1,
    },
    statusBadge: {
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
    },
    matchTime: {
        marginTop: 24,
        fontSize: 11,
        fontWeight: '700',
    },
    aiSection: {
        margin: 16,
        marginTop: -20,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    aiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    aiTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    aiTitle: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    hotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    hotText: {
        fontSize: 9,
        fontWeight: '900',
        color: 'black',
    },
    aiBody: {
        gap: 20,
    },
    predictionCard: {
        padding: 16,
        borderRadius: 16,
    },
    probRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    probLabel: {
        fontSize: 10,
        fontWeight: '900',
    },
    probValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    mainPick: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    reasoningContainer: {
        gap: 12,
    },
    reasoningTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    reasoningLine: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    reasoningText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    emptyAiContainer: {
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emptyAiText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    oddsSection: {
        padding: 16,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 16,
        opacity: 0.6,
    },
    oddsGrid: {
        gap: 12,
    },
    oddsTile: {
        padding: 16,
        borderRadius: 20,
    },
    tileLabel: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 12,
    },
    tileValues: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    valBox: {
        alignItems: 'center',
        flex: 1,
    },
    val: {
        fontSize: 18,
        fontWeight: '900',
    },
    valSub: {
        fontSize: 8,
        fontWeight: '900',
        marginTop: 4,
        opacity: 0.4,
    },
    statsPreview: {
        padding: 16,
    },
    statsCard: {
        padding: 20,
        borderRadius: 20,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
    },
    statBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    statBar: {
        height: '100%',
        borderRadius: 3,
    },
});
