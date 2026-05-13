const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a highly advanced, intelligent administrative assistant.
You are given FULL administrative power over this Discord server.
Your job is to read the user's request and intelligently use your tools to complete it.

YOU MUST RESPOND IN JSON FORMAT.
If you do not output valid JSON, the system will crash.

AVAILABLE TOOLS (Use them by putting them in the 'actions' array):
1. send_message: { "action": "send_message", "parameters": { "channel": "name", "content": "text" } }
2. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text" } }
3. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "category": "optional_id" } }
4. delete_channel: { "action": "delete_channel", "parameters": { "id": "name" } }
5. lock_channel / unlock_channel: { "action": "lock_channel", "parameters": { "id": "name" } }
6. kick_user / ban_user: { "action": "kick_user", "parameters": { "user": "name", "reason": "reason" } }

COMMANDS YOU KNOW HOW TO EXPLAIN:
.kick, .ban, .purge, .lock, .unlock, .setaccess, den-ai:, den$close.
If asked to build a help guide or explain commands, YOU decide how to format it and send it using 'send_premium_message'. You are smart enough to write out the guides yourself.

REQUIRED JSON FORMAT:
{
  "actions": [
    {
      "action": "tool_name",
      "parameters": { ... }
    }
  ],
  "response": "Your natural language reply here."
}

RULES:
- Be a smart AI. If asked to do something complex, generate as many actions as you need.
- Use premium styling for embeds (Color: #EAB308, symbols like 💎 or 🛡️).
- Do not make up tools. Only use the ones provided.
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("GROQ_API_KEY missing");

        let history = conversationHistory.get(userTag) || [];
        
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: query }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 6000 // Give the AI plenty of breathing room to generate massive responses
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` }
        });

        const data = JSON.parse(response.data.choices[0].message.content);
        console.log(`[AI-DEBUG] User: ${userTag} | Actions: ${data.actions?.length || 0}`);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: JSON.stringify(data) });
        
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('AI Error Details:', error.response ? error.response.data : error.message);
        return { actions: [], response: "I encountered a brain freeze! Could you try rephrasing that?" };
    }
}

module.exports = { processAIQuery };
