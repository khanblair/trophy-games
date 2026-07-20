// The only competitions we keep in Convex — everything else is noise and is
// neither ingested by the sync nor retained by the cleanup job.
//
// Matching uses country guards + exact names for ambiguous labels (so e.g.
// "Syria Premier League" never matches the English Premier League) and unique
// substrings for unambiguous continental/international competitions. Women's,
// youth and reserve variants are never elite.

interface EliteEntry {
    mode: 'exact' | 'contains';
    match: string[];
    country?: string;
}

const EXCLUDE = /(women|ladies|girls|\bu14\b|\bu15\b|\bu16\b|\bu17\b|\bu18\b|\bu19\b|\bu20\b|\bu21\b|\bu23\b|reserve|youth|next pro|development|amateur|futsal|beach)/i;

const ELITE: EliteEntry[] = [
    // England
    { mode: 'exact', match: ['english premier league', 'premier league'], country: 'England' },
    { mode: 'exact', match: ['championship', 'efl championship'], country: 'England' },
    { mode: 'exact', match: ['league one', 'efl league one'], country: 'England' },
    { mode: 'exact', match: ['league two', 'efl league two'], country: 'England' },
    { mode: 'contains', match: ['fa cup'], country: 'England' },
    { mode: 'contains', match: ['efl cup', 'carabao cup', 'league cup'], country: 'England' },
    { mode: 'contains', match: ['community shield'], country: 'England' },
    // Spain
    { mode: 'exact', match: ['la liga', 'laliga', 'primera division', 'primera división'], country: 'Spain' },
    { mode: 'exact', match: ['segunda division', 'segunda división', 'laliga 2'], country: 'Spain' },
    { mode: 'contains', match: ['copa del rey'], country: 'Spain' },
    { mode: 'contains', match: ['supercopa'], country: 'Spain' },
    // Italy
    { mode: 'exact', match: ['serie a'], country: 'Italy' },
    { mode: 'exact', match: ['serie b'], country: 'Italy' },
    { mode: 'contains', match: ['coppa italia'], country: 'Italy' },
    { mode: 'contains', match: ['supercoppa'], country: 'Italy' },
    // Germany
    { mode: 'exact', match: ['bundesliga', '1. bundesliga'], country: 'Germany' },
    { mode: 'exact', match: ['2. bundesliga', 'bundesliga 2'], country: 'Germany' },
    { mode: 'contains', match: ['dfb pokal', 'dfb-pokal'], country: 'Germany' },
    { mode: 'contains', match: ['dfl supercup', 'supercup'], country: 'Germany' },
    // France
    { mode: 'exact', match: ['ligue 1'], country: 'France' },
    { mode: 'exact', match: ['ligue 2'], country: 'France' },
    { mode: 'contains', match: ['coupe de france'], country: 'France' },
    { mode: 'contains', match: ['trophee des champions', 'trophée des champions'], country: 'France' },
    // Netherlands
    { mode: 'contains', match: ['eredivisie'] },
    { mode: 'contains', match: ['eerste divisie'] },
    { mode: 'contains', match: ['knvb cup'] },
    // Portugal
    { mode: 'exact', match: ['primeira liga', 'liga portugal'], country: 'Portugal' },
    { mode: 'exact', match: ['liga portugal 2', 'segunda liga'], country: 'Portugal' },
    { mode: 'contains', match: ['taca de portugal', 'taça de portugal'], country: 'Portugal' },
    // Belgium
    { mode: 'contains', match: ['belgian pro league', 'first division a'] },
    { mode: 'contains', match: ['belgian cup', 'croky cup'] },
    // Scotland
    { mode: 'contains', match: ['scottish premiership'] },
    { mode: 'contains', match: ['scottish championship'] },
    { mode: 'contains', match: ['scottish cup'] },
    // Turkey
    { mode: 'exact', match: ['super lig', 'süper lig', 'trendyol süper lig'], country: 'Turkey' },
    { mode: 'contains', match: ['turkish cup'] },
    // Greece, Switzerland, Austria, Denmark, Norway, Sweden, Finland, Poland, Czech, Croatia, Serbia, Romania, Ukraine, Russia
    { mode: 'contains', match: ['super league greece'] },
    { mode: 'contains', match: ['swiss super league', 'super league'], country: 'Switzerland' },
    { mode: 'contains', match: ['austrian bundesliga'] },
    { mode: 'contains', match: ['danish superliga'] },
    { mode: 'contains', match: ['eliteserien'] },
    { mode: 'contains', match: ['allsvenskan'] },
    { mode: 'contains', match: ['veikkausliiga'] },
    { mode: 'contains', match: ['ekstraklasa'] },
    { mode: 'contains', match: ['czech first league'] },
    { mode: 'contains', match: ['croatian football league', 'hnl'] },
    { mode: 'contains', match: ['serbian superliga'] },
    { mode: 'contains', match: ['liga i'], country: 'Romania' },
    { mode: 'contains', match: ['ukrainian premier league'] },
    { mode: 'contains', match: ['russian premier league'] },
    // Americas
    { mode: 'exact', match: ['serie a', 'série a', 'brasileirao', 'campeonato brasileiro série a'], country: 'Brazil' },
    { mode: 'exact', match: ['serie b', 'série b', 'campeonato brasileiro série b'], country: 'Brazil' },
    { mode: 'contains', match: ['copa do brasil'], country: 'Brazil' },
    { mode: 'exact', match: ['primera division', 'liga profesional'], country: 'Argentina' },
    { mode: 'contains', match: ['copa argentina'], country: 'Argentina' },
    { mode: 'contains', match: ['liga mx'] },
    { mode: 'exact', match: ['mls', 'major league soccer'], country: 'USA' },
    { mode: 'contains', match: ['usl championship'], country: 'USA' },
    // Middle East / Africa
    { mode: 'contains', match: ['saudi pro league', 'saudi professional league'] },
    { mode: 'contains', match: ['uae pro league'] },
    { mode: 'contains', match: ['qatar stars league'] },
    { mode: 'contains', match: ['egyptian premier league'] },
    { mode: 'contains', match: ['premier soccer league', 'psl', 'dstv premiership'], country: 'South Africa' },
    { mode: 'contains', match: ['botola pro'] },
    { mode: 'contains', match: ['ligue professionnelle 1'], country: 'Algeria' },
    { mode: 'contains', match: ['ligue professionnelle 1'], country: 'Tunisia' },
    { mode: 'contains', match: ['nigeria premier football league', 'npfl'] },
    { mode: 'contains', match: ['uganda premier league'] },
    { mode: 'contains', match: ['kenyan premier league', 'fkf premier league'] },
    { mode: 'contains', match: ['tanzania premier league', 'ligi kuu'] },
    { mode: 'contains', match: ['zambia super league'] },
    // International Club
    { mode: 'contains', match: ['champions league'] }, // Covers UEFA, CAF, AFC, CONCACAF if named similarly
    { mode: 'contains', match: ['europa league'] },
    { mode: 'contains', match: ['conference league'] },
    { mode: 'contains', match: ['uefa super cup', 'super cup'] },
    { mode: 'contains', match: ['club world cup'] },
    { mode: 'contains', match: ['caf confederation cup'] },
    { mode: 'contains', match: ['libertadores'] },
    { mode: 'contains', match: ['copa sudamericana'] },
    { mode: 'contains', match: ['concacaf champions'] },
    // International
    { mode: 'exact', match: ['world cup'], country: 'International' },
    { mode: 'contains', match: ['world cup qualification', 'world cup qualifiers'] },
    { mode: 'contains', match: ['uefa euro', 'european championship'] },
    { mode: 'contains', match: ['nations league'] },
    { mode: 'contains', match: ['copa america', 'copa américa'] },
    { mode: 'contains', match: ['africa cup of nations', 'afcon', 'africa cup'] },
    { mode: 'contains', match: ['asian cup'] },
    { mode: 'contains', match: ['gold cup'] },
    { mode: 'contains', match: ['olympic games', 'olympics'] },
    { mode: 'contains', match: ['u-20 world cup', 'u20 world cup'] },
    { mode: 'contains', match: ['u-17 world cup', 'u17 world cup'] },
];

const norm = (s?: string) => (s || '').toLowerCase().trim();

export function isEliteLeague(name?: string, country?: string): boolean {
    const n = norm(name);
    if (!n || EXCLUDE.test(n)) return false;
    const c = norm(country);
    for (const e of ELITE) {
        if (e.country && norm(e.country) !== c) continue;
        const hit = e.mode === 'contains'
            ? e.match.some((m) => n.includes(m))
            : e.match.some((m) => n === m);
        if (hit) return true;
    }
    return false;
}
