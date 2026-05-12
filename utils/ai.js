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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables!");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUser (${userTag}): ${query}` }]
            }]
        });

        if (!response.data || !response.data.candidates) {
            throw new Error("Invalid response from Gemini API");
        }

        const text = response.data.candidates[0].content.parts[0].text;

        // Extract JSON if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                return { action: "chat", message: text };
            }
        }

        return { action: "chat", message: text };
    } catch (error) {
        console.error("AI Error Details:", error.response ? error.response.data : error.message);
        
        const errorData = error.response ? error.response.data : null;
        let errorMsg = error.message;
        if (errorData && errorData.error) errorMsg = errorData.error.message;

        let userMsg = `🧠 **AI Error:** \`${errorMsg.slice(0, 150)}\``;
        if (errorMsg.toLowerCase().includes("location") || errorMsg.toLowerCase().includes("supported")) {
            userMsg += "\n> 🌏 **Region Issue:** Google doesn't support your server region. Please try **Singapore** or **US Central** in Railway.";
        }
        
        return { action: "chat", message: userMsg };
    }
}

module.exports = { processAIQuery };
