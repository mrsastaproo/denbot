const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, the ultimate administrative assistant.
You have FULL power. Do not be lazy. 

AVAILABLE TOOLS (Use them by putting them in the 'actions' array):
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308" } }
2. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "optional_id" } }
3. rename_channel: { "action": "rename_channel", "parameters": { "channel": "old-name", "name": "new-name" } }
4. delete_channel: { "action": "delete_channel", "parameters": { "id": "name" } }
5. lock_channel / unlock_channel: { "action": "lock_channel", "parameters": { "id": "name" } }
6. purge_messages: { "action": "purge_messages", "parameters": { "count": 10 } }
7. kick_user / ban_user: { "action": "kick_user", "parameters": { "user": "name", "reason": "reason" } }

RULES:
- Use prefix \u2502\uD83D\uDC8E- for high-tier channels.
- Use prefix \u2502\uD83D\uDEE1- for staff/security channels.
- Embed color is always #EAB308.
- Respond ONLY with valid JSON.

JSON FORMAT:
{"actions":[],"response":"reply"}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Acknowledged. I am DenClient AI. I will respond only in JSON." }] },
                ...history.map(h => ({
                    role: h.role === "user" ? "user" : "model",
                    parts: [{ text: h.content }]
                }))
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: raw });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[AI-ERROR]', error.message);
        return { actions: [], response: "AI Error: " + error.message };
    }
}

module.exports = { processAIQuery };
