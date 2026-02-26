const axios = require('axios');

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function testGroq() {
    console.log('Testing Groq API Connectivity...');
    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: 'groq/compound',
                messages: [
                    {
                        role: 'user',
                        content: 'Briefly analyze the match between Arsenal and Manchester City. Who has better form?',
                    },
                ],
                max_tokens: 150,
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('\n--- Groq Response Success ---');
        console.log('Model:', response.data.model);
        console.log('Insight:', response.data.choices[0].message.content);
        console.log('-----------------------------\n');
    } catch (error) {
        console.error('\n--- Groq API Error ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        console.log('----------------------\n');
    }
}

testGroq();
