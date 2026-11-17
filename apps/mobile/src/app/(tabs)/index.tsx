import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { Zap, Search, SlidersHorizontal } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@trophy-games/backend';
import { MatchCard } from '../../components/MatchCard';
import { DatePickerStrip } from '../../components/DatePickerStrip';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { asFixtureMatches } from '../../types/match';
import i18n from '../../locales';

const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

export default function FreeTipsScreen() {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const matchesQuery = useQuery(api.matches.getByTypeAndDate, {
    matchType: 'free',
    date: selectedDate,
    limit: 100,
  });

  const matches = asFixtureMatches(matchesQuery);
  const loading = matchesQuery === undefined;

  const leagues = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of matches) counts.set(match.league, (counts.get(match.league) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => ({ name, id: name }));
  }, [matches]);

  const filteredMatches = matches.filter((match) => {
    const leagueMatch = selectedLeague === 'All' || match.league === selectedLeague;
    const query = searchQuery.toLowerCase();
    const searchMatch = !query ||
      match.homeTeam.toLowerCase().includes(query) ||
      match.awayTeam.toLowerCase().includes(query) ||
      match.league.toLowerCase().includes(query);
    return leagueMatch && searchMatch;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const dates = useMemo(() => {
    const list: string[] = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      list.push(date.toISOString().split('T')[0]);
    }
    return list;
  }, []);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    subHeader: {
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      gap: spacing.md,
    },
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
    filterLabel: { color: themeColors.textMuted, ...typography.sectionLabel },
    leagueContent: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
    leagueChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: themeColors.surfaceElevated,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    leagueChipActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
      ...shadows.glow,
      shadowColor: themeColors.primary,
    },
    leagueChipText: { ...typography.chipText, letterSpacing: 0.2 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 46,
      marginHorizontal: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      backgroundColor: themeColors.surfaceElevated,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    searchInput: { flex: 1, color: themeColors.text, fontSize: 14, fontWeight: '500', padding: 0 },
    fixtureList: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge + 60 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    sectionTitle: { ...typography.sectionTitle, color: themeColors.text },
    sectionCount: { color: themeColors.textMuted, fontSize: 11, fontWeight: '700' },
    fixtureGrid: { gap: spacing.md },
  });

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <View style={styles.filterRow}>
          <SlidersHorizontal size={14} color={themeColors.primary} />
          <Text style={styles.filterLabel}>FILTER BY LEAGUE</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueContent}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.leagueChip, selectedLeague === 'All' && styles.leagueChipActive]}
            onPress={() => setSelectedLeague('All')}
          >
            <Text style={[styles.leagueChipText, { color: selectedLeague === 'All' ? themeColors.onPrimary : themeColors.textMuted }]}>
              All
            </Text>
          </TouchableOpacity>
          {leagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              activeOpacity={0.8}
              style={[styles.leagueChip, selectedLeague === league.name && styles.leagueChipActive]}
              onPress={() => setSelectedLeague(league.name)}
            >
              <Text style={[styles.leagueChipText, { color: selectedLeague === league.name ? themeColors.onPrimary : themeColors.textMuted }]}>
                {toTitleCase(league.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchBar}>
          <Search size={18} color={themeColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams or leagues..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <DatePickerStrip dates={dates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </View>

      <ScrollView
        style={styles.fixtureList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]} />
        }
      >
        <View style={styles.sectionHeader}>
          <Zap size={15} color={themeColors.primary} fill={themeColors.primary} />
          <Text style={styles.sectionTitle}>FREE PICKS</Text>
          {!loading && <Text style={styles.sectionCount}>{filteredMatches.length}</Text>}
        </View>

        {loading ? (
          <LoadingState label="Loading today's fixtures…" />
        ) : filteredMatches.length > 0 ? (
          <View style={styles.fixtureGrid}>
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                matchData={match}
                tier="free"
                leagueName={match.league}
                leagueLogo={match.leagueLogo}
                countryFlag={match.countryFlag}
                time={new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                homeTeam={match.homeTeam}
                homeTeamLogo={match.homeTeamLogo}
                awayTeam={match.awayTeam}
                awayTeamLogo={match.awayTeamLogo}
                prediction={match.aiPrediction?.prediction}
                odds={match.odds?.home}
                homeOdds={match.odds?.home}
                drawOdds={match.odds?.draw}
                awayOdds={match.odds?.away}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                aiInsight={match.aiPrediction}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Zap}
            title={i18n.t('home.noMatches')}
            message="No free picks match this date or filter. Try another day or adjust your search."
            hint="Pull down to refresh"
          />
        )}
      </ScrollView>
    </View>
  );
}
