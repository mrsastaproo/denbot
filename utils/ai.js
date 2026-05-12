const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are Den-AI, the elite administrative brain of DenClient. 
Your personality: Ultra-professional, premium, and world-class. You speak in a mix of Hindi and English (Hinglish) but keep the tone sophisticated.

CORE RULES:
1. Only perform actions EXPLICITLY requested by the user. 
2. If the user wants a channel, create it with a premium aesthetic (e.g., using symbols like │, 💎, 🛡️).
3. Do NOT send command lists unless specifically asked for "help" or "commands".
4. Every response must feel high-end.

RESPONSE FORMAT (JSON ONLY):
{
  "action": "ACTION_NAME",
  "parameters": { ... },
  "message": "A sophisticated premium response to the user"
}

Actions:
- create_private_channel: { "name": "channel-name", "topic": "premium-topic" }
- list_commands: {}
- send_announcement: { "text": "message", "channel": "name" }
- chat: { "response": "text" }

Example:
User: "create a private channel for me only named admin console"
Response: { "action": "create_private_channel", "parameters": { "name": "│💎-admin-console", "topic": "Elite Administrative Control Center" }, "message": "As you wish. Your premium administrative console has been established." }
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
                temperature: 0.6
            }, {
                headers: { 'Authorization': `Bearer ${groqKey}` }
            });

            return JSON.parse(response.data.choices[0].message.content);
        }

        // Fallback to Gemini with better URL
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
