import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { colors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';

interface MatchCardProps {
    leagueName: string;
    leagueLogo?: string;
    countryFlag?: string;
    time: string;
    homeTeam: string;
    homeTeamLogo?: string;
    awayTeam: string;
    awayTeamLogo?: string;
    prediction?: string;
    odds?: string;
    isLocked?: boolean;
    price?: number;
    homeScore?: number;
    awayScore?: number;
    aiInsight?: {
        prediction: string;
        confidence: number;
        reasoning: string[];
    };
    matchId?: string;
}

export const MatchCard = ({
    leagueName,
    leagueLogo,
    countryFlag,
    time,
    homeTeam,
    homeTeamLogo,
    awayTeam,
    awayTeamLogo,
    prediction,
    odds,
    isLocked = false,
    price,
    homeScore,
    awayScore,
    aiInsight,
    matchId,
}: MatchCardProps) => {
    const router = useRouter();
    const [showAI, setShowAI] = useState(false);
    const { themeColors } = useTheme();

    const getFlagUrl = (countryName?: string) => {
        if (!countryName) return null;
        const codeMap: Record<string, string> = {
            'England': 'gb-eng',
            'Spain': 'es',
            'Germany': 'de',
            'Italy': 'it',
            'France': 'fr',
            'Netherlands': 'nl',
            'Portugal': 'pt',
            'Brazil': 'br',
            'Argentina': 'ar',
            'USA': 'us',
            'Turkey': 'tr',
            'Scotland': 'gb-sct',
            'Belgium': 'be',
            'Austria': 'at',
            'Switzerland': 'ch',
            'Denmark': 'dk',
            'Norway': 'no',
            'Sweden': 'se',
            'Poland': 'pl',
            'Greece': 'gr',
            'Ukraine': 'ua',
            'Croatia': 'hr',
            'Serbia': 'rs',
            'Japan': 'jp',
            'South Korea': 'kr',
            'Mexico': 'mx',
            'Saudi Arabia': 'sa',
            'Morocco': 'ma',
            'Egypt': 'eg',
            'Nigeria': 'ng',
            'Senegal': 'sn',
        };
        const code = codeMap[countryName] || countryName.toLowerCase().split(' ')[0].substring(0, 2);
        return `https://flagcdn.com/w80/${code}.png`;
    };

    const handleGetInsight = () => {
        if (aiInsight) {
            setShowAI(!showAI);
        }
    };

    const handleCardPress = () => {
        if (matchId) {
            router.push(`/match/${matchId}`);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}
            onPress={handleCardPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.leagueRow}>
                    <View style={styles.logoContainer}>
                        {leagueLogo ? (
                            <Image source={{ uri: leagueLogo }} style={styles.leagueLogo} />
                        ) : countryFlag || getFlagUrl(leagueName) ? (
                            <Image source={{ uri: countryFlag || getFlagUrl(leagueName) || '' }} style={styles.leagueLogo} />
                        ) : (
                            <View style={[styles.leagueLogoPlaceholder, { backgroundColor: themeColors.gray5 }]} />
                        )}
                    </View>
                    <Text style={[styles.leagueName, { color: themeColors.textMuted }]}>{leagueName}</Text>
                </View>
                <Text style={[styles.time, { color: themeColors.textMuted }]}>{time}</Text>
            </View>

            <View style={styles.teamsContainer}>
                <View style={styles.teamRow}>
                    <View style={styles.teamNameContainer}>
                        {homeTeamLogo && <Image source={{ uri: homeTeamLogo }} style={styles.teamLogo} />}
                        <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={1}>{homeTeam}</Text>
                    </View>
                    {homeScore !== undefined && <Text style={[styles.score, { color: themeColors.text }]}>{homeScore}</Text>}
                </View>

                <View style={styles.teamRow}>
                    <View style={styles.teamNameContainer}>
                        {awayTeamLogo && <Image source={{ uri: awayTeamLogo }} style={styles.teamLogo} />}
                        <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={1}>{awayTeam}</Text>
                    </View>
                    {awayScore !== undefined && <Text style={[styles.score, { color: themeColors.text }]}>{awayScore}</Text>}
                </View>
            </View>

            <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                {isLocked ? (
                    <View style={styles.lockedContainer}>
                        <View style={[styles.lockBadge, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Lock size={12} color={themeColors.primary} />
                            <Text style={[styles.lockText, { color: themeColors.primary }]}>UNLOCK {price} COINS</Text>
                        </View>
                        <TouchableOpacity style={[styles.unlockButton, { backgroundColor: themeColors.primary }]}>
                            <Text style={styles.unlockButtonText}>BUY TIP</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.predictionRow}>
                        <View style={styles.predictionSection}>
                            <Text style={[styles.predictionLabel, { color: themeColors.textMuted }]}>PREDICTION</Text>
                            <View style={[styles.predictionChip, { backgroundColor: themeColors.primary }]}>
                                <Text style={styles.predictionValue}>{prediction || 'TIPS'}</Text>
                            </View>
                        </View>

                        <View style={styles.oddsSection}>
                            <Text style={[styles.oddsLabel, { color: themeColors.textMuted }]}>ODDS</Text>
                            <Text style={[styles.oddsValue, { color: themeColors.text }]}>{odds || '1.85'}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.aiChip,
                                { backgroundColor: themeColors.cardBgSecondary, borderColor: themeColors.primary },
                                !aiInsight && { opacity: 0.3 }
                            ]}
                            onPress={handleGetInsight}
                            disabled={!aiInsight}
                        >
                            <Sparkles size={14} color={themeColors.primary} />
                            <Text style={[styles.aiChipText, { color: themeColors.primary }]}>AI</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {showAI && aiInsight && (
                <View style={[styles.aiInsight, { backgroundColor: themeColors.cardBgSecondary, borderLeftColor: themeColors.primary }]}>
                    <View style={styles.aiInsightHeader}>
                        <View style={styles.aiInsightTitleRow}>
                            <Sparkles size={14} color={themeColors.primary} />
                            <Text style={[styles.aiInsightTitle, { color: themeColors.primary }]}>AI SMART ANALYTICS</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAI(false)}>
                            <ChevronUp size={16} color={themeColors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.aiInsightText, { color: themeColors.text }]}>
                        {aiInsight.reasoning?.[0] || aiInsight.prediction || "Advanced analytical model suggests a high probability outcome based on recent form and historical encounters."}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoContainer: {
        width: 24,
        height: 24,
        borderRadius: 6,
        overflow: 'hidden',
    },
    leagueLogo: {
        width: '100%',
        height: '100%',
    },
    leagueLogoPlaceholder: {
        width: '100%',
        height: '100%',
    },
    leagueName: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    time: {
        fontSize: 10,
        fontWeight: '800',
    },
    teamsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    teamLogo: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    score: {
        fontSize: 18,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    footer: {
        borderTopWidth: 1,
        paddingTop: 16,
    },
    predictionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    predictionSection: {
        flex: 1.5,
    },
    predictionLabel: {
        fontSize: 8,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: 1,
    },
    predictionChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    predictionValue: {
        fontSize: 11,
        fontWeight: '900',
        color: 'black',
    },
    oddsSection: {
        flex: 1,
    },
    oddsLabel: {
        fontSize: 8,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: 1,
    },
    oddsValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    aiChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    aiChipText: {
        fontSize: 10,
        fontWeight: '900',
    },
    lockedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    lockText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    unlockButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    unlockButtonText: {
        color: 'black',
        fontSize: 10,
        fontWeight: '900',
    },
    aiInsight: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    aiInsightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    aiInsightTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiInsightTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    aiInsightText: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
    },
});
