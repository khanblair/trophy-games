import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { DollarSign, ShoppingCart } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { fetchFixturesWithCache } from '../../api/sportmonks';
import { MatchCard } from '../../components/MatchCard';
import { colors } from '../../theme/colors';

export default function PaidTipsScreen() {
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
    const date = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchFixturesWithCache(date);
            setFixtures(data || []);
            setLoading(false);
        };
        loadData();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background, padding: 16 }]}>
            <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.earnButton, { backgroundColor: themeColors.orange9 }]}>
                    <DollarSign size={18} color="white" />
                    <Text style={styles.earnButtonText}>EARN COIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.buyButton, { backgroundColor: themeColors.primary }]}>
                    <ShoppingCart size={18} color="black" />
                    <Text style={styles.buyButtonText}>BUY COIN</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary} />
                    </View>
                ) : fixtures.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {fixtures.map((fixture: any) => {
                            const home = fixture.participants?.find((p: any) => p.meta?.location === 'home');
                            const away = fixture.participants?.find((p: any) => p.meta?.location === 'away');

                            return (
                                <MatchCard
                                    key={fixture.id}
                                    leagueName={fixture.league?.name || "Premium League"}
                                    time={new Date(fixture.starting_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    homeTeam={home?.name || 'Home'}
                                    awayTeam={away?.name || 'Away'}
                                    isLocked={true}
                                    price={50}
                                />
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Paid Tips Available</Text>
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
        gap: 12,
        marginBottom: 16,
    },
    earnButton: {
        flex: 1,
        flexDirection: 'row',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    earnButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    buyButton: {
        flex: 1,
        flexDirection: 'row',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buyButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    fixtureGrid: {
        gap: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        opacity: 0.5,
    },
});
