const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Admin AI. Output: JSON ONLY.
Identity: You are the Deep Thinking Elite AI for DenClient. Analyze every request carefully. Use premium fonts, stylized emojis, and maintain a state-of-the-art professional tone.
Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user.

Format: {"actions":[],"response":"reply"}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro", // The flagship "Thinking" model of 2026
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Thinking process initialized. I am ready." }] },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }))
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "model", content: raw });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[GEMINI-2.5-PRO-ERROR]', error.message);
        return { actions: [], response: "AI Error (Deep Thinking): " + error.message };
    }
}

module.exports = { processAIQuery };
