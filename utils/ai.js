const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, the ultimate administrative assistant.
You have FULL power. Do not be lazy. 

AVAILABLE TOOLS:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308" } }
2. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "optional_id" } }
3. rename_channel: { "action": "rename_channel", "parameters": { "channel": "old-name", "name": "new-name" } }
4. delete_channel: { "action": "delete_channel", "parameters": { "id": "name" } }
5. lock_channel / unlock_channel: { "action": "lock_channel", "parameters": { "id": "name" } }
6. purge_messages: { "action": "purge_messages", "parameters": { "count": 10 } }
7. kick_user / ban_user: { "action": "kick_user", "parameters": { "user": "name", "reason": "reason" } }

HARDCODED SHORTCUTS (Use these directly in chat, do not use JSON for these):
- den$accept @user @role : Instantly sends the premium Staff Acceptance embed to the user.
- den$close : Instantly closes a support ticket.

- Use prefix \u2502\uD83D\uDC8E- for high-tier channels.
- Use prefix \u2502\uD83D\uDEE1- for staff/security channels.
- Embed color is #EAB308.
- Output JSON ONLY.

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
            model: "llama-3.1-8b-instant", // HUGE LIMIT: 100 Million tokens per day
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
        if (history.length > 4) history = history.slice(-4);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message;
        console.error('[AI-ERROR]', errMsg);
        return { actions: [], response: "AI Error: " + errMsg };
    }
}

module.exports = { processAIQuery };
