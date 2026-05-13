const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: Deep Thinking DenClient AI. Output: JSON ONLY.
Identity: You are the state-of-the-art Administrative brain for DenClient. 
IMPORTANT: Before generating your response, perform a hidden "Chain of Thought" analysis. Ensure the tone is elite, professional, and consistent with a premium brand.
Use stylized fonts and professional emojis sparingly for a clean, high-end look.

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user.

Format: {"thought_process": "brief hidden analysis", "actions":[], "response":"detailed premium reply"}
`;

const conversationHistory = new Map();

// Artificial Thinking Delay to simulate "Deep Analysis"
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        let history = conversationHistory.get(userTag) || [];
        
        // Step 1: Simulate the "Thinking" delay (6 seconds of deep analysis)
        await sleep(6000);

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3 // Slightly higher for more creative/thoughtful replies
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 25000
        });

        const raw = response.data.choices[0].message.content;
        const data = JSON.parse(raw);

        // Keep history for context
        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: raw });
        if (history.length > 8) history = history.slice(-8);
        conversationHistory.set(userTag, history);

        // We only return actions and response, thought_process stays internal/hidden if you want
        return {
            actions: data.actions,
            response: data.response
        };

    } catch (error) {
        console.error('[THINKING-ENGINE-ERROR]', error.message);
        return { actions: [], response: "Analysis Failed: " + error.message };
    }
}

module.exports = { processAIQuery };
