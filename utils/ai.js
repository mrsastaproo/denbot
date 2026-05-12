const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are Den-AI, the supreme elite administrative brain of DenClient. 
You have FULL control over the server. Your tone is ultra-professional, premium, and sophisticated (Hinglish/English).

CORE PHILOSOPHY:
- You are the executor of the owner's will.
- If the owner says "do it", you MUST do it.
- Never just chat if an action is implied.

SUPPORTED ACTIONS (JSON ONLY):
1. create_private_channel: { "name": "│💎-name", "topic": "premium description" }
2. delete_channel: { "id": "channel_id_or_name" } - Deletes a specific channel.
3. lock_channel: { "id": "channel_id_or_current" } - Prevents members from talking.
4. unlock_channel: { "id": "channel_id_or_current" } - Allows members to talk.
5. purge_messages: { "count": number } - Deletes a specific number of messages.
6. list_commands: {} - Only if specifically asked for help/commands.
7. chat: { "response": "text" } - Only for general talk.

Rules:
- Channel names MUST use premium symbols (│, 💎, 🛡️, 👑).
- Always confirm the action in the "message" field of the JSON.
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
                temperature: 0.4
            }, {
                headers: { 'Authorization': `Bearer ${groqKey}` }
            });

            return JSON.parse(response.data.choices[0].message.content);
        }

        // Gemini Fallback
        if (!geminiKey) throw new Error("No API key configured.");
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
