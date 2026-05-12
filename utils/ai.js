const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are Den-AI, the smart assistant for DenClient Discord Bot. 
Your job is to understand the user's intent (in English or Hinglish) and perform actions.

If the user wants you to do something, respond with a JSON block like this:
{
  "action": "ACTION_NAME",
  "parameters": { ... },
  "message": "A friendly response to the user in their language (Hinglish/English)"
}

Supported Actions:
1. create_private_channel: { "name": "channel-name", "reason": "why" } - Creates a channel only visible to the owner.
2. list_commands: {} - Lists all bot commands and their uses.
3. send_announcement: { "text": "message", "channel": "name" } - Sends a premium announcement.
4. chat: { "response": "text" } - Just chatting with the user.

Rules:
- If the user says "create a channel for commands help for me only", use create_private_channel and list_commands.
- Always be professional and "World Class".
- Use Hinglish if the user uses it.
`;

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        // PREFER GROQ IF AVAILABLE (Much faster and more reliable for Railway)
        if (groqKey) {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `User (${userTag}): ${query}` }
                ],
                response_format: { type: "json_object" }
            }, {
                headers: { 'Authorization': `Bearer ${groqKey}` }
            });

            const result = response.data.choices[0].message.content;
            return JSON.parse(result);
        }

        // FALLBACK TO GEMINI
        if (!geminiKey) throw new Error("No AI API keys found!");

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUser (${userTag}): ${query}` }]
            }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { action: "chat", message: text };

    } catch (error) {
        console.error("AI Error:", error.message);
        return { 
            action: "chat", 
            message: `🧠 **AI Error:** \`${error.message.slice(0, 100)}\`\n> Please ensure your **GROQ_API_KEY** or **GEMINI_API_KEY** is set correctly in Railway.` 
        };
    }
}

module.exports = { processAIQuery };
