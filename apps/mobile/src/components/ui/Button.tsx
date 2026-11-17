import { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { tintedShadow, type AppPalette, type ShadowValue } from '../../theme/colors';
import { typography } from '../../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

interface ButtonStyles {
  base: ViewStyle;
  primary: ViewStyle;
  secondary: ViewStyle;
  ghost: ViewStyle;
  danger: ViewStyle;
  disabled: ViewStyle;
  small: ViewStyle;
  medium: ViewStyle;
  large: ViewStyle;
  fullWidth: ViewStyle;
  smallText: TextStyle;
  mediumText: TextStyle;
  largeText: TextStyle;
  primaryText: TextStyle;
  secondaryText: TextStyle;
  dangerText: TextStyle;
  disabledText: TextStyle;
}

type Spacing = ReturnType<typeof useTheme>['spacing'];
type Radii = ReturnType<typeof useTheme>['radii'];
type Shadows = Record<'none' | 'sm' | 'md' | 'lg' | 'glow', ShadowValue>;

function createStyles(themeColors: AppPalette, spacing: Spacing, radii: Radii, shadows: Shadows): ButtonStyles {
  return StyleSheet.create<ButtonStyles>({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    primary: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
      ...tintedShadow(themeColors.primary, 0.28),
    },
    secondary: {
      backgroundColor: themeColors.surfaceElevated,
      borderColor: themeColors.borderStrong,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: themeColors.error,
      borderColor: themeColors.error,
      ...shadows.sm,
    },
    disabled: {
      backgroundColor: themeColors.disabledSurface,
      borderColor: themeColors.border,
      ...shadows.none,
    },
    small: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radii.sm },
    medium: { minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radii.md },
    large: { minHeight: 56, paddingHorizontal: spacing.xl, borderRadius: radii.lg },
    fullWidth: { width: '100%' },
    smallText: { fontSize: 12, fontWeight: '700' },
    mediumText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
    largeText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
    primaryText: { color: themeColors.onPrimary },
    secondaryText: { color: themeColors.text },
    dangerText: { color: themeColors.onPrimary },
    disabledText: { color: themeColors.disabledText },
  });
}

/** Shared button with explicit primary / secondary / disabled treatment. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const { themeColors, spacing, radii, shadows } = useTheme();
  const styles = useMemo(
    () => createStyles(themeColors, spacing, radii, shadows),
    [themeColors, spacing, radii, shadows],
  );

  const isDisabled = disabled || loading;
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  }[variant];
  const sizeStyle = { sm: styles.small, md: styles.medium, lg: styles.large }[size];
  const textSizeStyle = { sm: styles.smallText, md: styles.mediumText, lg: styles.largeText }[size];
  const textColorStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    ghost: styles.secondaryText,
    danger: styles.dangerText,
  }[variant];
  const spinnerColor = isDisabled
    ? themeColors.disabledText
    : variant === 'secondary' || variant === 'ghost'
      ? themeColors.text
      : themeColors.onPrimary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        sizeStyle,
        variantStyle,
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {Icon && <Icon size={size === 'lg' ? 18 : 15} color={spinnerColor} strokeWidth={2.4} />}
          <Text
            numberOfLines={1}
            style={[typography.primaryBtn, textSizeStyle, isDisabled ? styles.disabledText : textColorStyle]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
