import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { DollarSign, Zap, CheckCircle2, Clock, Send, Key, ArrowRight } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@trophy-games/backend';

import { MatchCard } from '../../components/MatchCard';
import { DatePickerStrip } from '../../components/DatePickerStrip';
import { PlanCard } from '../../components/PlanCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState, LoadingState } from '../../components/ui/States';
import { useTheme } from '../../context/ThemeContext';
import { useMembership, type MemberStatus } from '../../hooks/useMembership';
import { typography } from '../../theme/typography';
import { asFixtureMatches } from '../../types/match';

const FEATURES = [
  'Expert-curated premium picks',
  'Detailed AI match analysis',
  'Higher accuracy predictions',
  'Match insights & value bets',
];

const PAID_FEATURES = [
  'Curated premium predictions',
  'Detailed AI match analysis',
  'Match insights & value bets',
  'Higher accuracy predictions',
];

export default function PaidTipsScreen() {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const membership = useMembership();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [tokenInput, setTokenInput] = useState('');
  const [enteringToken, setEnteringToken] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const memberStatus: MemberStatus = membership.paidStatus;

  const matchesQuery = useQuery(
    api.matches.getByTypeAndDate,
    memberStatus === 'active' ? { matchType: 'paid', date: selectedDate, limit: 100 } : 'skip',
  );
  const matches = asFixtureMatches(matchesQuery);
  const loading = matchesQuery === undefined && memberStatus === 'active';

  const dates = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      list.push(date.toISOString().split('T')[0]);
    }
    return list;
  }, []);

  const uniqueLeagues = useMemo(() => ['All', ...Array.from(new Set(matches.map((match) => match.league))).sort()], [matches]);
  const filteredMatches = matches.filter((match) => selectedLeague === 'All' || match.league === selectedLeague);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await membership.refresh();
    setRefreshing(false);
  }, [membership.refresh]);

  const handleRequest = async () => {
    const result = await membership.requestAccess('paid');
    Alert.alert(result.success ? 'Request Sent!' : 'Notice', result.success
      ? 'Your Premium membership request has been submitted.'
      : result.reason || 'Request could not be processed.');
  };

  const handleSubscribe = async (productId: string) => {
    const result = await membership.subscribe(productId, 'paid');
    if (!result.success && result.reason !== 'Purchase cancelled') {
      Alert.alert('Purchase Failed', result.reason || 'Could not complete the purchase.');
    }
  };

  const handleClaim = async () => {
    const result = await membership.claimAccess(tokenInput);
    if (result.success) {
      setEnteringToken(false);
      setTokenInput('');
      Alert.alert('Access Granted!', 'Welcome to Premium!');
    } else {
      Alert.alert('Invalid Token', result.reason || 'This token is not valid for your account.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    gateContainer: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.huge + 60 },
    gateHero: { gap: spacing.md, marginBottom: spacing.xl },
    gateBadge: {
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs,
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill,
      backgroundColor: themeColors.surfaceMuted, borderWidth: 1, borderColor: themeColors.paid,
    },
    gateBadgeText: { ...typography.gateBadge, color: themeColors.paid },
    gateTitle: { ...typography.gateTitle, color: themeColors.text },
    gateSubtitle: { ...typography.gateSubtitle, color: themeColors.textMuted },
    features: { gap: spacing.sm, marginVertical: spacing.md },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...typography.featureText, color: themeColors.textSecondary, flex: 1 },
    sectionTitle: { ...typography.cardTitle, color: themeColors.text, marginBottom: spacing.sm },
    sectionWrap: { marginTop: spacing.xl, marginBottom: spacing.lg },
    plans: { gap: spacing.md },
    statusCard: { gap: spacing.sm, alignItems: 'center', borderStyle: 'dashed', borderColor: themeColors.paid },
    statusIcon: {
      width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center',
      backgroundColor: themeColors.surfaceMuted,
    },
    statusTitle: { ...typography.pendingTitle, color: themeColors.text },
    statusText: { ...typography.pendingText, color: themeColors.textMuted, textAlign: 'center' },
    tokenCard: { gap: spacing.md },
    tokenLabel: { ...typography.tokenLabel, color: themeColors.textMuted },
    tokenInput: {
      borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      color: themeColors.text, backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border,
      ...typography.tokenInput,
    },
    tokenButtons: { flexDirection: 'row', gap: spacing.sm },
    calendarStrip: { borderBottomWidth: 1, borderBottomColor: themeColors.border },
    filterSection: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    leagueChips: { gap: spacing.sm, paddingVertical: spacing.xs },
    leagueChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill,
      backgroundColor: themeColors.surfaceElevated, borderWidth: 1, borderColor: themeColors.border,
    },
    leagueChipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary, ...shadows.glow, shadowColor: themeColors.primary },
    leagueChipText: { ...typography.chipText },
    activeBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      backgroundColor: themeColors.primarySoft, borderBottomWidth: 1, borderBottomColor: themeColors.primaryBorder,
    },
    activeBannerText: { ...typography.sectionLabel, color: themeColors.paid },
    content: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge + 60 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    fixtureGrid: { gap: spacing.md },
  });

  if (membership.isLoading || memberStatus === 'loading') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingState label="Checking your membership…" />
      </View>
    );
  }

  if (memberStatus !== 'active') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.gateContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.gateHero}>
            <View style={styles.gateBadge}>
              <DollarSign size={15} color={themeColors.paid} />
              <Text style={styles.gateBadgeText}>PREMIUM ACCESS REQUIRED</Text>
            </View>
            <Text style={styles.gateTitle}>PREMIUM TIPS</Text>
            <Text style={styles.gateSubtitle}>
              Get exclusive access to our curated premium predictions with expert analysis.
            </Text>
          </View>

          {/* Membership plans — the same card used on the Membership tab */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>MEMBERSHIP PLANS</Text>
          </View>
          <View style={styles.plans}>
            <PlanCard
              tier="paid"
              title={membership.plans.paidMonthly.label}
              subtitle="30 Days Full Access"
              features={PAID_FEATURES}
              productId={membership.plans.paidMonthly.productId}
              product={membership.products.find((item) => item.id === membership.plans.paidMonthly.productId)}
              status={memberStatus}
              isActiveProduct={membership.activeProductId === membership.plans.paidMonthly.productId}
              priceSuffix="/month"
              formatPrice={membership.formatPrice}
              isLoading={membership.iapLoading}
              purchasing={membership.purchasing === membership.plans.paidMonthly.productId}
              requesting={membership.requesting === 'paid'}
              onSubscribe={() => handleSubscribe(membership.plans.paidMonthly.productId)}
              onRequest={handleRequest}
            />
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>WHAT'S INCLUDED</Text>
            <View style={styles.features}>
              {FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <CheckCircle2 size={14} color={themeColors.paid} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {memberStatus === 'none' && !enteringToken && (
            <Button label="Request paid access" onPress={handleRequest} icon={Send} loading={membership.requesting === 'paid'} fullWidth size="lg" />
          )}

          {memberStatus === 'pending' && !enteringToken && (
            <Card style={styles.statusCard} variant="quiet">
              <View style={styles.statusIcon}><Clock size={20} color={themeColors.paid} /></View>
              <Text style={styles.statusTitle}>Request Under Review</Text>
              <Text style={styles.statusText}>
                Your request is pending admin approval. You will receive an access token shortly.
              </Text>
            </Card>
          )}

          {memberStatus === 'approved' && !enteringToken && (
            <Card style={styles.statusCard} variant="quiet">
              <View style={styles.statusIcon}><CheckCircle2 size={20} color={themeColors.primary} /></View>
              <Text style={styles.statusTitle}>Request Approved!</Text>
              <Text style={styles.statusText}>
                Your Paid access request has been approved. Enter your token below to unlock it.
              </Text>
            </Card>
          )}

          {!enteringToken ? (
            <Button label="I have a token" onPress={() => setEnteringToken(true)} variant="secondary" icon={Key} fullWidth />
          ) : (
            <Card style={styles.tokenCard}>
              <Text style={styles.tokenLabel}>ENTER YOUR ACCESS TOKEN</Text>
              <TextInput
                value={tokenInput}
                onChangeText={setTokenInput}
                placeholder="e.g. PAD-XXXX-XXXX-XXXX"
                placeholderTextColor={themeColors.textMuted}
                style={styles.tokenInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <View style={styles.tokenButtons}>
                <View style={{ flex: 1 }}>
                  <Button label="Verify token" onPress={handleClaim} loading={membership.verifying} disabled={!tokenInput.trim()} fullWidth icon={ArrowRight} />
                </View>
                <Button label="Cancel" onPress={() => { setEnteringToken(false); setTokenInput(''); }} variant="secondary" />
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.calendarStrip}>
        <DatePickerStrip dates={dates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueChips}>
          {uniqueLeagues.map((league) => (
            <TouchableOpacity
              key={league}
              onPress={() => setSelectedLeague(league)}
              style={[styles.leagueChip, selectedLeague === league && styles.leagueChipActive]}
            >
              <Text style={[styles.leagueChipText, { color: selectedLeague === league ? themeColors.onPrimary : themeColors.textMuted }]}>
                {league === 'All' ? 'All' : league.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.activeBanner}>
        <DollarSign size={13} color={themeColors.paid} />
        <Text style={styles.activeBannerText}>PAID ACCESS ACTIVE</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]} />}
      >
        <View style={styles.sectionHeader}>
          <Zap size={15} color={themeColors.paid} fill={themeColors.paid} />
          <Text style={[typography.sectionTitle, { color: themeColors.text }]}>PREMIUM PREDICTIONS</Text>
        </View>

        {loading ? (
          <LoadingState label="Loading premium picks…" />
        ) : filteredMatches.length > 0 ? (
          <View style={styles.fixtureGrid}>
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                matchData={match}
                tier="paid"
                leagueName={match.league}
                leagueLogo={match.leagueLogo}
                countryFlag={match.countryFlag}
                time={new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                homeTeam={match.homeTeam}
                homeTeamLogo={match.homeTeamLogo}
                awayTeam={match.awayTeam}
                awayTeamLogo={match.awayTeamLogo}
                aiInsight={match.aiPrediction}
                prediction={match.aiPrediction?.prediction}
                odds={match.odds?.home}
                homeOdds={match.odds?.home}
                drawOdds={match.odds?.draw}
                awayOdds={match.odds?.away}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={DollarSign}
            title="No Paid Tips Today"
            message="Our analysts are vetting the next set of value picks. Check back shortly."
            hint="Pull down to refresh"
          />
        )}
      </ScrollView>
    </View>
  );
}
