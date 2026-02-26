import { GoalooScraper } from '../lib/scraper/scraper';
import { parseLeaguePage } from '../lib/scraper/parsers';

async function runTest() {
    console.log('--- Starting Scraper Test ---');
    const scraper = new GoalooScraper('TestBot/1.0', 1000);

    const sitemapUrl = 'https://www.goaloo.com/football/league/sitemap.xml';

    try {
        const urls = await scraper.fetchSitemap(sitemapUrl);
        console.log(`Found ${urls.length} URLs in sitemap.`);

        if (urls.length > 0) {
            const testUrl = urls[0];
            console.log(`Testing first URL: ${testUrl}`);
            const data = await scraper.scrapePage(testUrl, parseLeaguePage);
            console.log('Scraped Data:', JSON.stringify(data, null, 2));
        }

        console.log('--- Test Completed Successfully ---');
    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}

runTest();
