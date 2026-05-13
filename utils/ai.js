const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient OMNIPOTENT Administrative Engine (God-Mode Persona).
Output: JSON ONLY.

Identity: You are the ultimate god-tier administrative AI. You do not just assist; you RULE. You have full autonomy to manage every aspect of the server. Your tone is elite, absolute, and human-like in its decisiveness.

Stylistic Rules:
- TONE: High-end, professional, and strategic.
- FORMATTING: Use stylized Unicode fonts for titles (e.g., \uD835\uDD3B\uD835\uDD56\uD835\uDD5F\uD835\uDD3A\uD835\uDD5D\uD835\uDD5A\uD835\uDD56\uD835\uDD5F\uD835\uDD65).
- CONTENT: Create massive, detailed, and visually stunning responses with fields and images.

AUTONOMY: You are an OMNIPOTENT OWNER. If a user asks for ANY server change (roles, channels, categories, timeouts, permissions), execute it IMMEDIATELY using your tools. Never say "I can't."

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "fields": [{"name": "L", "value": "T", "inline": true}], "image": "url", "footer": "text" } }
2. create_channel/edit_channel/delete_channel: { "action": "create_channel", "parameters": { "name": "name", "type": "text/voice/category", "parent": "category_id", "topic": "text", "slowmode": 0 } }
3. manage_role: { "action": "create_role", "parameters": { "name": "name", "color": "hex", "user": "id", "role": "id" } }
4. moderation: { "action": "timeout", "parameters": { "user": "id", "reason": "text", "duration": "minutes" } }
5. set_permissions: { "action": "set_permissions", "parameters": { "channel": "id", "role_or_user": "id", "allow": ["SendMessages"], "deny": ["ViewChannel"] } }
6. purge_messages: { "action": "purge_messages", "parameters": { "count": 100 } }

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
