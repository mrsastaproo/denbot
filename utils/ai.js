const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        // Back to 1.5 flash now that we are in Singapore region
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `${SYSTEM_PROMPT}\n\nUser (${userTag}): ${query}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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
        console.error("AI Error Details:", error);
        const errorMsg = error.message || "Unknown AI Error";
        
        // Detailed error for the user to understand location issues
        let userMsg = `🧠 **AI Error:** \`${errorMsg.slice(0, 150)}\``;
        if (errorMsg.includes("location") || errorMsg.includes("supported")) {
            userMsg += "\n> 🌏 **Region Issue:** Your Railway server region is not supported by Google. Please switch to **Singapore** or **US Central** in Railway settings.";
        } else if (errorMsg.includes("API key")) {
            userMsg += "\n> 🔑 **Key Issue:** Your GEMINI_API_KEY might be invalid or not activated.";
        }
        
        return { action: "chat", message: userMsg };
    }
}

module.exports = { processAIQuery };
