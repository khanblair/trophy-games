import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { shadows, type AppPalette, type ShadowValue } from '../../theme/colors';

export type CardVariant = 'default' | 'elevated' | 'accent' | 'quiet';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

interface CardStyles {
  base: ViewStyle;
  default: ViewStyle;
  elevated: ViewStyle;
  accent: ViewStyle;
  quiet: ViewStyle;
  padded: ViewStyle;
  highlight: ViewStyle;
}

type Spacing = ReturnType<typeof useTheme>['spacing'];
type Radii = ReturnType<typeof useTheme>['radii'];

function createStyles(themeColors: AppPalette, spacing: Spacing, radii: Radii, themeShadows: Record<'none' | 'sm' | 'md' | 'lg' | 'glow', ShadowValue>): CardStyles {
  return StyleSheet.create<CardStyles>({
    base: {
      position: 'relative',
      borderRadius: radii.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    default: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
      ...themeShadows.sm,
    },
    elevated: {
      backgroundColor: themeColors.surfaceElevated,
      borderColor: themeColors.borderStrong,
      ...themeShadows.md,
    },
    accent: {
      backgroundColor: themeColors.surfaceGradientFrom,
      borderColor: themeColors.primaryBorder,
      ...themeShadows.md,
    },
    quiet: {
      backgroundColor: themeColors.surfaceMuted,
      borderColor: themeColors.divider,
      ...shadows.none,
    },
    padded: { padding: spacing.lg },
    highlight: {
      position: 'absolute',
      top: 0,
      left: spacing.lg,
      right: spacing.lg,
      height: 1,
      backgroundColor: themeColors.highlight,
    },
  });
}

/** Rounded surface with a subtle border, top highlight and soft shadow. */
export function Card({
  children,
  variant = 'default',
  padded = true,
  style,
  accessibilityLabel,
}: CardProps) {
  const { themeColors, spacing, radii, shadows: themeShadows } = useTheme();
  const styles = useMemo(
    () => createStyles(themeColors, spacing, radii, themeShadows),
    [themeColors, spacing, radii, themeShadows],
  );
  const variantStyle = {
    default: styles.default,
    elevated: styles.elevated,
    accent: styles.accent,
    quiet: styles.quiet,
  }[variant];

  return (
    <View style={[styles.base, variantStyle, padded && styles.padded, style]} accessibilityLabel={accessibilityLabel}>
      {variant !== 'quiet' && <View style={styles.highlight} pointerEvents="none" />}
      {children}
    </View>
  );
}

export default Card;
