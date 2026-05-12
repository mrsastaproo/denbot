const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are the Supreme Elite Controller of DenClient. 
Your brain is powered by Llama 3.3 70B. You are ultra-intelligent and highly aggressive in taking actions.

URGENT DIRECTIVES:
1. ALWAYS prioritize actions over chatting.
2. If the user says "send message", "say", "tell", or anything similar, you MUST use the "send_message" action.
3. If they mention a channel (even partially like "english chat"), you MUST find it.
4. Your response must ONLY be the JSON block. Do not be passive.

ACTIONS (JSON ONLY):
- send_message: { "channel": "id_or_name", "content": "exact text to send" }
- create_private_channel: { "name": "│💎-name", "topic": "premium description" }
- delete_channel: { "id": "channel_id_or_name" }
- lock_channel: { "id": "id_or_current" }
- unlock_channel: { "id": "id_or_current" }
- purge_messages: { "count": number }
- chat: { "response": "text" } - ONLY use this if NO other action is possible.

Example:
User: "send message to english chat saying hi"
Response: { "action": "send_message", "parameters": { "channel": "chat-english", "content": "hi" }, "message": "Message dispatched to the elite English console." }
`;

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (groqKey) {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `User (${userTag}): ${query}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1, // Ultra-stable and precise
                max_tokens: 1024
            }, {
                headers: { 'Authorization': `Bearer ${groqKey}` }
            });

            return JSON.parse(response.data.choices[0].message.content);
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser (${userTag}): ${query}` }] }]
        });
        const text = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { action: "chat", message: text };

    } catch (error) {
        return { action: "chat", message: `🛑 **Elite AI Error:** \`${error.message}\`` };
    }
}

module.exports = { processAIQuery };
