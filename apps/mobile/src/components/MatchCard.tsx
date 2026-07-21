import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { getCountryFlagUrl } from '../lib/flags';

const TeamBadge = ({ uri, name }: { uri?: string; name: string }) => {
    const [failed, setFailed] = useState(false);
    const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
    const flagUri = !uri || failed ? getCountryFlagUrl(name) : undefined;

    if (flagUri) {
        return (
            <View style={badgeStyles.flagBox}>
                <Image source={{ uri: flagUri }} style={badgeStyles.flag} />
            </View>
        );
    }
    if (uri && !failed) {
        return <Image source={{ uri }} style={badgeStyles.logo} onError={() => setFailed(true)} />;
    }
    return <View style={badgeStyles.initialsBox}><Text style={badgeStyles.initials}>{initials}</Text></View>;
};

const badgeStyles = StyleSheet.create({
    logo: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
    flagBox: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(128,128,128,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
    flag: { width: 36, height: 24, resizeMode: 'cover' },
    initialsBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(128,128,128,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
    initials: { fontSize: 11, fontWeight: '700', textAlign: 'center', color: '#888', letterSpacing: 0.3 },
});

import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
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
    homeOdds?: string;
    awayOdds?: string;
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
    matchData?: any;
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
    homeOdds,
    awayOdds,
    isLocked = false,
    price,
    homeScore,
    awayScore,
    aiInsight,
    matchId,
    matchData,
}: MatchCardProps) => {
    const router = useRouter();
    const { themeColors } = useTheme();

    const getFlagUrl = (countryName?: string) => {
        if (!countryName) return null;
        const codeMap: Record<string, string> = {
            'England': 'gb-eng', 'Spain': 'es', 'Germany': 'de', 'Italy': 'it',
            'France': 'fr', 'Netherlands': 'nl', 'Portugal': 'pt', 'Brazil': 'br',
            'Argentina': 'ar', 'USA': 'us', 'Turkey': 'tr', 'Scotland': 'gb-sct',
            'Belgium': 'be', 'Austria': 'at', 'Switzerland': 'ch', 'Denmark': 'dk',
            'Norway': 'no', 'Sweden': 'se', 'Poland': 'pl', 'Greece': 'gr',
            'Ukraine': 'ua', 'Croatia': 'hr', 'Serbia': 'rs', 'Japan': 'jp',
            'South Korea': 'kr', 'Mexico': 'mx', 'Saudi Arabia': 'sa',
            'Morocco': 'ma', 'Egypt': 'eg', 'Nigeria': 'ng', 'Senegal': 'sn',
        };
        const code = codeMap[countryName] || countryName.toLowerCase().split(' ')[0].substring(0, 2);
        return `https://flagcdn.com/w80/${code}.png`;
    };

    const handleCardPress = () => {
        if (matchId) {
            const params: Record<string, string> = { id: matchId };
            if (matchData) {
                params.matchData = encodeURIComponent(JSON.stringify(matchData));
            }
            router.push({ pathname: '/match/[id]', params } as any);
        }
    };

    // Win rate: AI confidence > implied probability from bookmaker odds > dash
    const computeWinRate = (): string => {
        if (aiInsight?.confidence) return `${aiInsight.confidence}%`;

        // Derive implied home-win probability from decimal odds (normalised)
        const h = parseFloat(matchData?.odds?.home ?? odds ?? '');
        const d = parseFloat(matchData?.odds?.draw ?? '');
        const a = parseFloat(matchData?.odds?.away ?? '');

        if (!isNaN(h) && h > 1) {
            if (!isNaN(d) && d > 1 && !isNaN(a) && a > 1) {
                // Three-way market: remove overround via normalisation
                const inv = 1 / h + 1 / d + 1 / a;
                return `${Math.round((1 / h) / inv * 100)}%`;
            }
            // Two-way market fallback
            return `${Math.round((1 / h) * 100)}%`;
        }
        return '—';
    };
    const winRate = computeWinRate();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}
            onPress={handleCardPress}
            activeOpacity={0.7}
        >
            {/* Header: league + time */}
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

            {/* Teams */}
            <View style={styles.teamsContainer}>
                <View style={styles.teamRow}>
                    <View style={styles.teamNameContainer}>
                        <TeamBadge uri={homeTeamLogo} name={homeTeam} />
                        <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={1}>{homeTeam}</Text>
                    </View>
                    <View style={styles.teamRightSection}>
                        {homeScore !== undefined && <Text style={[styles.score, { color: themeColors.text }]}>{homeScore}</Text>}
                        {homeOdds && (
                            <View style={[styles.teamOddsBox, { backgroundColor: themeColors.cardBgSecondary }]}>
                                <Text style={[styles.teamOddsLabel, { color: themeColors.textMuted }]}>1</Text>
                                <Text style={[styles.teamOddsValue, { color: themeColors.primary }]}>{homeOdds}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.teamRow}>
                    <View style={styles.teamNameContainer}>
                        <TeamBadge uri={awayTeamLogo} name={awayTeam} />
                        <Text style={[styles.teamName, { color: themeColors.text }]} numberOfLines={1}>{awayTeam}</Text>
                    </View>
                    <View style={styles.teamRightSection}>
                        {awayScore !== undefined && <Text style={[styles.score, { color: themeColors.text }]}>{awayScore}</Text>}
                        {awayOdds && (
                            <View style={[styles.teamOddsBox, { backgroundColor: themeColors.cardBgSecondary }]}>
                                <Text style={[styles.teamOddsLabel, { color: themeColors.textMuted }]}>2</Text>
                                <Text style={[styles.teamOddsValue, { color: themeColors.primary }]}>{awayOdds}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                {isLocked ? (
                    <View style={styles.lockedContainer}>
                        <View style={[styles.lockBadge, { backgroundColor: themeColors.cardBgSecondary, borderColor: themeColors.border }]}>
                            <Lock size={12} color={themeColors.primary} />
                            <Text style={[styles.lockText, { color: themeColors.primary }]}>UNLOCK {price} COINS</Text>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.unlockButton, { backgroundColor: themeColors.primary, shadowColor: themeColors.primary }]}
                        >
                            <Text style={styles.unlockButtonText}>BUY TIP</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.predictionRow}>
                        <View style={styles.predictionWrap}>
                            <Text style={[styles.predictionLabel, { color: themeColors.textMuted }]}>WIN RATE</Text>
                            <View style={[styles.predictionChip, { backgroundColor: themeColors.primary, shadowColor: themeColors.primary }]}>
                                <Text
                                    style={styles.predictionValue}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    {winRate}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.oddsWrap}>
                            <Text style={[styles.oddsLabel, { color: themeColors.textMuted }]}>ODDS</Text>
                            <Text style={[styles.oddsValue, { color: themeColors.text }]}>{odds || '—'}</Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        marginVertical: 6,
        // Remove harsh borders, use subtle shadow
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
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
        width: 22,
        height: 22,
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
        ...typography.leagueName,
        letterSpacing: 0.2,
    },
    time: {
        ...typography.time,
        letterSpacing: 0.2,
    },
    teamsContainer: {
        gap: 10,
        marginBottom: 14,
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    teamName: {
        ...typography.teamName,
        flex: 1,
    },
    score: {
        ...typography.score,
    },
    teamRightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teamOddsBox: {
        alignItems: 'center',
        minWidth: 38,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 8,
    },
    teamOddsLabel: {
        ...typography.teamOddsLabel,
    },
    teamOddsValue: {
        ...typography.teamOddsValue,
    },
    footer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 12,
    },
    predictionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    predictionWrap: {
        minWidth: 0,
    },
    predictionLabel: {
        ...typography.predictionLabel,
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    predictionChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 9,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 4,
    },
    predictionValue: {
        ...typography.predictionValue,
    },
    oddsWrap: {
        alignItems: 'flex-end',
    },
    oddsLabel: {
        ...typography.oddsLabel,
        letterSpacing: 0.4,
        marginBottom: 3,
    },
    oddsValue: {
        ...typography.oddsValue,
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
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
    },
    lockText: {
        ...typography.lockText,
        letterSpacing: 0.2,
    },
    unlockButton: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 4,
    },
    unlockButtonText: {
        color: 'white',
        ...typography.result,
        letterSpacing: 0.3,
    },
});
