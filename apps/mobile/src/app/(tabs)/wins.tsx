import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { colors } from '../../theme/colors';

export default function WinsScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await webApi.getHistory();
            setMatches(data || []);
            setLoading(false);
        };
        loadData();
    }, []);

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
                ) : matches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {matches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                leagueName={match.league}
                                time="FT"
                                homeTeam={match.homeTeam}
                                awayTeam={match.awayTeam}
                                prediction="WIN"
                                odds="2.10"
                                homeScore={match.homeScore}
                                awayScore={match.awayScore}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No Recent Wins Recorded</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.text }]}>
                            Completed matches will appear here.
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
        fontSize: 18,
    },
    emptySubtext: {
        opacity: 0.3,
        marginTop: 8,
    },
});
