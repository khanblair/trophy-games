import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Timer, Trophy, TrendingUp, History, ChevronLeft, BrainCircuit, CheckCircle } from 'lucide-react-native';
import { webApi } from '../../api/web';
import { colors } from '../../theme/colors';
import { fetchMatchInsights } from '../../api/groq';

export default function MatchDetailScreen() {
    const { id, matchData } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
    
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    useEffect(() => {
        const loadMatch = async () => {
            setLoading(true);
            try {
                if (matchData) {
                    setMatch(JSON.parse(decodeURIComponent(matchData as string)));
                } else {
                    // Fetch all matches and find the one
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

    const handleAnalyze = async () => {
        if (!match) return;
        setAnalyzing(true);
        const result = await fetchMatchInsights(match.homeTeam, match.awayTeam, match.league);
        setAiInsight(result);
        setAnalyzing(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (!match) {
        return (
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <Text style={{ color: themeColors.text }}>Match not found</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen 
                options={{
                    headerShown: true,
                    headerTitle: 'Match Details',
                    headerStyle: { backgroundColor: themeColors.background },
                    headerTintColor: themeColors.text,
                }} 
            />
            <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
                {/* Header Card */}
                <View style={[styles.headerCard, { backgroundColor: themeColors.cardBg }]}>
                    <View style={styles.leagueRow}>
                        {match.leagueLogo && (
                            <Image source={{ uri: match.leagueLogo }} style={styles.leagueLogo} />
                        )}
                        <Text style={[styles.leagueName, { color: themeColors.text }]}>{match.league}</Text>
                        {match.countryFlag && (
                            <Image source={{ uri: match.countryFlag }} style={styles.countryFlag} />
                        )}
                    </View>
                    
                    <View style={styles.matchRow}>
                        <View style={styles.teamColumn}>
                            {match.homeTeamLogo && (
                                <Image source={{ uri: match.homeTeamLogo }} style={styles.teamLogo} />
                            )}
                            <Text style={[styles.teamName, { color: themeColors.text }]}>{match.homeTeam}</Text>
                        </View>
                        
                        <View style={styles.scoreColumn}>
                            <Text style={[styles.score, { color: themeColors.primary }]}>
                                {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                            </Text>
                            <Text style={[styles.status, { color: themeColors.text }]}>{match.status}</Text>
                        </View>
                        
                        <View style={styles.teamColumn}>
                            {match.awayTeamLogo && (
                                <Image source={{ uri: match.awayTeamLogo }} style={styles.teamLogo} />
                            )}
                            <Text style={[styles.teamName, { color: themeColors.text }]}>{match.awayTeam}</Text>
                        </View>
                    </View>
                    
                    <Text style={[styles.timestamp, { color: themeColors.text }]}>
                        {new Date(match.timestamp).toLocaleString()}
                    </Text>
                </View>

                {/* AI Prediction Section */}
                <View style={[styles.section, { backgroundColor: themeColors.cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>AI Prediction</Text>
                    
                    {(match.aiPrediction || aiInsight) ? (
                        <View style={styles.aiContent}>
                            {match.aiPrediction && (
                                <>
                                    <View style={styles.confidenceBadge}>
                                        <BrainCircuit size={16} color={themeColors.primary} />
                                        <Text style={[styles.confidenceText, { color: themeColors.primary }]}>
                                            {match.aiPrediction.confidence}% Confidence
                                        </Text>
                                    </View>
                                    <Text style={[styles.predictionText, { color: themeColors.text }]}>
                                        {match.aiPrediction.prediction}
                                    </Text>
                                    <View style={styles.reasoningList}>
                                        {match.aiPrediction.reasoning.map((reason: string, i: number) => (
                                            <View key={i} style={styles.reasoningItem}>
                                                <CheckCircle size={14} color="#22c55e" />
                                                <Text style={[styles.reasoningText, { color: themeColors.text }]}>{reason}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                            {aiInsight && !match.aiPrediction && (
                                <Text style={[styles.predictionText, { color: themeColors.text }]}>{aiInsight}</Text>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.analyzeButton, { backgroundColor: themeColors.primary }]}
                            onPress={handleAnalyze}
                            disabled={analyzing}
                        >
                            {analyzing ? (
                                <ActivityIndicator size="small" color="black" />
                            ) : (
                                <>
                                    <BrainCircuit size={18} color="black" />
                                    <Text style={styles.analyzeButtonText}>
                                        {analyzing ? 'Analyzing...' : 'Generate AI Prediction'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Match Type Section */}
                <View style={[styles.section, { backgroundColor: themeColors.cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Match Type</Text>
                    <View style={styles.matchTypeRow}>
                        <View style={[
                            styles.matchTypeBadge, 
                            { backgroundColor: match.matchType === 'vip' ? '#a855f7' : match.matchType === 'paid' ? '#f97316' : themeColors.primary }
                        ]}>
                            <Text style={styles.matchTypeText}>
                                {match.matchType?.toUpperCase() || 'FREE'}
                            </Text>
                        </View>
                        {match.isTrending && (
                            <View style={[styles.trendingBadge, { backgroundColor: '#fbbf24' }]}>
                                <Text style={styles.trendingText}>TRENDING</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Odds Section */}
                {match.detailedOdds && (
                    <View style={[styles.section, { backgroundColor: themeColors.cardBg }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Odds</Text>
                        <View style={styles.oddsGrid}>
                            <View style={styles.oddsCard}>
                                <Text style={[styles.oddsLabel, { color: themeColors.text }]}>1X2</Text>
                                <Text style={[styles.oddsValue, { color: '#22c55e' }]}>{match.detailedOdds.ft?.['1x2']?.home}</Text>
                                <Text style={[styles.oddsValue, { color: themeColors.text }]}>{match.detailedOdds.ft?.['1x2']?.draw}</Text>
                                <Text style={[styles.oddsValue, { color: '#ef4444' }]}>{match.detailedOdds.ft?.['1x2']?.away}</Text>
                            </View>
                            <View style={styles.oddsCard}>
                                <Text style={[styles.oddsLabel, { color: themeColors.text }]}>O/U</Text>
                                <Text style={[styles.oddsValue, { color: '#ef4444' }]}>{match.detailedOdds.ft?.['ou']?.over}</Text>
                                <Text style={[styles.oddsValue, { color: themeColors.text }]}>{match.detailedOdds.ft?.['ou']?.line}</Text>
                                <Text style={[styles.oddsValue, { color: '#22c55e' }]}>{match.detailedOdds.ft?.['ou']?.under}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerCard: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    leagueLogo: {
        width: 24,
        height: 24,
    },
    countryFlag: {
        width: 24,
        height: 16,
    },
    leagueName: {
        fontSize: 14,
        fontWeight: '600',
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    teamColumn: {
        alignItems: 'center',
        flex: 1,
    },
    teamLogo: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    teamName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scoreColumn: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    score: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    status: {
        fontSize: 12,
        opacity: 0.7,
    },
    timestamp: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 12,
        opacity: 0.5,
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 12,
    },
    aiContent: {
        fontWeight: 'bold',
        gap: 12,
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    confidenceText: {
        fontWeight: 'bold',
    },
    predictionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    reasoningList: {
        gap: 8,
    },
    reasoningItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    reasoningText: {
        flex: 1,
        fontSize: 13,
        opacity: 0.8,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
    },
    analyzeButtonText: {
        fontWeight: 'bold',
        color: 'black',
    },
    matchTypeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    matchTypeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    matchTypeText: {
        color: 'white',
        fontWeight: 'bold',
    },
    trendingBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    trendingText: {
        color: 'black',
        fontWeight: 'bold',
    },
    oddsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    oddsCard: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    oddsLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    oddsValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
