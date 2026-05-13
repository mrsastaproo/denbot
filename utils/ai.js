const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Admin AI. Output: JSON ONLY.
Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "optional_id" } }
3. rename_channel/delete_channel/lock_channel/purge_messages/kick_user/ban_user: similar to above.

Staff Template: Title: \uD83C\uDF89 Welcome to the Staff Team! \uD83C\uDF89. Content: Congratulations **{username}**... (Use professional emojis).

Format: {"actions":[],"response":"reply"}
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("GROQ_API_KEY missing");

        let history = conversationHistory.get(userTag) || [];
        
        // LIMIT FIX: Keep ONLY the last 2 messages to save tokens
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.slice(-2), 
            { role: "user", content: query }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.1, // Lower temperature = more efficient
            max_tokens: 1000  // Cap output
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 30000
        });

        const raw = response.data.choices[0].message.content;
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: JSON.stringify(data) });
        if (history.length > 2) history = history.slice(-2);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message;
        console.error('[AI-ERROR]', errMsg);
        return { actions: [], response: "AI Error: " + errMsg };
    }
}

module.exports = { processAIQuery };
