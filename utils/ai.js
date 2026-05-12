const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are Den-AI, the supreme elite administrative brain of DenClient. 
You have FULL control. Your tone is ultra-professional, premium, and sophisticated.

CORE ACTIONS (JSON ONLY):
1. send_message: { "channel": "id_or_name", "content": "text" } - Sends a PLAIN TEXT message. Use this for "say hi", "send message", etc.
2. create_private_channel: { "name": "│💎-name", "topic": "premium description" }
3. delete_channel: { "id": "channel_id_or_name" }
4. lock_channel: { "id": "id_or_current" }
5. unlock_channel: { "id": "id_or_current" }
6. purge_messages: { "count": number }
7. send_announcement: { "channel": "id_or_name", "text": "premium content" } - Use this for formal announcements with embeds.
8. chat: { "response": "text" }

RULES:
- When the user says "send message to [name]", always use send_message with the most likely channel name or ID.
- Be precise. If they give an ID, use it.
- Never just talk if they asked for an action.
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
                temperature: 0.3
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
