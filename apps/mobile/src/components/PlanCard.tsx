import { StyleSheet, Text, View } from 'react-native';
import {
  Crown,
  Trophy,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import type { ProductSubscription } from '../hooks/useIap';
import type { MemberStatus, MembershipTier } from '../hooks/useMembership';
import { typography } from '../theme/typography';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export interface PlanCardProps {
  tier: MembershipTier;
  title: string;
  subtitle: string;
  features: readonly string[];
  productId: string;
  product?: ProductSubscription;
  status: MemberStatus;
  isActiveProduct: boolean;
  priceSuffix: string;
  formatPrice: (product?: ProductSubscription) => string | null;
  savingsLabel?: string;
  isLoading: boolean;
  purchasing: boolean;
  requesting: boolean;
  onSubscribe: () => void;
  onRequest: () => void;
}

const STATUS_CONFIG: Record<'subscribed' | 'pending' | 'approved' | 'active', { label: string; icon: LucideIcon; token: 'primary' | 'warning' | 'success' }> = {
  subscribed: { label: 'SUBSCRIBED', icon: ShoppingCart, token: 'primary' },
  pending: { label: 'PENDING', icon: Clock, token: 'warning' },
  approved: { label: 'APPROVED', icon: CheckCircle2, token: 'success' },
  active: { label: 'ACTIVE', icon: Crown, token: 'primary' },
};

function PlanStatusBadge({ status, subscribed }: { status: MemberStatus; subscribed: boolean }) {
  const { themeColors, spacing, radii } = useTheme();
  const config = subscribed
    ? STATUS_CONFIG.subscribed
    : status === 'pending' || status === 'approved' || status === 'active'
      ? STATUS_CONFIG[status]
      : null;

  if (!config) return null;
  const accent = config.token === 'warning' ? themeColors.warning : themeColors.primary;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.pill,
        backgroundColor: config.token === 'warning' ? themeColors.surfaceMuted : themeColors.primarySoft,
        borderWidth: 1,
        borderColor: config.token === 'warning' ? themeColors.borderStrong : themeColors.primaryBorder,
      }}
    >
      <config.icon size={10} color={accent} strokeWidth={2.6} />
      <Text style={[typography.statusText, { color: accent }]}>{config.label}</Text>
    </View>
  );
}

/** The membership plan card shared by the Store, Premium and VIP tabs. */
export function PlanCard({
  tier,
  title,
  subtitle,
  features,
  productId,
  product,
  status,
  isActiveProduct,
  priceSuffix,
  formatPrice,
  savingsLabel,
  isLoading,
  purchasing,
  requesting,
  onSubscribe,
  onRequest,
}: PlanCardProps) {
  const { themeColors, spacing, radii } = useTheme();
  const styles = StyleSheet.create({
    card: { gap: spacing.md },
    top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.primarySoft,
      borderColor: themeColors.primaryBorder,
      borderWidth: 1,
    },
    title: { ...typography.planTitle, color: themeColors.text },
    subtitle: { fontSize: 12, color: themeColors.textMuted, marginTop: 2 },
    features: { gap: spacing.sm, marginTop: spacing.xs },
    feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...typography.body, color: themeColors.textSecondary, flex: 1 },
    savings: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
      backgroundColor: themeColors.primarySoft,
      borderColor: themeColors.primaryBorder,
      borderWidth: 1,
    },
    savingsText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, color: themeColors.primary },
    actionGroup: { gap: spacing.sm, marginTop: spacing.xs },
    stateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 48,
      borderRadius: radii.md,
      backgroundColor: themeColors.surfaceMuted,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    stateText: { ...typography.medium, color: themeColors.textSecondary, textAlign: 'center' },
    loadingText: { fontSize: 13, color: themeColors.textMuted },
  });

  const Icon: LucideIcon = tier === 'vip' ? Crown : Trophy;
  const price = formatPrice(product);
  const subscribed = status !== 'none' && status !== 'loading' && isActiveProduct;

  const actions = () => {
    if (isLoading) {
      return <Button label="Checking access…" onPress={() => undefined} loading disabled fullWidth />;
    }
    if (status === 'none') {
      return (
        <View style={styles.actionGroup}>
          <Button
            label={price ? `${price}${priceSuffix}` : `Subscribe ${priceSuffix.replace('/', 'per ')}`}
            onPress={onSubscribe}
            icon={ShoppingCart}
            loading={purchasing}
            disabled={purchasing || requesting}
            fullWidth
            size="lg"
          />
          <Button
            label="Request token manually"
            onPress={onRequest}
            variant="secondary"
            loading={requesting}
            disabled={requesting || purchasing}
            fullWidth
            size="sm"
          />
        </View>
      );
    }
    if (status === 'pending') {
      return (
        <View style={styles.stateRow}>
          <Clock size={16} color={themeColors.warning} />
          <Text style={styles.stateText}>Reviewing your request…</Text>
        </View>
      );
    }
    return (
      <View style={[styles.stateRow, { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primaryBorder }]}>
        <CheckCircle2 size={16} color={themeColors.primary} />
        <Text style={[styles.stateText, { color: themeColors.primary }]}>Access active</Text>
      </View>
    );
  };

  return (
    <Card variant={isActiveProduct ? 'accent' : 'default'} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon size={22} color={themeColors.primary} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
        <PlanStatusBadge status={status} subscribed={subscribed} />
      </View>

      <View style={styles.features}>
        {features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <CheckCircle2 size={14} color={themeColors.primary} strokeWidth={2.4} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {savingsLabel && (
        <View style={styles.savings}>
          <Zap size={11} color={themeColors.primary} fill={themeColors.primary} />
          <Text style={styles.savingsText}>{savingsLabel}</Text>
        </View>
      )}

      {actions()}

      {tier === 'vip' && !savingsLabel && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Sparkles size={11} color={themeColors.textDisabled} />
          <Text style={{ fontSize: 10, color: themeColors.textDisabled }}>Elite tier · verified accuracy</Text>
        </View>
      )}
    </Card>
  );
}

export default PlanCard;
