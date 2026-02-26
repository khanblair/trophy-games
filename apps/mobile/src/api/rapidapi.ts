import axios from 'axios';
import { CacheManager } from '../utils/cache';

const KEY_1 = process.env.EXPO_PUBLIC_RAPID_API_KEY_1;
const KEY_2 = process.env.EXPO_PUBLIC_RAPID_API_KEY_2;
const RAPID_HOST = 'api-football-v1.p.rapidapi.com';
const BASE_URL = `https://${RAPID_HOST}/v3`;

class RapidBalancer {
    private keys: string[];
    private currentIndex: number = 0;

    constructor() {
        this.keys = [KEY_1, KEY_2].filter(Boolean) as string[];
        if (this.keys.length === 0) {
            console.error('No RapidAPI keys found in environment variables!');
        }
    }

    getNextKey(): string {
        if (this.keys.length === 0) return '';
        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    async request(endpoint: string, params: any = {}): Promise<any> {
        const key = this.getNextKey();
        if (!key) throw new Error('No API Key Available');

        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                params,
                headers: {
                    'x-rapidapi-key': key,
                    'x-rapidapi-host': RAPID_HOST,
                },
            });

            // Handle API-specific errors in successful responses
            if (response.data.errors && Object.keys(response.data.errors).length > 0) {
                console.error('[RapidAPI Error Response]', response.data.errors);
                throw new Error(JSON.stringify(response.data.errors));
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 429) {
                console.warn('[RapidAPI 429] Rate limit hit for a key, trying next...');
                // Recursive retry might be dangerous, but with 2 keys it's a quick fallback
                return this.request(endpoint, params);
            }
            throw error;
        }
    }
}

const balancer = new RapidBalancer();

export const fetchFixturesFromRapid = async (date: string) => {
    const cacheKey = `rapid_fixtures_${date}`;
    const cachedData = await CacheManager.get(cacheKey);

    if (cachedData) {
        console.log(`[Rapid Cache Hit] Returning cached data for ${date}`);
        return cachedData;
    }

    try {
        console.log(`[Rapid API Fetch] Requesting fixtures for ${date}`);
        const response = await balancer.request('/fixtures', {
            date: date,
            timezone: 'UTC' // Standardize to UTC for consistency
        });

        const data = response.response; // API-Football nests results in 'response' array
        console.log(`[Rapid API Response] Fetched ${data?.length || 0} fixtures for ${date}`);

        await CacheManager.set(cacheKey, data);
        return data || [];
    } catch (error: any) {
        console.error('Error fetching from RapidAPI:', error.message);
        return [];
    }
};
