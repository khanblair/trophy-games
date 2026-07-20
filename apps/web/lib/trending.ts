// Curated list of globally popular competitions, ordered by importance.
// Used to surface the leagues/matches people care about most and push the
// long tail of obscure leagues below. Order in TRENDING = priority (top first).
//
// Matching avoids false positives (e.g. "Syria Premier League" must NOT match
// the English Premier League) by using country guards + exact names for
// ambiguous labels, and unique substrings for unambiguous ones. Women's, youth
// and reserve competitions are never treated as trending.

export type Tier = 1 | 2 | 3;

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

    // ---- Tier 2: very popular & regional elite ----
    { label: 'EFL Championship', tier: 2, mode: 'exact', match: ['championship', 'efl championship'], country: 'England' },
    { label: 'FA Cup', tier: 2, mode: 'contains', match: ['fa cup'], country: 'England' },
    { label: 'Copa del Rey', tier: 2, mode: 'contains', match: ['copa del rey'], country: 'Spain' },
    { label: 'Coppa Italia', tier: 2, mode: 'contains', match: ['coppa italia'], country: 'Italy' },
    { label: 'DFB-Pokal', tier: 2, mode: 'contains', match: ['dfb pokal', 'dfb-pokal'], country: 'Germany' },
    { label: 'Eredivisie', tier: 2, mode: 'contains', match: ['eredivisie'] },
    { label: 'Primeira Liga', tier: 2, mode: 'exact', match: ['primeira liga', 'liga portugal'], country: 'Portugal' },
    { label: 'Belgian Pro League', tier: 2, mode: 'contains', match: ['belgian pro league', 'first division a'] },
    { label: 'Süper Lig', tier: 2, mode: 'exact', match: ['super lig', 'süper lig', 'trendyol süper lig'], country: 'Turkey' },
    { label: 'Scottish Premiership', tier: 2, mode: 'contains', match: ['scottish premiership'] },
    { label: 'Brasileirão Série A', tier: 2, mode: 'exact', match: ['serie a', 'série a', 'brasileirao', 'campeonato brasileiro série a'], country: 'Brazil' },
    { label: 'Argentine Primera División', tier: 2, mode: 'exact', match: ['primera division', 'liga profesional'], country: 'Argentina' },
    { label: 'Liga MX', tier: 2, mode: 'contains', match: ['liga mx'] },
    { label: 'MLS', tier: 2, mode: 'exact', match: ['mls', 'major league soccer'], country: 'USA' },
    { label: 'Saudi Pro League', tier: 2, mode: 'contains', match: ['saudi pro league', 'saudi professional league'] },

    // ---- Tier 3: secondary & global reach ----
    { label: 'League One', tier: 3, mode: 'exact', match: ['league one', 'efl league one'], country: 'England' },
    { label: 'League Two', tier: 3, mode: 'exact', match: ['league two', 'efl league two'], country: 'England' },
    { label: 'Segunda División', tier: 3, mode: 'exact', match: ['segunda division', 'segunda división', 'laliga 2'], country: 'Spain' },
    { label: 'Serie B', tier: 3, mode: 'exact', match: ['serie b'], country: 'Italy' },
    { label: '2. Bundesliga', tier: 3, mode: 'exact', match: ['2. bundesliga', 'bundesliga 2'], country: 'Germany' },
    { label: 'Ligue 2', tier: 3, mode: 'exact', match: ['ligue 2'], country: 'France' },
    { label: 'Liga Portugal 2', tier: 3, mode: 'exact', match: ['liga portugal 2', 'segunda liga'], country: 'Portugal' },
    { label: 'Swiss Super League', tier: 3, mode: 'contains', match: ['swiss super league', 'super league'], country: 'Switzerland' },
    { label: 'Austrian Bundesliga', tier: 3, mode: 'contains', match: ['austrian bundesliga'] },
    { label: 'Danish Superliga', tier: 3, mode: 'contains', match: ['danish superliga'] },
    { label: 'Eliteserien', tier: 3, mode: 'contains', match: ['eliteserien'] },
    { label: 'Allsvenskan', tier: 3, mode: 'contains', match: ['allsvenskan'] },
    { label: 'Veikkausliiga', tier: 3, mode: 'contains', match: ['veikkausliiga'] },
    { label: 'Ekstraklasa', tier: 3, mode: 'contains', match: ['ekstraklasa'] },
    { label: 'Super League Greece', tier: 3, mode: 'contains', match: ['super league greece'] },
    { label: 'Czech First League', tier: 3, mode: 'contains', match: ['czech first league'] },
    { label: 'Croatian HNL', tier: 3, mode: 'contains', match: ['croatian football league', 'hnl'] },
    { label: 'Serbian SuperLiga', tier: 3, mode: 'contains', match: ['serbian superliga'] },
    { label: 'Romanian Liga I', tier: 3, mode: 'contains', match: ['liga i'], country: 'Romania' },
    { label: 'Ukrainian Premier League', tier: 3, mode: 'contains', match: ['ukrainian premier league'] },
    { label: 'Russian Premier League', tier: 3, mode: 'contains', match: ['russian premier league'] },
    { label: 'Brasileirão Série B', tier: 3, mode: 'exact', match: ['serie b', 'série b', 'campeonato brasileiro série b'], country: 'Brazil' },
    { label: 'USL Championship', tier: 3, mode: 'contains', match: ['usl championship'], country: 'USA' },
    { label: 'UAE Pro League', tier: 3, mode: 'contains', match: ['uae pro league'] },
    { label: 'Qatar Stars League', tier: 3, mode: 'contains', match: ['qatar stars league'] },
    { label: 'Egyptian Premier League', tier: 3, mode: 'contains', match: ['egyptian premier league'] },
    { label: 'PSL (South Africa)', tier: 3, mode: 'contains', match: ['premier soccer league', 'psl', 'dstv premiership'], country: 'South Africa' },
    { label: 'Botola Pro', tier: 3, mode: 'contains', match: ['botola pro'] },
    { label: 'Algerian Ligue 1', tier: 3, mode: 'contains', match: ['ligue professionnelle 1'], country: 'Algeria' },
    { label: 'Tunisian Ligue 1', tier: 3, mode: 'contains', match: ['ligue professionnelle 1'], country: 'Tunisia' },
    { label: 'Nigeria Premier Football League', tier: 3, mode: 'contains', match: ['nigeria premier football league', 'npfl'] },
    { label: 'Uganda Premier League', tier: 3, mode: 'contains', match: ['uganda premier league'] },
    { label: 'Kenyan Premier League', tier: 3, mode: 'contains', match: ['kenyan premier league', 'fkf premier league'] },
    { label: 'Tanzania Premier League', tier: 3, mode: 'contains', match: ['tanzania premier league', 'ligi kuu'] },
    { label: 'Zambia Super League', tier: 3, mode: 'contains', match: ['zambia super league'] },
    { label: 'Asian Cup', tier: 3, mode: 'contains', match: ['asian cup'] },
    { label: 'Gold Cup', tier: 3, mode: 'contains', match: ['gold cup'] },
    { label: 'Olympic Football', tier: 3, mode: 'contains', match: ['olympic games', 'olympics'] },
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
