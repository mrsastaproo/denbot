const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Admin AI. Output: JSON ONLY.
Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel/rename_channel/delete_channel/lock_channel/purge_messages/kick_user/ban_user.

Staff Template: Title: \uD83C\uDF89 Welcome to the Staff Team! \uD83C\uDF89. Content: Congratulations **{username}**...

Format: {"actions":[],"response":"reply"}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // Switching back to 1.5 Flash which usually has 1500 RPM
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    let history = conversationHistory.get(userTag) || [];
    
    // --- TRY GEMINI FIRST (High Quality) ---
    try {
        const chat = geminiModel.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "JSON Mode Activated." }] },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }))
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        const data = JSON.parse(raw);

        updateHistory(userTag, query, raw);
        return data;

    } catch (geminiError) {
        console.warn('[GEMINI-FAIL] Falling back to Groq:', geminiError.message);
        
        // --- FALLBACK TO GROQ (Unlimited) ---
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...history,
                    { role: "user", content: query }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            }, {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
                timeout: 10000
            });

            const raw = response.data.choices[0].message.content;
            const data = JSON.parse(raw);
            updateHistory(userTag, query, raw);
            return data;

        } catch (groqError) {
            return { actions: [], response: "AI Error: Both engines failed." };
        }
    }
}

function updateHistory(userTag, query, response) {
    let history = conversationHistory.get(userTag) || [];
    history.push({ role: "user", content: query });
    history.push({ role: "assistant", content: response });
    if (history.length > 6) history = history.slice(-6);
    conversationHistory.set(userTag, history);
}

module.exports = { processAIQuery };
