import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { DollarSign, ShoppingCart, Zap } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

export default function PaidTipsScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { themeColors } = useTheme();

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        await webApi.clearCache();
        const data = await webApi.getMatches('paid');
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
            <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: themeColors.cardBgSecondary, borderLeftColor: themeColors.orange9, borderLeftWidth: 4 }]}>
                    <View style={styles.actionIconWrapper}>
                        <DollarSign size={20} color={themeColors.orange9} />
                    </View>
                    <View>
                        <Text style={[styles.actionLabel, { color: themeColors.textMuted }]}>REWARDS</Text>
                        <Text style={[styles.actionTitle, { color: themeColors.text }]}>EARN COINS</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: themeColors.primary }]}>
                    <View style={[styles.actionIconWrapper, { backgroundColor: 'black' }]}>
                        <ShoppingCart size={18} color={themeColors.primary} />
                    </View>
                    <View>
                        <Text style={[styles.actionLabel, { color: 'rgba(0,0,0,0.5)' }]}>STORE</Text>
                        <Text style={[styles.actionTitle, { color: 'black' }]}>BUY COINS</Text>
                    </View>
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
                    <Zap size={16} color={themeColors.orange9} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>PREMIUM PREDICTIONS</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                    </View>
                ) : matches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {matches.map((match: any) => (
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
                                price={50}
                                aiInsight={match.aiPrediction}
                                prediction={match.prediction}
                                odds={match.odds?.home}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.cardBgSecondary }]}>
                            <DollarSign size={40} color={themeColors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Paid Tips Available</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                            Our analysts are currently vetting the next set of value picks.
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
    headerActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    actionIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    actionLabel: {
        fontSize: 9,
        fontWeight: '900',
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '900',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
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
