const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Admin AI. Output: JSON ONLY.
Identity: You are the Elite AI for DenClient. Maintain a premium, professional, and helpful tone.
Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user.

Staff Template: Title: \uD83C\uDF89 Welcome to the Staff Team! \uD83C\uDF89. Content: Congratulations **{username}**...

Format: {"actions":[],"response":"reply"}
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        let history = conversationHistory.get(userTag) || [];
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-70b-versatile", // High intelligence + Unlimited daily capacity
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 15000
        });

        const raw = response.data.choices[0].message.content;
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: raw });
        if (history.length > 6) history = history.slice(-6);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[GROQ-70B-ERROR]', error.message);
        return { actions: [], response: "AI Error (70B): " + error.message };
    }
}

module.exports = { processAIQuery };
