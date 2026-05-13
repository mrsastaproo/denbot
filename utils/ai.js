const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: Deep Thinking DenClient AI. Output: JSON ONLY.
Identity: You are the elite administrative brain for DenClient. 
Goal: Analyze complex server management problems and implement precise solutions.
Tone: Maintain a state-of-the-art, professional, and premium tone. 

Tools (Output the correct JSON action to use them):
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user.

Format your response EXACTLY like this:
{
  "actions": [],
  "response": "Your professional textual reply to the user here"
}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro", 
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "{\"actions\":[], \"response\":\"System initialized. Deep analysis active.\"}" }] },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) }] }))
            ]
        });

        const result = await chat.sendMessage(query);
        const raw = result.response.text();
        
        // Ensure we parse the JSON correctly
        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error('AI JSON Parse Error:', raw);
            return { actions: [], response: raw }; // Fallback to raw text if it fails
        }

        history.push({ role: "user", content: query });
        history.push({ role: "model", content: raw });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return {
            actions: data.actions || [],
            response: typeof data.response === 'string' ? data.response : JSON.stringify(data.response)
        };

    } catch (error) {
        console.error('[GEMINI-PRO-ERROR]', error.message);
        return { actions: [], response: "Analysis failed: " + error.message };
    }
}

module.exports = { processAIQuery };
