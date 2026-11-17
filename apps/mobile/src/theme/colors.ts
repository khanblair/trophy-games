/**
 * Single source of truth for the mobile design system.
 *
 * Every screen consumes colours, spacing, radii and shadows from here through
 * `useTheme()`. Keeping the tokens in one file is what makes the dark / green
 * identity consistent across the app.
 */

export interface ShadowValue {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface AppPalette {
  /** App background and elevated surfaces */
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceGradientFrom: string;
  surfaceGradientTo: string;

  /** Brand */
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primaryBorder: string;
  onPrimary: string;

  /** Typography */
  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  /** Lines and overlays */
  border: string;
  borderStrong: string;
  divider: string;
  overlay: string;
  glass: string;
  highlight: string;
  shadow: string;

  /** Semantic / tier accents */
  success: string;
  warning: string;
  error: string;
  info: string;
  paid: string;
  vip: string;
  free: string;

  /** Control states */
  disabledSurface: string;
  disabledText: string;

  /* ---- Legacy aliases kept so every consumer shares the same tokens ---- */
  cardBg: string;
  cardBgSecondary: string;
  primaryMuted: string;
  secondary: string;
  gray5: string;
  orange9: string;
  blue2: string;
  blue10: string;
}

const dark: AppPalette = {
  background: '#070B09',
  surface: '#0F1711',
  surfaceElevated: '#16211A',
  surfaceMuted: '#1E2B22',
  surfaceGradientFrom: '#132019',
  surfaceGradientTo: '#0D140F',

  primary: '#00C805',
  primaryStrong: '#00A304',
  primarySoft: 'rgba(0, 200, 5, 0.13)',
  primaryBorder: 'rgba(0, 200, 5, 0.32)',
  onPrimary: '#04140A',

  text: '#F4F8F5',
  textSecondary: '#C4D0C7',
  textMuted: '#8B9A90',
  textDisabled: '#5B6A61',

  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.65)',
  glass: 'rgba(255, 255, 255, 0.04)',
  highlight: 'rgba(255, 255, 255, 0.07)',
  shadow: 'rgba(0, 0, 0, 0.55)',

  success: '#00C805',
  warning: '#F5A524',
  error: '#FF5A5F',
  info: '#60A5FA',
  paid: '#F97316',
  vip: '#00C805',
  free: '#60A5FA',

  disabledSurface: '#121A14',
  disabledText: '#66746B',

  cardBg: '#0F1711',
  cardBgSecondary: '#16211A',
  primaryMuted: 'rgba(0, 200, 5, 0.13)',
  secondary: '#16211A',
  gray5: '#1E2B22',
  orange9: '#F97316',
  blue2: '#1E3A5F',
  blue10: '#60A5FA',
};

const light: AppPalette = {
  background: '#F2F6F2',
  surface: '#FFFFFF',
  surfaceElevated: '#EAF1EB',
  surfaceMuted: '#E1EAE2',
  surfaceGradientFrom: '#FFFFFF',
  surfaceGradientTo: '#F1F7F2',

  primary: '#00A804',
  primaryStrong: '#008603',
  primarySoft: 'rgba(0, 168, 4, 0.10)',
  primaryBorder: 'rgba(0, 168, 4, 0.30)',
  onPrimary: '#FFFFFF',

  text: '#102017',
  textSecondary: '#3B4B41',
  textMuted: '#66766C',
  textDisabled: '#9AA79E',

  border: 'rgba(16, 32, 23, 0.10)',
  borderStrong: 'rgba(16, 32, 23, 0.20)',
  divider: 'rgba(16, 32, 23, 0.08)',
  overlay: 'rgba(9, 20, 13, 0.40)',
  glass: 'rgba(255, 255, 255, 0.65)',
  highlight: 'rgba(16, 32, 23, 0.04)',
  shadow: 'rgba(16, 32, 23, 0.16)',

  success: '#00A804',
  warning: '#B77909',
  error: '#D92D20',
  info: '#2563EB',
  paid: '#C2560B',
  vip: '#00A804',
  free: '#2563EB',

  disabledSurface: '#E7EDE8',
  disabledText: '#98A49C',

  cardBg: '#FFFFFF',
  cardBgSecondary: '#EAF1EB',
  primaryMuted: 'rgba(0, 168, 4, 0.10)',
  secondary: '#EAF1EB',
  gray5: '#E1EAE2',
  orange9: '#C2560B',
  blue2: '#DBEAFE',
  blue10: '#2563EB',
};

export const colors = { dark, light };

export type ThemeColors = AppPalette;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

const noShadow = (): ShadowValue => ({
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
});

export const shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'glow', ShadowValue> = {
  none: noShadow(),
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 9,
  },
  glow: {
    shadowColor: '#00C805',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
};

/** Soft glow tinted with a theme colour (e.g. tier / action accent). */
export function tintedShadow(color: string, opacity = 0.3): ShadowValue {
  return { ...shadows.glow, shadowColor: color, shadowOpacity: opacity };
}

export const theme = { colors, spacing, radii, shadows };
