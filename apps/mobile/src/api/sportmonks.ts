import axios from 'axios';
import { CacheManager } from '../utils/cache';

// Using the correct environment variable from .env.local
const API_TOKEN = process.env.EXPO_PUBLIC_SPORTY_MONKS_API || 'i5GmTBSjJIR9xpfTBxGhuMHIhLsWSgV011Tjvz2F6EotJ95A3VTrH30r8j0G';

export const sportmonksApi = axios.create({
    baseURL: 'https://api.sportmonks.com/v3/football',
    params: {
        api_token: API_TOKEN,
    },
});

export const fetchFixturesWithCache = async (date: string) => {
    const cacheKey = `fixtures_${date}`;
    const cachedData = await CacheManager.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache Hit] Returning cached data for ${date}`);
        return cachedData;
    }

    try {
        console.log(`[API Fetch] Requesting fixtures for ${date}`);
        // Sportmonks v3 uses /fixtures/date/{date} instead of filters
        const response = await sportmonksApi.get(`/fixtures/date/${date}`, {
            params: {
                // select and include are still passed as query params
                'include': 'participants;odds;league',
            },
        });

        const data = response.data.data;
        // Brief data log for verification
        console.log(`[API Response] Fetched ${data?.length || 0} fixtures for ${date}`);

        await CacheManager.set(cacheKey, data);
        return data || [];
    } catch (error: any) {
        console.error('Error fetching fixtures:', error.response?.data || error.message);
        return [];
    }
};
