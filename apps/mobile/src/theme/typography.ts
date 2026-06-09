export const fontWeights = {
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const fontSizes = {
  xs: 10,
  sm: 11,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  score: 36,
} as const;

export const typography = {
  // Gate / Membership screens
  gateTitle: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  gateSubtitle: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  gateBadge: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  featureText: { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  featureCheck: { fontSize: 14, fontWeight: '400' as const },
  pendingTitle: { fontSize: 15, fontWeight: '600' as const },
  pendingText: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },

  // Buttons
  primaryBtn: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.5 },
  secondaryBtn: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1 },
  tokenInput: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 1 },
  tokenLabel: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1 },
  cancelBtn: { fontSize: 12, fontWeight: '600' as const },

  // Section headers / labels
  sectionTitle: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1 },
  subLabel: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 1 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, letterSpacing: 1 },
  emptySubtitle: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  emptyText: { fontSize: 16, fontWeight: '600' as const },
  emptySubtext: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },

  // Match card
  teamName: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.3 },
  teamNameDetail: { fontSize: 13, fontWeight: '600' as const, textAlign: 'center' as const, lineHeight: 18 },
  leagueName: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
  leagueNameDetail: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  scoreText: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
  scoreTextDetail: { fontSize: 38, fontWeight: '800' as const, letterSpacing: -1 },
  vsText: { fontSize: 24, fontWeight: '700' as const, letterSpacing: 2 },
  time: { fontSize: 10, fontWeight: '600' as const },
  timeDetail: { fontSize: 10, fontWeight: '500' as const, textAlign: 'center' as const },
  predictionLabel: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 1 },
  predictionValue: { fontSize: 10, fontWeight: '700' as const, color: 'white' as const },
  oddsValue: { fontSize: 14, fontWeight: '600' as const },
  oddsLabel: { fontSize: 8, fontWeight: '600' as const, letterSpacing: 0.5 },
  oddsVal: { fontSize: 20, fontWeight: '700' as const },
  oddsSub: { fontSize: 8, fontWeight: '600' as const, letterSpacing: 0.5 },
  teamOddsValue: { fontSize: 13, fontWeight: '600' as const },
  teamOddsLabel: { fontSize: 8, fontWeight: '600' as const, letterSpacing: 0.5 },
  score: { fontSize: 18, fontWeight: '700' as const },
  result: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  hotText: { fontSize: 8, fontWeight: '700' as const },
  hotBadge: { fontSize: 8, fontWeight: '700' as const, color: 'white' as const },

  // AI / insights
  aiTitle: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1 },
  aiSectionTitle: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  aiBody: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  aiReasoning: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  aiMainPick: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.5 },
  aiProbLabel: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1 },
  aiProbValue: { fontSize: 14, fontWeight: '700' as const },
  aiSuggestedBet: { fontSize: 11, fontWeight: '600' as const },
  aiChipText: { fontSize: 10, fontWeight: '600' as const },
  aiInsightText: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  emptyBoxText: { fontSize: 12, fontWeight: '500' as const, textAlign: 'center' as const },

  // H2H / stats
  h2hValue: { fontSize: 22, fontWeight: '700' as const },
  h2hLabel: { fontSize: 8, fontWeight: '600' as const, letterSpacing: 0.5 },
  infoKey: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1 },
  infoValue: { fontSize: 13, fontWeight: '500' as const },
  statValue: { fontSize: 16, fontWeight: '700' as const },
  statLabel: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 1 },
  standing: { fontSize: 10, fontWeight: '600' as const },

  // Navigation / tabs
  headerTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.5, textAlign: 'center' as const },
  tabLabel: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 1 },
  tabLabelActive: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1 },

  // Chips / badges
  chipText: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1 },
  dayText: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1 },
  numText: { fontSize: 18, fontWeight: '700' as const },
  status: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1 },
  statusDetail: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1 },
  lockText: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 1 },
  badgeText: { fontSize: 9, fontWeight: '700' as const },

  // Alerts
  alertTitle: { fontSize: 14, fontWeight: '600' as const },
  alertBody: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  alertTime: { fontSize: 11, fontWeight: '400' as const },

    // Market / general
    body: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    caption: { fontSize: 10, fontWeight: '500' as const },
    medium: { fontSize: 14, fontWeight: '500' as const },
    bold: { fontSize: 14, fontWeight: '700' as const },
    cardTitle: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1 },
    planTitle: { fontSize: 18, fontWeight: '700' as const, letterSpacing: 0.5 },
    statusText: { fontSize: 8, fontWeight: '600' as const },
    tileLabel: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 0.5 },
} as const;

// Helper to merge typography with custom styles
export function t(key: keyof typeof typography, overrides?: Record<string, any>) {
  return { ...typography[key], ...overrides };
}
