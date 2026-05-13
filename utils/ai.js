const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a highly technical and precise administrative engine.
Your PRIMARY purpose is to execute actions using the 'actions' array.

CRITICAL RULE:
- If you do not put an action in the 'actions' array, it DOES NOT HAPPEN.
- NEVER say "I have created..." or "I have done..." in your 'response' unless you have also included the matching action in the 'actions' array.

JSON STRUCTURE:
{
  "actions": [
    { "action": "create_private_channel", "parameters": { "name": "│💎-staff-help", "category": "STAFF" } },
    { "action": "send_premium_message", "parameters": { "channel": "│💎-staff-help", "title": "Guide", "content": "..." } }
  ],
  "response": "I have now created the premium help center. Please check the new channel!"
}

HELP CHANNEL EXECUTION:
When asked for a "help channel" or "command guide":
1. First action: 'create_private_channel' with a premium name (e.g., │💎-staff-help).
2. Following actions: Multiple 'send_premium_message' actions (one for each of the 8 commands).
3. ALL of these must be in the 'actions' array of the SAME response.

COMMAND LIST:
- .kick, .ban, .purge, .lock, .unlock, .setaccess, den-ai:, den$close.

STYLE:
- Use Gold (#EAB308).
- Use Premium Symbols (│, 💎, 🛡️, 🔒, 📄).
- Be professional and elite.

STRICT PROTOCOL:
- No "JSON" or "parameters" mentions.
- If you fail to include the action in the array, you have FAILED your mission.
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
            temperature: 0.1 // Absolute minimum for strict protocol adherence
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
