import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { ShieldCheck, CreditCard, Sparkles, Key, ArrowRight, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { PlanCard } from '../../components/PlanCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useMembership } from '../../hooks/useMembership';

const VIP_PLAN_FEATURES = [
  'Daily Elite AI Predictions',
  '90%+ Strike Rate Accuracy',
  'Exclusive Match Insights',
  'Priority Support',
];

const PAID_PLAN_FEATURES = [
  'Curated premium predictions',
  'Detailed AI match analysis',
  'Match insights & value bets',
  'Higher accuracy predictions',
];

export default function MembershipStoreScreen() {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const membership = useMembership();
  const [refreshing, setRefreshing] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [enteringToken, setEnteringToken] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await membership.refresh();
    setRefreshing(false);
  }, [membership.refresh]);

  const handleSubscribe = async (productId: string, tier: 'vip' | 'paid') => {
    const result = await membership.subscribe(productId, tier);
    if (!result.success && result.reason !== 'Purchase cancelled') {
      Alert.alert('Purchase Failed', result.reason || 'Could not complete the purchase.');
    }
  };

  const handleRequest = async (tier: 'vip' | 'paid') => {
    const result = await membership.requestAccess(tier);
    Alert.alert(result.success ? 'Request Sent!' : 'Notice', result.success
      ? `Your ${tier.toUpperCase()} request has been submitted to admin.`
      : result.reason || 'Request could not be processed.');
  };

  const handleClaim = async () => {
    const result = await membership.claimAccess(tokenInput);
    if (result.success) {
      setEnteringToken(false);
      setTokenInput('');
      Alert.alert('Success!', 'Your token has been verified. Access granted.');
    } else {
      Alert.alert('Invalid Token', result.reason || 'Token is invalid or already used.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    hero: {
      padding: spacing.xxxl,
      paddingTop: spacing.huge,
      paddingBottom: spacing.xxl,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
      marginBottom: spacing.lg,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      ...shadows.md,
    },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs,
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill,
      backgroundColor: themeColors.primarySoft, borderWidth: 1, borderColor: themeColors.primaryBorder,
    },
    heroBadgeText: { ...typography.gateBadge, color: themeColors.primary },
    heroTitle: { ...typography.gateTitle, color: themeColors.text, marginTop: spacing.md },
    heroSubtitle: { ...typography.gateSubtitle, color: themeColors.textMuted, marginTop: spacing.sm },
    content: { padding: spacing.lg, paddingBottom: spacing.huge + 60, gap: spacing.md },
    sectionTitle: { ...typography.cardTitle, color: themeColors.text, marginTop: spacing.md, marginBottom: spacing.xs },
    plans: { gap: spacing.md },
    tokenCard: { gap: spacing.md },
    tokenLabel: { ...typography.tokenLabel, color: themeColors.textMuted },
    tokenInput: {
      borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      color: themeColors.text, backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border,
      ...typography.tokenInput,
    },
    tokenButtons: { flexDirection: 'row', gap: spacing.sm },
    iapNotice: {
      padding: spacing.md, borderRadius: radii.sm, backgroundColor: themeColors.surfaceMuted,
      borderWidth: 1, borderColor: themeColors.warning,
    },
    iapNoticeText: { fontSize: 13, color: themeColors.textMuted },
    footer: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, gap: spacing.md },
    infoSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    infoIcon: { width: 40, height: 40, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.primarySoft },
    infoContent: { flex: 1, gap: 2 },
    infoTitle: { ...typography.body, color: themeColors.text, fontWeight: '600' },
    infoDesc: { fontSize: 12, color: themeColors.textMuted },
    divider: { height: 1, backgroundColor: themeColors.divider },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} colors={[themeColors.primary]} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={themeColors.primary} />
            <Text style={styles.heroBadgeText}>PREMIUM ACCESS</Text>
          </View>
          <Text style={styles.heroTitle}>UNLEASH THE POWER OF AI</Text>
          <Text style={styles.heroSubtitle}>
            Get professional-grade predictions and insights with over 90% verified strike rate.
          </Text>
        </View>

        {enteringToken && (
          <Card style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>ENTER YOUR ACCESS TOKEN</Text>
            <TextInput
              value={tokenInput}
              onChangeText={setTokenInput}
              placeholder="APP-XXXX-XXXX"
              placeholderTextColor={themeColors.textMuted}
              style={styles.tokenInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.tokenButtons}>
              <View style={{ flex: 1 }}>
                <Button label="Activate access" onPress={handleClaim} loading={membership.verifying} disabled={!tokenInput.trim()} fullWidth icon={ArrowRight} />
              </View>
              <Button label="Cancel" onPress={() => { setEnteringToken(false); setTokenInput(''); }} variant="secondary" />
            </View>
          </Card>
        )}

        {membership.iapError && Platform.OS === 'android' && !membership.iapLoading && (
          <View style={styles.iapNotice}>
            <Text style={styles.iapNoticeText}>
              Google Play Billing unavailable: {membership.iapError.includes('not available')
                ? 'This device may not support Google Play Billing, or you may be running in Expo Go (which disables IAP).'
                : membership.iapError}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>MEMBERSHIP PLANS</Text>
        <View style={styles.plans}>
          <PlanCard
            tier="vip"
            title={membership.plans.vipWeekly.label}
            subtitle="7 Days Full Access"
            features={VIP_PLAN_FEATURES}
            productId={membership.plans.vipWeekly.productId}
            product={membership.products.find((item) => item.id === membership.plans.vipWeekly.productId)}
            status={membership.vipStatus}
            isActiveProduct={membership.activeProductId === membership.plans.vipWeekly.productId}
            priceSuffix="/week"
            formatPrice={membership.formatPrice}
            isLoading={membership.iapLoading}
            purchasing={membership.purchasing === membership.plans.vipWeekly.productId}
            requesting={membership.requesting === 'vip'}
            onSubscribe={() => handleSubscribe(membership.plans.vipWeekly.productId, 'vip')}
            onRequest={() => handleRequest('vip')}
          />
          <PlanCard
            tier="vip"
            title={membership.plans.vipMonthly.label}
            subtitle="30 Days Full Access"
            features={VIP_PLAN_FEATURES}
            productId={membership.plans.vipMonthly.productId}
            product={membership.products.find((item) => item.id === membership.plans.vipMonthly.productId)}
            status={membership.vipStatus}
            isActiveProduct={membership.activeProductId === membership.plans.vipMonthly.productId}
            priceSuffix="/month"
            formatPrice={membership.formatPrice}
            savingsLabel="BEST VALUE — Save vs weekly"
            isLoading={membership.iapLoading}
            purchasing={membership.purchasing === membership.plans.vipMonthly.productId}
            requesting={membership.requesting === 'vip'}
            onSubscribe={() => handleSubscribe(membership.plans.vipMonthly.productId, 'vip')}
            onRequest={() => handleRequest('vip')}
          />
          <PlanCard
            tier="paid"
            title={membership.plans.paidMonthly.label}
            subtitle="30 Days Full Access"
            features={PAID_PLAN_FEATURES}
            productId={membership.plans.paidMonthly.productId}
            product={membership.products.find((item) => item.id === membership.plans.paidMonthly.productId)}
            status={membership.paidStatus}
            isActiveProduct={membership.activeProductId === membership.plans.paidMonthly.productId}
            priceSuffix="/month"
            formatPrice={membership.formatPrice}
            isLoading={membership.iapLoading}
            purchasing={membership.purchasing === membership.plans.paidMonthly.productId}
            requesting={membership.requesting === 'paid'}
            onSubscribe={() => handleSubscribe(membership.plans.paidMonthly.productId, 'paid')}
            onRequest={() => handleRequest('paid')}
          />
        </View>

        {!enteringToken && (
          <Button label="I have a token" onPress={() => setEnteringToken(true)} variant="secondary" icon={Key} fullWidth />
        )}

        <View style={styles.footer}>
          <InfoSection icon={ShieldCheck} title="Verified Results" desc="All our predictions are verified by independent sources." />
          <View style={styles.divider} />
          <InfoSection icon={CreditCard} title="Secure Payments" desc="Payments processed securely via Google Play Billing." />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoSection({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  const { themeColors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.primarySoft }}>
        <Icon size={16} color={themeColors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: themeColors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, color: themeColors.textMuted }}>{desc}</Text>
      </View>
    </View>
  );
}
