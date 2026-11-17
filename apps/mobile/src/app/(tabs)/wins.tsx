import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { CheckCircle2, Trophy, TrendingUp } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '@trophy-games/backend';

import { MatchCard } from '../../components/MatchCard';
import { DatePickerStrip } from '../../components/DatePickerStrip';
import { Card } from '../../components/ui/Card';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { asFixtureMatches, type FixtureMatch } from '../../types/match';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const toTitleCase = (str: string): string =>
  str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

function getDateRange(): string[] {
  const dates: string[] = [];
  for (let i = -7; i <= 0; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

export default function WinsScreen() {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [matches, setMatches] = useState<FixtureMatch[]>([]);

  const dates = useMemo(() => getDateRange(), []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    if (convex) {
      try {
        const historyData = await convex.query(api.matches.getHistory, { limit: 200 });
        setMatches(asFixtureMatches(historyData));
      } catch (error) {
        console.warn('[Wins Screen] Convex failed:', error);
        setMatches([]);
      }
    } else {
      setMatches([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dayMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchDate = match.matchDate || match.timestamp?.split('T')[0];
      return matchDate === selectedDate;
    });
  }, [matches, selectedDate]);

  const uniqueLeagues = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of dayMatches) counts.set(match.league, (counts.get(match.league) || 0) + 1);
    const leagues = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
    return ['All', ...leagues];
  }, [dayMatches]);

  const filteredMatches = useMemo(() => {
    return dayMatches.filter((match) => selectedLeague === 'All' || match.league === selectedLeague);
  }, [dayMatches, selectedLeague]);

  const onRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const isWin = (match: FixtureMatch): boolean =>
    match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore;
  const winCount = dayMatches.filter(isWin).length;
  const winRate = dayMatches.length > 0 ? Math.round((winCount / dayMatches.length) * 100) : 0;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    calendarStrip: { borderBottomWidth: 1, borderBottomColor: themeColors.border, paddingBottom: 2 },
    filterSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    leaguesScroll: { paddingVertical: spacing.xs, gap: spacing.sm },
    leagueChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm,
      backgroundColor: themeColors.surfaceElevated, borderWidth: 1, borderColor: themeColors.border,
    },
    leagueChipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary, ...shadows.glow, shadowColor: themeColors.primary },
    leagueChipText: { ...typography.chipText },
    statsRow: {
      flexDirection: 'row', paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
      alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: themeColors.border,
    },
    statBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    statValue: { ...typography.statValue, color: themeColors.text },
    statLabel: { ...typography.statLabel, color: themeColors.textMuted },
    statDivider: { width: 1, height: 22, backgroundColor: themeColors.divider },
    content: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    sectionTitle: { ...typography.sectionTitle, color: themeColors.text },
    fixtureGrid: { gap: spacing.md },
  });

  return (
    <View style={styles.container}>
      <View style={styles.calendarStrip}>
        <DatePickerStrip
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          labelOverrides={{ [new Date().toISOString().split('T')[0]]: 'TODAY' }}
        />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leaguesScroll}>
          {uniqueLeagues.map((league) => (
            <TouchableOpacity
              key={league}
              onPress={() => setSelectedLeague(league)}
              style={[styles.leagueChip, selectedLeague === league && styles.leagueChipActive]}
            >
              <Text style={[styles.leagueChipText, { color: selectedLeague === league ? themeColors.onPrimary : themeColors.textMuted }]}>
                {league === 'All' ? 'All' : toTitleCase(league)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Card variant="quiet" style={{ padding: spacing.sm, borderRadius: radii.sm }}>
            <Trophy size={18} color={themeColors.primary} />
          </Card>
          <View>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>STRIKE RATE</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Card variant="quiet" style={{ padding: spacing.sm, borderRadius: radii.sm }}>
            <TrendingUp size={18} color={themeColors.info} />
          </Card>
          <View>
            <Text style={styles.statValue}>{winCount}/{dayMatches.length}</Text>
            <Text style={styles.statLabel}>WINS / TOTAL</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]} />
        }
      >
        <View style={styles.sectionHeader}>
          <CheckCircle2 size={14} color={themeColors.primary} />
          <Text style={styles.sectionTitle}>PROVEN RESULTS</Text>
        </View>

        {loading ? (
          <LoadingState label="Loading results…" />
        ) : filteredMatches.length > 0 ? (
          <View style={styles.fixtureGrid}>
            {filteredMatches.map((match) => (
              <MatchCard
                key={String(match._id || match.id)}
                matchId={match.id}
                matchData={match}
                leagueName={match.league}
                leagueLogo={match.leagueLogo}
                time="FT"
                homeTeam={match.homeTeam}
                homeTeamLogo={match.homeTeamLogo}
                awayTeam={match.awayTeam}
                awayTeamLogo={match.awayTeamLogo}
                prediction={match.result ? match.result.toUpperCase() : (match.aiPrediction?.prediction || 'FT')}
                odds={match.odds?.home || '—'}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                aiInsight={match.aiPrediction}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No Results Yet"
            message="No finished matches for this date. Try another day or pull down to refresh."
          />
        )}
      </ScrollView>
    </View>
  );
}
