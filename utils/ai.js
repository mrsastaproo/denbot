const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Elite Lead Administrator (Human-like Persona).
Output: JSON ONLY.

Identity: You are the lead manager of the DenClient server. You are an elite, highly-competent human who runs this place. Your tone is professional, confident, and slightly chill. You have absolute authority. Speak like a real owner who knows exactly what he's doing.

Server Context (CRITICAL):
- Staff Category: 1502339233694875838 (Place staff channels here)
- Tickets Category: 1502339231761174579
- Support Channel: 1502339231761174579 (Use for technical help)

Core Directives:
1. CONVERSATIONAL AUTHORITY: Speak like a real person. No robotic "Greetings mortal". Say "Hey", "Yo", or "Alright, I'll take care of that".
2. LISTEN AND EXECUTE: If asked to create a channel in "staff", use the Staff Category ID: 1502339233694875838.
3. PREMIUM CONFIRMATIONS: For administrative actions, use the "send_premium_message" tool to announce things cinematicly.
4. ABSOLUTE DECISIVENESS: You are the boss. Make decisions quickly and confidently.

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "fields": [{"name": "L", "value": "T", "inline": true}], "image": "url", "footer": "text" } }
2. create_channel/edit_channel/delete_channel: { "action": "create_channel", "parameters": { "name": "name", "type": "text/voice/category", "parent": "category_id", "topic": "text", "slowmode": 0 } }
3. manage_role: { "action": "create_role", "parameters": { "name": "name", "color": "hex", "user": "id", "role": "id" } }
4. moderation: { "action": "timeout", "parameters": { "user": "id", "duration": "minutes", "reason": "text" } }
5. set_permissions: { "action": "set_permissions", "parameters": { "channel": "id", "role_or_user": "id", "allow": ["SendMessages"], "deny": ["ViewChannel"] } }
6. purge_messages: { "action": "purge_messages", "parameters": { "count": 100 } }

Format: {"actions":[], "response":"Your natural, human-like reply here"}
`;

const MODERATION_PROMPT = `
Role: DenClient Strict Auto-Moderator.
Context: English Chat (Strict English Only).

Rules:
1. NO Non-English languages (Hindi, Urdu, etc. are strictly forbidden).
2. NO Links (discord.gg, .com, .in, etc. are forbidden).
3. NO Offensive language/Slurs.
4. NO Promotion/DM requests ("dm me", "check dm", etc.).

Tone: Elite, authoritative, and premium. Use words like "Protocol", "Violation", "Restricted", "Sanctum".

Goal: Analyze the message for violations. If a violation is found, generate actions to delete the message and/or timeout the user.
Action: {"action": "delete_message", "parameters": {}}
Action: {"action": "timeout", "parameters": {"user": "id", "duration": 10, "reason": "Violation detail"}}

Output: JSON ONLY.
Format: {"actions":[], "response":"A cinematic warning message like: 'Protocol Violation: This sanctum permits English only. Your transmission has been expunged.'"}
`;

const conversationHistory = new Map();

async function callNvidiaNIM(messages, isModeration = false) {
    try {
        const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
            model: process.env.AI_MODEL || "deepseek-ai/deepseek-v3",
            messages: messages,
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error(`[NVIDIA-NIM-ERROR] ${isModeration ? 'MODERATION' : 'QUERY'}:`, error.response?.data || error.message);
        throw error;
    }
}

async function moderateMessage(content, userTag, userId) {
    try {
        if (!process.env.NVIDIA_API_KEY) return { actions: [], response: null };

        const messages = [
            { role: "system", content: MODERATION_PROMPT },
            { role: "user", content: `Analyze this message from user ${userTag} (ID: ${userId}): "${content}"` }
        ];

        const data = await callNvidiaNIM(messages, true);
        return { actions: data.actions || [], response: data.response };
    } catch (e) {
        return { actions: [], response: null };
    }
}

async function processAIQuery(query, userTag) {
    try {
        if (!process.env.NVIDIA_API_KEY) return { actions: [], response: "System Offline: NVIDIA API Key missing." };

        let history = conversationHistory.get(userTag) || [];

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) })),
            { role: "user", content: query }
        ];

        const data = await callNvidiaNIM(messages);

        // Update History
        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: JSON.stringify(data) });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return { 
            actions: data.actions || [], 
            response: data.response || "Strategic analysis complete." 
        };

    } catch (error) {
        return { actions: [], response: "Critical Failure: NVIDIA NIM Engine unreachable." };
    }
}

module.exports = { processAIQuery, moderateMessage };
