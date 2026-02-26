
import fs from 'fs';

async function debugScraper() {
    try {
        console.log('Fetching goaloo.com data files...');

        const files = [
            'http://www.goaloo.com/gf/data/bf_us1.js',
            'http://www.goaloo.com/gf/data/bf_us.js'
        ];

        for (const url of files) {
            const name = url.split('/').pop();
            console.log(`Fetching ${url}...`);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'http://www.goaloo.com/'
                }
            });
            const text = await res.text();
            console.log(`Fetched ${name}: ${text.length} bytes`);
            fs.writeFileSync(`debug_${name}`, text);
        }
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

debugScraper();
