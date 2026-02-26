import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { webApi } from '../../api/web';
import { MatchCard } from '../../components/MatchCard';
import { colors } from '../../theme/colors';

export default function FreeTipsScreen() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await webApi.getMatches('free');
            setMatches(data || []);
            setLoading(false);
        };
        loadData();
    }, [selectedDate]);

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
        <View style={[styles.container, { backgroundColor: themeColors.background, padding: 16 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker}>
                {dates.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    return (
                        <TouchableOpacity
                            key={dateStr}
                            style={[styles.dateButton, isSelected && { backgroundColor: themeColors.primary }]}
                            onPress={() => setSelectedDate(dateStr)}
                        >
                            <Text style={[styles.dateText, isSelected && { color: 'black' }]}>
                                {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <ScrollView style={styles.fixtureList} showsVerticalScrollIndicator={false}>
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
                                prediction={match.aiPrediction?.prediction || "H / A"}
                                odds={match.odds?.home || "1.85"}
                                homeScore={match.homeScore}
                                awayScore={match.awayScore}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Free Tips Found</Text>
                        <Text style={[styles.emptySubtitle, { color: themeColors.text }]}>
                            Run live scrape on the web app to get matches.
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
    datePicker: {
        maxHeight: 50,
    },
    dateButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    dateText: {
        fontSize: 14,
    },
    fixtureList: {
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
        gap: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        opacity: 0.5,
    },
    emptySubtitle: {
        textAlign: 'center',
        opacity: 0.3,
    },
});
