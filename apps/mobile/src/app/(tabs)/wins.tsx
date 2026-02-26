import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { fetchFixturesWithCache } from '../../api/sportmonks';
import { MatchCard } from '../../components/MatchCard';
import { colors } from '../../theme/colors';

export default function WinsScreen() {
    const [fixtures, setFixtures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchFixturesWithCache(dateStr);
            setFixtures(data || []);
            setLoading(false);
        };
        loadData();
    }, [dateStr]);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background, padding: 16 }]}>
            <View style={styles.header}>
                <CheckCircle2 size={24} color="#D9FF00" />
                <Text style={[styles.title, { color: themeColors.text }]}>RECENT WINS</Text>
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
                                    leagueName={fixture.league?.name || "League Win"}
                                    time="FT"
                                    homeTeam={home?.name || 'Home'}
                                    awayTeam={away?.name || 'Away'}
                                    prediction="WIN"
                                    odds="2.10"
                                />
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Recent Wins Recorded</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
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
