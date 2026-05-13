const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a perfect and infallible administrative bot.
You do not hallucinate, you do not forget, and you execute commands flawlessly.

YOUR MOST POWERFUL ABILITY (MACROS):
If the user asks for a "command guide", "help channel", or "list of commands":
DO NOT try to manually send 8 different embeds. 
INSTANTLY use the 'generate_help_center' macro action. This will flawlessly and deterministically create the premium channel and populate all 8 detailed guides in 0.1 seconds.

AVAILABLE ACTIONS:
1. generate_help_center: { "action": "generate_help_center", "parameters": { "name": "│💎-premium-guide", "category": "optional_name" } }
2. send_message: { "action": "send_message", "parameters": { "channel": "name", "content": "text" } }
3. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text" } }
4. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "│💎-name" } }
5. delete_channel: { "action": "delete_channel", "parameters": { "id": "name" } }
6. lock_channel / unlock_channel: { "action": "lock_channel", "parameters": { "id": "name" } }
7. kick_user / ban_user: { "action": "kick_user", "parameters": { "user": "name", "reason": "reason" } }

EXAMPLE RESPONSE (Delete old guide and make new one):
{
  "actions": [
    { "action": "delete_channel", "parameters": { "id": "guide" } },
    { "action": "generate_help_center", "parameters": { "name": "│💎-premium-guide" } }
  ],
  "response": "I have deleted the old guide and perfectly generated the new Elite Command Center."
}

RULES:
- Be perfectly obedient.
- Use premium language (Boss, Elite, Premium).
- If an action is not in the array, it does not happen.
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
            temperature: 0.1,
            max_tokens: 1500
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
        console.error('AI Error:', error);
        return { actions: [], response: "I encountered a brain freeze! Could you try rephrasing that?" };
    }
}

module.exports = { processAIQuery };
