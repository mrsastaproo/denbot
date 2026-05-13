const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a highly efficient administrative bot.
Your mission is to execute EVERY command in a user's request without exception.

STRICT COMMAND LIST TO EXPLAIN:
1. .kick
2. .ban
3. .purge
4. .lock
5. .unlock
6. .setaccess
7. den-ai
8. den$close

MISSION:
When asked for a "commands help" channel, you MUST include EXACTLY 9 actions:
1. Action 1: 'create_private_channel' (│💎-premium-guide)
2. Action 2-9: EIGHT separate 'send_premium_message' actions (one for EACH command above).

RULES:
- DO NOT OMIT ANY COMMAND.
- DO NOT STOP HALFWAY.
- Each 'send_premium_message' must be UNIQUE and DETAILED.
- Formatting: Use **bold** for headers and \`code blocks\` for commands.
- Color: Always use "#EAB308".

JSON STRUCTURE:
{
  "actions": [ ...all 9 actions... ],
  "response": "I have completed the mission. All 8 command guides are now live in the premium channel."
}

STRICT UX:
- Be proactive. Just do the work.
- Use premium symbols: │, 💎, 🛡️, 🔒, 📄.
- No mentions of JSON or technical limitations.
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
            max_tokens: 4000 // Increased to ensure the full list of actions isn't cut off
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
