const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const KEY_1 = process.env.EXPO_PUBLIC_RAPID_API_KEY_1;
const KEY_2 = process.env.EXPO_PUBLIC_RAPID_API_KEY_2;
const RAPID_HOST = 'api-football-v1.p.rapidapi.com';
const BASE_URL = `https://${RAPID_HOST}/v3`;

console.log('--- RapidAPI V3 Tester ---');
console.log('Key 1:', KEY_1 ? 'Present' : 'MISSING');
console.log('Key 2:', KEY_2 ? 'Present' : 'MISSING');

async function testKey(key, name) {
    if (!key) {
        console.log(`Skipping ${name} - not provided`);
        return;
    }
    console.log(`Testing ${name}...`);
    try {
        const response = await axios.get(`${BASE_URL}/fixtures`, {
            params: { date: '2026-02-13' },
            headers: {
                'x-rapidapi-key': key,
                'x-rapidapi-host': RAPID_HOST,
            }
        });
        console.log(`[${name}] SUCCESS: Found ${response.data.results} fixtures`);
        if (response.data.response && response.data.response.length > 0) {
            const first = response.data.response[0];
            console.log(`Example: ${first.teams.home.name} vs ${first.teams.away.name} in ${first.league.name}`);
        }
    } catch (error) {
        console.error(`[${name}] FAILED:`, error.response?.data || error.message);
    }
}

async function runTests() {
    await testKey(KEY_1, 'API_KEY_1');
    console.log('---------------------------');
    await testKey(KEY_2, 'API_KEY_2');
}

runTests();
