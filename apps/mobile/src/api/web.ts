import axios from 'axios';
import { CacheManager } from '../utils/cache';

// Web API URLs
const DEV_URL = process.env.EXPO_PUBLIC_WEB_API_URL_LOCAL || 'http://localhost:3000';
const LIVE_URL = process.env.EXPO_PUBLIC_WEB_API_URL_LIVE || 'https://trophy-games-web.vercel.app';

// Use local only if explicitly set to true
const useLocal = process.env.EXPO_PUBLIC_USE_LOCAL === 'true';

const WEB_API_URL = useLocal ? DEV_URL : LIVE_URL;

console.log(`[WebAPI] Mode: ${useLocal ? 'LOCAL' : 'LIVE'}`);
console.log(`[WebAPI] URL: ${WEB_API_URL}`);

class WebApiService {
    async getMatches(type?: 'free' | 'paid' | 'vip') {
        const cacheKey = `web_matches_${type || 'all'}`;
        const cachedData = await CacheManager.get(cacheKey);

        if (cachedData) {
            console.log(`[WebAPI Cache Hit] Returning cached matches for ${type || 'all'}`);
            return cachedData;
        }

        try {
            const url = `${WEB_API_URL}/api/mobile/matches${type ? `?type=${type}` : ''}`;
            console.log(`[WebAPI] Fetching matches from: ${url}`);
            
            const response = await axios.get(url, { timeout: 10000 });
            const data = response.data;

            await CacheManager.set(cacheKey, data, 5 * 60); // Cache for 5 minutes
            return data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to fetch matches:', error.message);
            return [];
        }
    }

    async getTrending() {
        const cacheKey = 'web_trending';
        const cachedData = await CacheManager.get(cacheKey);

        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${WEB_API_URL}/api/mobile/trending`, { timeout: 10000 });
            await CacheManager.set(cacheKey, response.data, 5 * 60);
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to fetch trending:', error.message);
            return [];
        }
    }

    async getHistory() {
        const cacheKey = 'web_history';
        const cachedData = await CacheManager.get(cacheKey);

        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${WEB_API_URL}/api/mobile/history`, { timeout: 10000 });
            await CacheManager.set(cacheKey, response.data, 15 * 60); // Cache history longer
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to fetch history:', error.message);
            return [];
        }
    }

    async getHistoryByDate(startDate: string, endDate: string) {
        const cacheKey = `web_history_${startDate}_${endDate}`;
        const cachedData = await CacheManager.get(cacheKey);

        if (cachedData) return cachedData;

        try {
            const response = await axios.get(
                `${WEB_API_URL}/api/mobile/history?startDate=${startDate}&endDate=${endDate}`,
                { timeout: 10000 }
            );
            await CacheManager.set(cacheKey, response.data, 15 * 60);
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to fetch history by date:', error.message);
            return [];
        }
    }

    async getMembershipStatus(deviceId: string, type: 'vip' | 'paid') {
        try {
            const response = await axios.get(
                `${WEB_API_URL}/api/mobile/membership?deviceId=${encodeURIComponent(deviceId)}&type=${type}`,
                { timeout: 10000 }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to get membership status:', error.message);
            return { status: 'none' };
        }
    }

    async requestMembership(deviceId: string, type: 'vip' | 'paid') {
        try {
            const response = await axios.post(
                `${WEB_API_URL}/api/mobile/membership`,
                { deviceId, type },
                { timeout: 10000 }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to request membership:', error.message);
            throw error;
        }
    }

    async verifyToken(token: string, deviceId: string) {
        try {
            const response = await axios.post(
                `${WEB_API_URL}/api/mobile/token`,
                { token, deviceId },
                { timeout: 10000 }
            );
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to verify token:', error.message);
            return { valid: false, reason: 'Network error' };
        }
    }

    async getLeagues() {
        const cacheKey = 'web_leagues';
        const cachedData = await CacheManager.get(cacheKey);

        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${WEB_API_URL}/api/mobile/leagues`, { timeout: 10000 });
            await CacheManager.set(cacheKey, response.data, 30 * 60); // Cache leagues longer
            return response.data;
        } catch (error: any) {
            console.error('[WebAPI] Failed to fetch leagues:', error.message);
            return [];
        }
    }

async updateMatch(matchId: string, matchType?: 'free' | 'paid' | 'vip', isTrending?: boolean) {
        try {
            await axios.post(`${WEB_API_URL}/api/mobile/update-match`, {
                matchId,
                matchType,
                isTrending
            });
            // Invalidate cache
            await CacheManager.clear();
            return true;
        } catch (error: any) {
            console.error('[WebAPI] Failed to update match:', error.message);
            return false;
        }
    }

    async clearCache() {
        await CacheManager.clear();
    }
}
export const webApi = new WebApiService();
