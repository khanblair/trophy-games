import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/** Friendly, reusable empty state used on every data screen. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  hint,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: radii.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.primarySoft,
      borderColor: themeColors.primaryBorder,
      borderWidth: 1,
      ...shadows.sm,
    },
    copy: { alignItems: 'center', gap: spacing.xs },
    title: { ...typography.emptyTitle, color: themeColors.text, textAlign: 'center' },
    message: { ...typography.emptySubtitle, color: themeColors.textMuted, textAlign: 'center' },
    hint: {
      color: themeColors.textDisabled,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    action: { marginTop: spacing.sm },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Icon size={34} color={themeColors.primary} strokeWidth={1.8} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" />
        </View>
      )}
    </View>
  );
}

export interface LoadingStateProps {
  label?: string;
  minHeight?: number;
}

export function LoadingState({ label = 'Loading predictions…', minHeight = 220 }: LoadingStateProps) {
  const { themeColors, spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight, gap: spacing.md }}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <Text style={{ color: themeColors.textMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
