// Curated list of globally popular competitions, ordered by importance.
// Used to surface the leagues/matches people care about most and push the
// long tail of obscure leagues below. Order in TRENDING = priority (top first).
//
// Matching avoids false positives (e.g. "Syria Premier League" must NOT match
// the English Premier League) by using country guards + exact names for
// ambiguous labels, and unique substrings for unambiguous ones. Women's, youth
// and reserve competitions are never treated as trending.

export type Tier = 1 | 2;

interface TrendingEntry {
    label: string;
    tier: Tier;
    /** Match mode: 'exact' compares the whole (normalised) name; 'contains' is a substring test. */
    mode: 'exact' | 'contains';
    /** Normalised strings to match against the league name. */
    match: string[];
    /** Optional country guard for ambiguous names (e.g. "Serie A" in Italy vs Brazil). */
    country?: string;
}

// Never promote these to trending even if they otherwise match.
const EXCLUDE = /(women|ladies|girls|\bu14\b|\bu15\b|\bu16\b|\bu17\b|\bu18\b|\bu19\b|\bu20\b|\bu21\b|\bu23\b|reserve|youth|next pro|development|amateur|futsal|beach)/i;

const TRENDING: TrendingEntry[] = [
    // ---- Tier 1: global elite ----
    { label: 'World Cup', tier: 1, mode: 'exact', match: ['world cup'], country: 'International' },
    { label: 'UEFA Champions League', tier: 1, mode: 'contains', match: ['champions league'] },
    { label: 'UEFA Europa League', tier: 1, mode: 'contains', match: ['europa league'] },
    { label: 'UEFA Conference League', tier: 1, mode: 'contains', match: ['conference league'] },
    { label: 'FIFA Club World Cup', tier: 1, mode: 'contains', match: ['club world cup'] },
    { label: 'English Premier League', tier: 1, mode: 'exact', match: ['english premier league', 'premier league'], country: 'England' },
    { label: 'La Liga', tier: 1, mode: 'exact', match: ['la liga', 'laliga', 'primera division', 'primera división'], country: 'Spain' },
    { label: 'Serie A', tier: 1, mode: 'exact', match: ['serie a'], country: 'Italy' },
    { label: 'Bundesliga', tier: 1, mode: 'exact', match: ['bundesliga', '1. bundesliga'], country: 'Germany' },
    { label: 'Ligue 1', tier: 1, mode: 'exact', match: ['ligue 1'], country: 'France' },
    { label: 'UEFA Euro', tier: 1, mode: 'contains', match: ['uefa euro', 'european championship'] },
    { label: 'UEFA Nations League', tier: 1, mode: 'contains', match: ['nations league'] },
    { label: 'Copa América', tier: 1, mode: 'contains', match: ['copa america', 'copa américa'] },
    { label: 'Copa Libertadores', tier: 1, mode: 'contains', match: ['libertadores'] },
    { label: 'Africa Cup of Nations', tier: 1, mode: 'contains', match: ['africa cup of nations', 'afcon', 'africa cup'] },

    // ---- Tier 2: very popular ----
    { label: 'MLS', tier: 2, mode: 'exact', match: ['mls', 'major league soccer'], country: 'USA' },
    { label: 'Eredivisie', tier: 2, mode: 'contains', match: ['eredivisie'] },
    { label: 'Primeira Liga', tier: 2, mode: 'exact', match: ['primeira liga', 'liga portugal'], country: 'Portugal' },
    { label: 'Saudi Pro League', tier: 2, mode: 'contains', match: ['saudi pro league', 'saudi professional league'] },
    { label: 'Brasileirão Série A', tier: 2, mode: 'exact', match: ['serie a', 'série a', 'brasileirao', 'campeonato brasileiro série a'], country: 'Brazil' },
    { label: 'Liga MX', tier: 2, mode: 'contains', match: ['liga mx'] },
    { label: 'Süper Lig', tier: 2, mode: 'exact', match: ['super lig', 'süper lig', 'trendyol süper lig'], country: 'Turkey' },
    { label: 'EFL Championship', tier: 2, mode: 'exact', match: ['championship', 'efl championship'], country: 'England' },
    { label: 'Scottish Premiership', tier: 2, mode: 'contains', match: ['scottish premiership'] },
    { label: 'Argentine Primera División', tier: 2, mode: 'exact', match: ['primera division', 'liga profesional'], country: 'Argentina' },
];

const norm = (s?: string) => (s || '').toLowerCase().trim();

/** Priority index of a league (0 = most important). Returns -1 if not trending. */
export function leagueRank(name?: string, country?: string): number {
    const n = norm(name);
    if (!n || EXCLUDE.test(n)) return -1;
    const c = norm(country);
    for (let i = 0; i < TRENDING.length; i++) {
        const e = TRENDING[i];
        if (e.country && norm(e.country) !== c) continue;
        const hit = e.mode === 'contains'
            ? e.match.some((m) => n.includes(m))
            : e.match.some((m) => n === m);
        if (hit) return i;
    }
    return -1;
}

export function isTrending(name?: string, country?: string): boolean {
    return leagueRank(name, country) >= 0;
}

export function leagueTier(name?: string, country?: string): Tier | null {
    const r = leagueRank(name, country);
    return r < 0 ? null : TRENDING[r].tier;
}

/** Sort comparator helper: trending first (by priority), then a large number. */
export function rankOrInfinity(name?: string, country?: string): number {
    const r = leagueRank(name, country);
    return r < 0 ? Number.MAX_SAFE_INTEGER : r;
}
