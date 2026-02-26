import * as cheerio from 'cheerio';

export interface ScrapeResult {
    url: string;
    data: unknown;
    timestamp: string;
}

export class GoalooScraper {
    private userAgents: string[] = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0'
    ];
    private delayMs: number;
    private queue: string[] = [];
    private visited: Set<string> = new Set();

    constructor(
        delayMs: number = 3000
    ) {
        this.delayMs = delayMs;
    }

    private getRandomUserAgent(): string {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * Parses a sitemap or sitemap index to find URLs
     */
    async fetchSitemap(sitemapUrl: string): Promise<string[]> {
        console.log(`[Scraper] Fetching sitemap: ${sitemapUrl}`);
        const response = await fetch(sitemapUrl, {
            headers: { 'User-Agent': this.getRandomUserAgent() }
        });

        if (!response.ok) {
            console.error(`[Scraper] ❌ Failed to fetch sitemap: ${sitemapUrl} - Status: ${response.status}`);
            throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
        }

        console.log(`[Scraper] ✅ Sitemap fetched successfully, parsing XML...`);
        const xml = await response.text();
        console.log(`[Scraper] 🔍 XML received (Length: ${xml.length}). First 200 chars: ${xml.substring(0, 200).replace(/\r?\n/g, ' ')}`);

        const $ = cheerio.load(xml, { xmlMode: true });
        const urls: string[] = [];

        // Use broader selectors for loc elements to avoid namespace/nesting issues
        $('loc').each((_, el) => {
            const url = $(el).text().trim();
            if (url) urls.push(url);
        });

        console.log(`[Scraper] 📋 Found ${urls.length} total URLs in XML.`);

        // De-duplicate URLs
        const uniqueUrls = Array.from(new Set(urls));
        console.log(`[Scraper] 📋 Found ${uniqueUrls.length} unique URLs.`);

        return uniqueUrls;
    }

    /**
     * Adds URLs to the crawl queue if they haven't been visited
     */
    enqueue(urls: string[]) {
        for (const url of urls) {
            if (!this.visited.has(url)) {
                this.queue.push(url);
            }
        }
    }

    /**
     * Fetches and parses a single page
     */
    async scrapePage<T>(url: string, parser: (html: string) => T): Promise<T | null> {
        if (this.visited.has(url)) {
            console.log(`[Scraper] Already visited: ${url}`);
            return null;
        }

        console.log(`[Scraper] 🌐 Fetching page: ${url}`);

        // Politeness: Wait before request
        console.log(`[Scraper] 🕒 Waiting ${this.delayMs}ms for politeness...`);
        await new Promise(resolve => setTimeout(resolve, this.delayMs));

        const response = await fetch(url, {
            headers: { 'User-Agent': this.getRandomUserAgent() }
        });

        if (!response.ok) {
            console.error(`[Scraper] ❌ Failed to fetch page: ${url} - Status: ${response.status}`);
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        console.log(`[Scraper] 📄 Page received, parsing content...`);
        const html = await response.text();
        this.visited.add(url);

        return parser(html);
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    clearQueue() {
        this.queue = [];
    }

    reset() {
        this.queue = [];
        this.visited.clear();
    }

    /**
     * Fetches the live match data JS file
     */
    async fetchLiveScan(): Promise<string> {
        const url = 'http://www.goaloo.com/gf/data/bf_us1.js';
        console.log(`[Scraper] 🌐 Fetching live data: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Referer': 'http://www.goaloo.com/',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch live data: ${response.statusText}`);
        }

        return await response.text();
    }
}
