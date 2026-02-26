import { readFileSync } from 'fs';
import { parseGoalooJS } from '../lib/scraper/parsers';
import path from 'path';

async function testParser() {
    const filePath = path.join(process.cwd(), 'debug_bf_us1.js');
    const content = readFileSync(filePath, 'utf-8');
    console.log(`Read ${content.length} bytes from ${filePath}`);

    const { matches, leagues } = parseGoalooJS(content);

    console.log(`Parsed ${matches.length} matches.`);
    console.log(`Parsed ${leagues.length} leagues.`);

    if (matches.length > 0) {
        console.log('Sample Match 0:', JSON.stringify(matches[0], null, 2));

        const matchWithQuote = matches.find(m => m.id === '2943643');
        if (matchWithQuote) {
            console.log('Match with quote:', JSON.stringify(matchWithQuote, null, 2));
        } else {
            console.warn('Match 2943643 not found!');
        }
    }

    if (leagues.length > 0) {
        console.log('Sample League 0:', JSON.stringify(leagues[0], null, 2));
    }
}

testParser();
