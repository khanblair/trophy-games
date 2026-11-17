import { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { ChevronDown, ChevronUp, Lock, Sparkles, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getCountryFlagUrl, getLeagueFlagUrl } from '../lib/flags';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import type { AiPrediction, FixtureMatch, MatchTier } from '../types/match';

const TeamBadge = ({ uri, name }: { uri?: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  const { themeColors, radii } = useTheme();
  const safeName = String(name || '');
  const initials = safeName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
  const flagUri = !uri || failed ? getCountryFlagUrl(safeName) : undefined;

  const boxStyle: ViewStyle = {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (flagUri) {
    return (
      <View style={boxStyle}>
        <Image source={{ uri: flagUri }} style={{ width: 36, height: 24, resizeMode: 'cover' }} />
      </View>
    );
  }
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: themeColors.border,
          backgroundColor: themeColors.surfaceMuted,
          resizeMode: 'contain',
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={boxStyle}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: themeColors.textSecondary, letterSpacing: 0.3 }}>
        {initials || '?'}
      </Text>
    </View>
  );
};

export interface MatchCardProps {
  leagueName: string;
  leagueLogo?: string;
  countryFlag?: string;
  time: string;
  homeTeam: string;
  homeTeamLogo?: string;
  awayTeam: string;
  awayTeamLogo?: string;
  prediction?: string;
  odds?: string;
  homeOdds?: string;
  drawOdds?: string;
  awayOdds?: string;
  isLocked?: boolean;
  price?: number;
  homeScore?: number;
  awayScore?: number;
  aiInsight?: AiPrediction;
  matchId?: string;
  matchData?: FixtureMatch;
  tier?: MatchTier;
}

const TIER_LABEL: Record<Exclude<MatchTier, 'unassigned'>, string> = {
  free: 'FREE',
  paid: 'PAID',
  vip: 'VIP',
};

/** Fixture card: league, kickoff, teams, odds, pick, confidence and expandable AI reasoning. */
export function MatchCard({
  leagueName,
  leagueLogo,
  countryFlag,
  time,
  homeTeam,
  homeTeamLogo,
  awayTeam,
  awayTeamLogo,
  prediction,
  odds,
  homeOdds,
  drawOdds,
  awayOdds,
  isLocked = false,
  price,
  homeScore,
  awayScore,
  aiInsight,
  matchId,
  matchData,
  tier,
}: MatchCardProps) {
  const router = useRouter();
  const { themeColors, spacing, radii, shadows } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const displayTier: Exclude<MatchTier, 'unassigned'> =
    tier && tier !== 'unassigned' ? tier : matchData?.matchType === 'paid' || matchData?.matchType === 'vip' ? matchData.matchType : 'free';
  const tierAccent =
    displayTier === 'vip' ? themeColors.vip : displayTier === 'paid' ? themeColors.paid : themeColors.info;

  const handleCardPress = () => {
    if (!matchId) return;
    const params: Record<string, string> = { id: matchId };
    if (matchData) {
      params.matchData = encodeURIComponent(JSON.stringify(matchData));
    }
    router.push({ pathname: '/match/[id]', params });
  };

  const impliedProbability = (): string => {
    const toNumber = (value: unknown): number => {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    };
    const home = toNumber(matchData?.odds?.home ?? homeOdds ?? odds);
    const draw = toNumber(matchData?.odds?.draw ?? drawOdds);
    const away = toNumber(matchData?.odds?.away ?? awayOdds);

    if (Number.isFinite(home) && home > 1) {
      if (Number.isFinite(draw) && draw > 1 && Number.isFinite(away) && away > 1) {
        const inverse = 1 / home + 1 / draw + 1 / away;
        return `${Math.round(((1 / home) / inverse) * 100)}%`;
      }
      return `${Math.round((1 / home) * 100)}%`;
    }
    return '—';
  };

  const confidence = typeof aiInsight?.confidence === 'number' ? `${aiInsight.confidence}%` : impliedProbability();
  const confidenceLabel = typeof aiInsight?.confidence === 'number' ? 'AI CONFIDENCE' : 'WIN PROBABILITY';
  const pick = typeof prediction === 'string' && prediction.length > 0 ? prediction : aiInsight?.prediction || '—';
  const reasoning = aiInsight?.reasoning ?? [];
  const leagueFlag = countryFlag || leagueLogo || getLeagueFlagUrl(leagueName);

  const styles = StyleSheet.create({
    card: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.surface,
      padding: spacing.lg,
      gap: spacing.md,
      ...shadows.sm,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    leagueLogo: {
      width: 24,
      height: 24,
      borderRadius: radii.xs,
      backgroundColor: themeColors.surfaceMuted,
    },
    leagueName: { ...typography.leagueName, color: themeColors.textSecondary, flex: 1 },
    time: { ...typography.time, color: themeColors.textMuted, fontWeight: '700' },
    tierBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radii.pill,
      backgroundColor: displayTier === 'vip' ? themeColors.primarySoft : displayTier === 'paid' ? themeColors.surfaceMuted : themeColors.surfaceElevated,
      borderWidth: 1,
      borderColor: displayTier === 'free' ? themeColors.border : tierAccent + '55',
    },
    tierText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: tierAccent },
    teams: { gap: spacing.sm },
    teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    teamLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    teamName: { ...typography.teamName, color: themeColors.text, flex: 1 },
    teamRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    score: { ...typography.score, color: themeColors.text, fontSize: 22 },
    oddsBox: {
      minWidth: 40,
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.xs,
      backgroundColor: themeColors.surfaceElevated,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    oddsBoxLabel: { fontSize: 8, fontWeight: '700', color: themeColors.textDisabled },
    oddsBoxValue: { fontSize: 12, fontWeight: '700', color: themeColors.text },
    divider: { height: 1, backgroundColor: themeColors.divider },
    insightRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
    insightBlock: {
      flex: 1,
      minWidth: 0,
      backgroundColor: themeColors.surfaceElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    insightLabel: { ...typography.predictionLabel, color: themeColors.textMuted, marginBottom: spacing.xxs },
    pickText: { fontSize: 13, fontWeight: '800', color: themeColors.primary },
    confidenceText: { fontSize: 13, fontWeight: '800', color: themeColors.text },
    oddsText: { fontSize: 13, fontWeight: '800', color: themeColors.text },
    reasoningToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
    reasoningToggleText: { fontSize: 11, fontWeight: '700', color: themeColors.textMuted },
    reasoningCard: {
      gap: spacing.sm,
      backgroundColor: themeColors.surfaceElevated,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: spacing.md,
    },
    reasoningTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: themeColors.primary },
    reasoningItem: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    reasoningBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: themeColors.primary, marginTop: 6 },
    reasoningText: { ...typography.aiReasoning, color: themeColors.textSecondary, flex: 1, fontSize: 12 },
    betRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
    betText: { fontSize: 11, fontWeight: '700', color: themeColors.text },
    lockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.sm,
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.border,
      borderWidth: 1,
    },
    lockText: { ...typography.lockText, color: themeColors.primary },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`${homeTeam} vs ${awayTeam}, ${time}`}
    >
      <View style={styles.header}>
        {leagueFlag ? <Image source={{ uri: leagueFlag }} style={styles.leagueLogo} /> : null}
        <Text style={styles.leagueName} numberOfLines={1}>{leagueName}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{TIER_LABEL[displayTier]}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>

      <View style={styles.teams}>
        <View style={styles.teamRow}>
          <View style={styles.teamLeft}>
            <TeamBadge uri={homeTeamLogo} name={homeTeam} />
            <Text style={styles.teamName} numberOfLines={1}>{homeTeam}</Text>
          </View>
          <View style={styles.teamRight}>
            {homeScore !== undefined && <Text style={styles.score}>{homeScore}</Text>}
            {homeOdds && (
              <View style={styles.oddsBox}>
                <Text style={styles.oddsBoxLabel}>HOME</Text>
                <Text style={styles.oddsBoxValue}>{homeOdds}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.teamRow}>
          <View style={styles.teamLeft}>
            <TeamBadge uri={awayTeamLogo} name={awayTeam} />
            <Text style={styles.teamName} numberOfLines={1}>{awayTeam}</Text>
          </View>
          <View style={styles.teamRight}>
            {awayScore !== undefined && <Text style={styles.score}>{awayScore}</Text>}
            {awayOdds && (
              <View style={styles.oddsBox}>
                <Text style={styles.oddsBoxLabel}>AWAY</Text>
                <Text style={styles.oddsBoxValue}>{awayOdds}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {isLocked ? (
        <View style={styles.lockBadge}>
          <Lock size={13} color={themeColors.primary} />
          <Text style={styles.lockText}>UNLOCK {price ?? 0} COINS</Text>
        </View>
      ) : (
        <>
          <View style={styles.insightRow}>
            <View style={styles.insightBlock}>
              <Text style={styles.insightLabel}>THE PICK</Text>
              <Text style={styles.pickText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {String(pick)}
              </Text>
            </View>
            <View style={styles.insightBlock}>
              <Text style={styles.insightLabel}>{confidenceLabel}</Text>
              <Text style={styles.confidenceText}>{confidence}</Text>
            </View>
            <View style={styles.insightBlock}>
              <Text style={styles.insightLabel}>ODDS</Text>
              <Text style={styles.oddsText}>{String(odds || '—')}</Text>
            </View>
          </View>

          {reasoning.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setExpanded((value) => !value)}
                activeOpacity={0.75}
                style={styles.reasoningToggle}
                accessibilityRole="button"
                accessibilityLabel={expanded ? 'Hide AI reasoning' : 'Show AI reasoning'}
              >
                <Sparkles size={13} color={themeColors.primary} />
                <Text style={styles.reasoningToggleText}>
                  {expanded ? 'Hide AI reasoning' : 'Why this pick?'}
                </Text>
                {expanded ? <ChevronUp size={13} color={themeColors.textMuted} /> : <ChevronDown size={13} color={themeColors.textMuted} />}
              </TouchableOpacity>

              {expanded && (
                <View style={styles.reasoningCard}>
                  <Text style={styles.reasoningTitle}>AI ANALYSIS</Text>
                  {reasoning.map((item, index) => (
                    <View key={`${index}-${item}`} style={styles.reasoningItem}>
                      <View style={styles.reasoningBullet} />
                      <Text style={styles.reasoningText}>{item}</Text>
                    </View>
                  ))}
                  {aiInsight?.suggestedBet && (
                    <View style={styles.betRow}>
                      <Target size={13} color={themeColors.primary} />
                      <Text style={styles.betText}>Suggested bet: {aiInsight.suggestedBet}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

export default MatchCard;
