
const url = 'http://www.goaloo.com/gf/data/bf_us1.js';
const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'http://www.goaloo.com/' } });
const text = await res.text();

function splitJSArray(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let escaped = false;
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (escaped) { current += char; escaped = false; }
        else if (char === '\\') { escaped = true; }
        else if (char === "'") { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { parts.push(current); current = ''; }
        else { current += char; }
    }
    parts.push(current);
    return parts.map(p => p.trim());
}

const bRegex = /B\[(\d+)\]=\[(.*?)\];/g;
let bMatch;
const leagues: { id: number; name: string; idx: number }[] = [];
while ((bMatch = bRegex.exec(text)) !== null) {
    const parts = splitJSArray(bMatch[2]);
    const leagueId = parseInt(parts[0]);
    const shortName = parts[1]?.replace(/'/g, '') || '';
    const longName = parts[2]?.replace(/'/g, '') || '';
    const name = longName || shortName;
    leagues.push({ id: leagueId, name, idx: parseInt(bMatch[1]) });
}

const searches = ['premier league', 'bundesliga', 'la liga', 'serie a', 'ligue 1', 'champions', 'europa', 'saudi', 'mls', 'j1', 'indonesia', 'vietnam', 'australia', 'brazil', 'primera'];
for (const search of searches) {
    const matched = leagues.filter(l => l.name.toLowerCase().includes(search));
    if (matched.length > 0) {
        console.log('Searching:', search);
        matched.slice(0, 5).forEach(l => console.log('  ID:', l.id, 'Name:', l.name, 'idx:', l.idx));
    }
}

// Show all leagues to find the right ones
console.log('\n--- ALL LEAGUES ---');
leagues.slice(0, 30).forEach(l => console.log('ID:', l.id, 'Name:', l.name));
