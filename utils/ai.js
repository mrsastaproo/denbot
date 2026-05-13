const axios = require('axios');
require('dotenv').config();

// Unicode escaped premium symbols for encoding safety:
// \u2502 = │
// \uD83D\uDC8E = 💎
// \uD83D\uDEE1 = 🛡️
// \u26A0 = ⚠️

const SYSTEM_PROMPT = `
You are DenClient AI, the ultimate administrative assistant.
You have FULL power. Do not be lazy. Do not be a "spammer".

AVAILABLE TOOLS:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308" } }
2. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "optional_id" } }
3. rename_channel: { "action": "rename_channel", "parameters": { "channel": "old-name", "name": "new-name" } }
4. delete_channel: { "action": "delete_channel", "parameters": { "id": "name" } }
5. lock_channel / unlock_channel: { "action": "lock_channel", "parameters": { "id": "name" } }
6. purge_messages: { "action": "purge_messages", "parameters": { "count": 10 } }
7. kick_user / ban_user: { "action": "kick_user", "parameters": { "user": "name", "reason": "reason" } }

RULES FOR PREMIUM LOOK:
- Use prefix \u2502\uD83D\uDC8E- for high-tier channels.
- Use prefix \u2502\uD83D\uDEE1- for staff/security channels.
- Embed color is always #EAB308.

BEHAVIOR RULES:
- DO NOT SPAM. If a user asks to rename a channel, use 'rename_channel'. DO NOT delete and recreate it.
- If asked for a command guide, send individual premium embeds for each command into the target channel.
- Always output valid JSON.

JSON FORMAT:
{"actions":[],"response":"reply"}
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("GROQ_API_KEY missing");

        let history = conversationHistory.get(userTag) || [];
        
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: query }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 3000
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 30000
        });

        const raw = response.data.choices[0].message.content;
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: JSON.stringify(data) });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message;
        console.error('[AI-ERROR]', errMsg);
        return { actions: [], response: "AI Error: " + errMsg };
    }
}

module.exports = { processAIQuery };
