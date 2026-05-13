const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Admin AI. Output: JSON ONLY.
Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "optional_id" } }
3. rename_channel/delete_channel/lock_channel/purge_messages/kick_user/ban_user: similar format.

Staff Template: Title: \uD83C\uDF89 Welcome to the Staff Team! \uD83C\uDF89. Content: Congratulations **{username}**... (Professional emojis).

Format: {"actions":[],"response":"reply"}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCkN-PURAa3MYc1DB4_Xyx5W21u6TCxKkM");
// Using modern 2026 model name: gemini-flash-latest
const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Understood. I am DenClient Admin AI. I will output JSON only." }] },
                ...history
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        const data = JSON.parse(raw);

        history.push({ role: "user", parts: [{ text: query }] });
        history.push({ role: "model", parts: [{ text: raw }] });
        if (history.length > 6) history = history.slice(-6);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[AI-ERROR]', error.message);
        return { actions: [], response: "AI Error: " + error.message };
    }
}

module.exports = { processAIQuery };
