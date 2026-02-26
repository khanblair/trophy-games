import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { fetchMatchInsights } from '../api/groq';
import { colors } from '../theme/colors';
import { useColorScheme } from 'react-native';

interface MatchCardProps {
    leagueName: string;
    leagueLogo?: string;
    time: string;
    homeTeam: string;
    homeLogo?: string;
    awayTeam: string;
    awayLogo?: string;
    isLocked?: boolean;
    price?: number;
    prediction?: string;
    odds?: string;
}

export const MatchCard = ({
    leagueName,
    leagueLogo,
    time,
    homeTeam,
    homeLogo,
    awayTeam,
    awayLogo,
    isLocked,
    price,
    prediction,
    odds,
}: MatchCardProps) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    const handleGetInsight = async () => {
        if (insight) {
            setShowAI(!showAI);
            return;
        }

        setLoadingAI(true);
        setShowAI(true);
        const data = await fetchMatchInsights(homeTeam, awayTeam, leagueName);
        setInsight(data);
        setLoadingAI(false);
    };

    return (
        <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
            <View style={styles.header}>
                <View style={styles.leagueRow}>
                    {leagueLogo ? (
                        <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} />
                    ) : (
                        <View style={[styles.leagueLogoPlaceholder, { backgroundColor: themeColors.gray5 }]} />
                    )}
                    <Text style={[styles.leagueName, { color: themeColors.text }]}>{leagueName}</Text>
                </View>
                <Text style={[styles.time, { color: themeColors.text }]}>{time}</Text>
            </View>

            <View style={styles.teamsContainer}>
                <View style={styles.teamColumn}>
                    {homeLogo ? (
                        <Image source={{ uri: homeLogo }} style={styles.teamLogo} />
                    ) : (
                        <View style={[styles.teamLogoPlaceholder, { backgroundColor: themeColors.gray5 }]} />
                    )}
                    <Text style={[styles.teamName, { color: themeColors.text }]}>{homeTeam}</Text>
                </View>

                <Text style={[styles.vsText, { color: themeColors.text }]}>VS</Text>

                <View style={styles.teamColumn}>
                    {awayLogo ? (
                        <Image source={{ uri: awayLogo }} style={styles.teamLogo} />
                    ) : (
                        <View style={[styles.teamLogoPlaceholder, { backgroundColor: themeColors.gray5 }]} />
                    )}
                    <Text style={[styles.teamName, { color: themeColors.text }]}>{awayTeam}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                {isLocked ? (
                    <>
                        <TouchableOpacity style={[styles.lockButton, { backgroundColor: themeColors.gray5 }]}>
                            <Lock size={16} color={themeColors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.buyButton, { backgroundColor: themeColors.orange9 }]}>
                            <Text style={styles.buyButtonText}>{price} Coins</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.waitButton, { borderColor: themeColors.border }]}>
                            <Text style={[styles.waitButtonText, { color: themeColors.text }]}>WAIT</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={[styles.oddsButton, { backgroundColor: themeColors.blue2 }]}>
                            <Text style={[styles.oddsText, { color: themeColors.blue10 }]}>{odds}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.predictionButton, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
                            <Text style={[styles.predictionText, { color: themeColors.text }]}>{prediction}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.aiButton, { backgroundColor: themeColors.primary }]}
                            onPress={handleGetInsight}
                            disabled={loadingAI}
                        >
                            {loadingAI ? (
                                <ActivityIndicator size="small" color="black" />
                            ) : (
                                <Sparkles size={16} color="black" />
                            )}
                            <Text style={styles.aiButtonText}>AI</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {showAI && (
                <View style={[styles.aiInsight, { backgroundColor: themeColors.background, borderColor: themeColors.primary, borderStyle: 'dashed' }]}>
                    <View style={styles.aiInsightHeader}>
                        <View style={styles.aiInsightTitleRow}>
                            <Sparkles size={16} color="#D9FF00" />
                            <Text style={[styles.aiInsightTitle, { color: themeColors.primary }]}>AI SMART INSIGHT</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAI(false)}>
                            <ChevronUp size={16} color={themeColors.text} />
                        </TouchableOpacity>
                    </View>
                    {loadingAI ? (
                        <View style={styles.aiLoadingContainer}>
                            <ActivityIndicator size="small" color={themeColors.primary} />
                            <Text style={[styles.aiLoadingText, { color: themeColors.text }]}>Analyzing match data...</Text>
                        </View>
                    ) : (
                        <Text style={[styles.aiInsightText, { color: themeColors.text }]}>
                            {insight}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    leagueLogo: {
        width: 20,
        height: 20,
        borderRadius: 2,
    },
    leagueLogoPlaceholder: {
        width: 20,
        height: 15,
        borderRadius: 2,
    },
    leagueName: {
        fontSize: 14,
        opacity: 0.7,
    },
    time: {
        fontSize: 14,
        opacity: 0.7,
    },
    teamsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 16,
    },
    teamColumn: {
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    teamLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    teamLogoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    teamName: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    vsText: {
        fontWeight: 'bold',
        fontSize: 24,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    lockButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buyButton: {
        flex: 3,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    waitButton: {
        flex: 1.5,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    waitButtonText: {
        fontWeight: 'bold',
    },
    oddsButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    oddsText: {
        fontSize: 14,
    },
    predictionButton: {
        flex: 3,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    predictionText: {
        fontSize: 14,
    },
    aiButton: {
        flex: 1.5,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    aiButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    aiInsight: {
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    aiInsightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiInsightTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiInsightTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    aiLoadingContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    aiLoadingText: {
        fontSize: 14,
        opacity: 0.5,
    },
    aiInsightText: {
        fontSize: 16,
        opacity: 0.9,
        lineHeight: 22,
        fontWeight: '500',
    },
});
