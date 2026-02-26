import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { fetchFixturesWithCache } from '../../api/sportmonks';
import { MatchCard } from '../../components/MatchCard';
import { colors } from '../../theme/colors';

export default function VIPTipsScreen() {
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
            <View style={[styles.vipCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.primary }]}>
                <View style={styles.vipContent}>
                    <Crown size={32} color="#D9FF00" />
                    <Text style={[styles.vipTitle, { color: themeColors.text }]}>VIP MEMBERSHIP</Text>
                    <Text style={[styles.vipSubtitle, { color: themeColors.text }]}>Get 100% accurate predictions and daily mega odds.</Text>
                    <TouchableOpacity style={[styles.vipButton, { backgroundColor: themeColors.primary }]}>
                        <Text style={styles.vipButtonText}>JOIN VIP NOW</Text>
                    </TouchableOpacity>
                </View>
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
                                    leagueName={fixture.league?.name || "VIP League"}
                                    time={new Date(fixture.starting_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    homeTeam={home?.name || 'Home'}
                                    awayTeam={away?.name || 'Away'}
                                    isLocked={true}
                                    price={200}
                                />
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No VIP Tips Available</Text>
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
    vipCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    vipContent: {
        alignItems: 'center',
        gap: 8,
    },
    vipTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    vipSubtitle: {
        textAlign: 'center',
        opacity: 0.7,
    },
    vipButton: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    vipButtonText: {
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
