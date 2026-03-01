import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Crown, Calendar, Filter } from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

export default function VIPTipsScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { themeColors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedLeague, setSelectedLeague] = useState('All');

    const dates = useMemo(() => {
        const d = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            d.push(date.toISOString().split('T')[0]);
        }
        return d;
    }, []);

    const uniqueLeagues = useMemo(() => {
        const leagues = Array.from(new Set(matches.map(m => m.league))).sort();
        return ['All', ...leagues];
    }, [matches]);

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            const matchDate = match.timestamp.split('T')[0];
            const dateMatch = matchDate === selectedDate;
            const leagueMatch = selectedLeague === 'All' || match.league === selectedLeague;
            return dateMatch && leagueMatch;
        });
    }, [matches, selectedDate, selectedLeague]);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        await webApi.clearCache();
        const data = await webApi.getMatches('vip');
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
            <View style={styles.calendarStrip}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
                    {dates.map((date) => {
                        const d = new Date(date);
                        const isSelected = date === selectedDate;
                        return (
                            <TouchableOpacity
                                key={date}
                                onPress={() => setSelectedDate(date)}
                                style={[
                                    styles.dateButton,
                                    isSelected && { backgroundColor: themeColors.primary }
                                ]}
                            >
                                <Text style={[styles.dayName, { color: isSelected ? 'black' : themeColors.textMuted }]}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                </Text>
                                <Text style={[styles.dayDate, { color: isSelected ? 'black' : themeColors.text }]}>
                                    {d.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

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

            <View style={styles.vipBanner}>
                <View style={[styles.vipBadge, { backgroundColor: themeColors.primary }]}>
                    <Crown size={20} color="black" />
                    <Text style={styles.vipBadgeText}>ELITE ACCESS</Text>
                </View>
                <Text style={[styles.vipTitle, { color: themeColors.text }]}>JOIN THE 1%</Text>
                <Text style={[styles.vipSubtitle, { color: themeColors.textMuted }]}>
                    Get access to our most accurate AI predictions with verified 90%+ strike rate.
                </Text>
                <TouchableOpacity style={[styles.vipButton, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.vipButtonText}>GET VIP MEMBERSHIP</Text>
                </TouchableOpacity>
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
                    <Crown size={16} color={themeColors.primary} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>TODAY'S VIP PICKS</Text>
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
                                time={new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                homeTeam={match.homeTeam}
                                homeTeamLogo={match.homeTeamLogo}
                                awayTeam={match.awayTeam}
                                awayTeamLogo={match.awayTeamLogo}
                                isLocked={true}
                                price={200}
                                aiInsight={match.aiPrediction}
                                prediction={match.prediction}
                                odds={match.odds?.home}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Crown size={40} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No VIP Tips Available</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            New elite predictions are being analyzed. Check back soon.
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
    vipBanner: {
        padding: 24,
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(217, 255, 0, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(217, 255, 0, 0.1)',
    },
    vipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    vipBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: 'black',
        letterSpacing: 1,
    },
    vipTitle: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    vipSubtitle: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    vipButton: {
        marginTop: 8,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#D9FF00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    vipButtonText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    calendarStrip: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    datesContainer: {
        gap: 12,
    },
    dateButton: {
        width: 50,
        height: 65,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dayName: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 4,
    },
    dayDate: {
        fontSize: 18,
        fontWeight: '900',
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingTop: 8,
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
        paddingVertical: 60,
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
