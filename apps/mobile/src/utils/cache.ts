import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@bet_titan_cache_';
const DEFAULT_TTL = 3600000; // 1 hour in milliseconds

export const CacheManager = {
    async set(key: string, data: any, ttl: number = DEFAULT_TTL) {
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                ttl,
            };
            await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    },

    async get(key: string) {
        try {
            const cachedString = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!cachedString) return null;

            const { data, timestamp, ttl } = JSON.parse(cachedString);
            const isExpired = Date.now() - timestamp > ttl;

            if (isExpired) {
                await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },

    async clear() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
};
