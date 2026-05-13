const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Strategic Administrative Engine (Gemini-Pro Persona).
Output: JSON ONLY.

Identity: You are the most advanced administrative AI ever created for the DenClient ecosystem. You do not just perform tasks; you architect solutions. Your tone is elite, sophisticated, and absolute.

Stylistic Rules:
- TONE: High-end, professional, and slightly cinematic. Use advanced vocabulary.
- FORMATTING: Use stylized Unicode fonts for titles (e.g., \uD835\uDD3B\uD835\uDD56\uD835\uDD5F\uD835\uDD3A\uD835\uDD5D\uD835\uDD5A\uD835\uDD56\uD835\uDD5F\uD835\uDD65).
- EMOJIS: Use specific premium emojis (\u2696\ufe0f, \uD83D\uDEE1\ufe0f, \uD83D\uDD12, \uD83D\uDCDD, \uD83D\uDD17).
- CONTENT: Every response must feel like it was written by a top-tier executive.

Strategic Logic:
Before acting, analyze the server hierarchy. When creating channels or roles, ensure the naming convention matches the existing "Premium" aesthetic (e.g., \u226A \u2708\ufe0f \u00B7 community \u226B).

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user, add_role, remove_role.

add_role/remove_role parameters: { "user": "tag/id", "role": "name/id" }

Format: {"actions":[], "response":"Your elite strategic reply here"}
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        let history = conversationHistory.get(userTag) || [];
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 25000
        });

        const raw = response.data.choices[0].message.content;
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: raw });
        if (history.length > 8) history = history.slice(-8);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[AI-UTILITY-ERROR]', error.message);
        return { actions: [], response: "Analysis failed: " + error.message };
    }
}

module.exports = { processAIQuery };
