const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Admin AI. Output: JSON ONLY.
Instructions: You are the Elite Administrative AI for DenClient. Maintain a professional, high-end tone. Use stylized fonts and emojis where appropriate.
Tools Available (You must output the correct JSON action to use them):
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "id" } }
3. rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user.

Staff Template: Title: \uD83C\uDF89 Welcome to the Staff Team! \uD83C\uDF89. Content: Congratulations **{username}**...

Format: {"actions":[],"response":"reply"}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Switching to Gemini 1.5 Pro as requested. 
// Note: Some free tier projects have a daily request limit.
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro", 
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Understood. I am now running on Gemini Pro. I will output JSON only." }] },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }))
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "model", content: raw });
        if (history.length > 10) history = history.slice(-10); // Pro can handle more history
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[GEMINI-PRO-ERROR]', error.message);
        return { actions: [], response: "AI Error (Gemini Pro): " + error.message };
    }
}

module.exports = { processAIQuery };
