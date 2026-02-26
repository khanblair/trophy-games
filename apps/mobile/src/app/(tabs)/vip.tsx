import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { colors } from '../../theme/colors';

export default function VIPTipsScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await webApi.getMatches('vip');
            setMatches(data || []);
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
                ) : matches.length > 0 ? (
                    <View style={styles.fixtureGrid}>
                        {matches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                leagueName={match.league}
                                time={new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                homeTeam={match.homeTeam}
                                awayTeam={match.awayTeam}
                                isLocked={true}
                                price={200}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: themeColors.text }]}>No VIP Tips Available</Text>
                        <Text style={[styles.emptySubtext, { color: themeColors.text }]}>
                            Mark matches as VIP in the web app.
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
    emptySubtext: {
        opacity: 0.3,
        marginTop: 8,
    },
});
