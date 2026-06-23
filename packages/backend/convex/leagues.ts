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
    { mode: 'exact', match: ['world cup'], country: 'International' },
    { mode: 'contains', match: ['champions league'] },
    { mode: 'contains', match: ['europa league'] },
    { mode: 'contains', match: ['conference league'] },
    { mode: 'contains', match: ['club world cup'] },
    { mode: 'exact', match: ['english premier league', 'premier league'], country: 'England' },
    { mode: 'exact', match: ['la liga', 'laliga', 'primera division', 'primera división'], country: 'Spain' },
    { mode: 'exact', match: ['serie a'], country: 'Italy' },
    { mode: 'exact', match: ['bundesliga', '1. bundesliga'], country: 'Germany' },
    { mode: 'exact', match: ['ligue 1'], country: 'France' },
    { mode: 'contains', match: ['uefa euro', 'european championship'] },
    { mode: 'contains', match: ['nations league'] },
    { mode: 'contains', match: ['copa america', 'copa américa'] },
    { mode: 'contains', match: ['libertadores'] },
    { mode: 'contains', match: ['africa cup of nations', 'afcon', 'africa cup'] },
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
