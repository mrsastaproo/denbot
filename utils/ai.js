const { GoogleGenerativeAI } = require('@google/generative-ai');
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using Gemini 1.5 Flash for the MASSIVE quota (1 million tokens/min) as requested
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "{\"actions\":[], \"response\":\"System initialized. God Mode active with High-Quota engine.\"}" }] },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) }] }))
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        
        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error('AI JSON Parse Error:', raw);
            return { actions: [], response: "Analysis error: Invalid format received." };
        }

        history.push({ role: "user", content: query });
        history.push({ role: "model", content: raw });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return {
            actions: data.actions || [],
            response: typeof data.response === 'string' ? data.response : "Strategic action executed."
        };

    } catch (error) {
        console.error('[GEMINI-GOD-ERROR]', error.message);
        return { actions: [], response: "Critical Failure: " + error.message };
    }
}

module.exports = { processAIQuery };
