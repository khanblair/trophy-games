import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { ConvexReactClient, useConvexQuery } from "convex/react";
import { api } from '@trophy-games/backend';
import { MatchCard } from '../../components/MatchCard';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function FreeTipsScreen() {
    const [selectedLeague, setSelectedLeague] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leagues, setLeagues] = useState<any[]>([]);
    const { themeColors } = useTheme();

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        if (!convex) {
            console.error('[Convex] Convex client not initialized');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            // Fetch free matches directly from Convex
            const freeMatches = await convex.query(api.matches.get, {
                matchType: 'free',
                limit: 100
            });
            
            // Also fetch unassigned matches (treated as free)
            const unassignedMatches = await convex.query(api.matches.get, {
                matchType: 'unassigned',
                limit: 100
            });
            
            // Combine free and unassigned matches
            const allMatches = [...(freeMatches || []), ...(unassignedMatches || [])];
            
            setMatches(allMatches);
            console.log(`[Home Screen] Loaded ${allMatches.length} free matches from Convex`);
        } catch (error) {
            console.error('[Home Screen] Failed to fetch free matches from Convex:', error);
            setMatches([]);
        }
        
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData();
        // Fetch leagues for filter - using Convex directly
        if (convex) {
            convex.query(api.matches.getAllLeagues).then(setLeagues).catch(console.error);
        }
    }, [loadData, selectedDate]);

    const filteredMatches = matches.filter(m => {
        const matchDate = new Date(m.timestamp).toISOString().split('T')[0];
        const matchesDate = matchDate === selectedDate;
        const leagueMatch = selectedLeague === 'All' || m.league === selectedLeague;
        return matchesDate && leagueMatch;
    });

    const onRefresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    const generateDates = () => {
        const dates = [];
        for (let i = -3; i <= 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const dates = generateDates();

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={[styles.subHeader, { borderBottomColor: themeColors.border }]}>
                <View style={styles.filterSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.leagueFilterContent}
                    >
                        <TouchableOpacity
                            style={[
                                styles.leagueChip,
                                selectedLeague === 'All' && { backgroundColor: themeColors.primary }
                            ]}
                            onPress={() => setSelectedLeague('All')}
                        >
                            <Text style={[styles.leagueChipText, selectedLeague === 'All' ? { color: 'black' } : { color: themeColors.text }]}>
                                ALL
                            </Text>
                        </TouchableOpacity>
                        {leagues.map((league) => (
                            <TouchableOpacity
                                key={league.id}
                                style={[
                                    styles.leagueChip,
                                    selectedLeague === league.name && { backgroundColor: themeColors.primary }
                                ]}
                                onPress={() => setSelectedLeague(league.name)}
                            >
                                <Text style={[styles.leagueChipText, selectedLeague === league.name ? { color: 'black' } : { color: themeColors.text }]}>
                                    {league.name.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.datePickerContent}
                    style={styles.datePicker}
                >
                    {dates.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDate;
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        const dayNum = date.getDate();

                        return (
                            <TouchableOpacity
                                key={dateStr}
                                style={[
                                    styles.dateButton,
                                    isSelected && { backgroundColor: themeColors.primary }
                                ]}
                                onPress={() => setSelectedDate(dateStr)}
                            >
                                <Text style={[styles.dayText, isSelected ? { color: 'black' } : { color: themeColors.textMuted }]}>
                                    {dayName}
                                </Text>
                                <Text style={[styles.numText, isSelected ? { color: 'black' } : { color: themeColors.text }]}>
                                    {dayNum}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
                    </View>
                ) : filteredMatches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {filteredMatches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                matchId={match.id}
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
                        <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <Zap size={40} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>NO FREE TIPS TODAY</Text>
                        <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                            Our AI is still processing the matches. Pull to check for updates.
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
    subHeader: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    filterSection: {
        marginBottom: 4,
    },
    leagueFilterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    leagueChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    leagueChipText: {
        fontSize: 11,
        fontWeight: '900',
    },
    datePicker: {
        flexGrow: 0,
    },
    datePickerContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    dateButton: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dayText: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 2,
    },
    numText: {
        fontSize: 18,
        fontWeight: '900',
    },
    fixtureList: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
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
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptySubtitle: {
        textAlign: 'center',
        fontSize: 14,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});
