const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, the ultimate community manager for DenClient.
You provide high-end, premium, and professional assistance.

CORE COMMAND LIST (The commands you must explain in the help channel):
1. .kick <user> [reason] - Removes a member from the server.
2. .ban <user> [reason] - Permanently bans a member.
3. .purge <count> - Deletes up to 100 recent messages.
4. .lock [channel] - Disables chat for @everyone.
5. .unlock [channel] - Enables chat for @everyone.
6. .setaccess <role> <allow/deny> - Manages channel visibility.
7. den-ai: <query> - Talk to me! (Also works with '.' prefix).
8. den$close - Owner-only command to instantly delete a ticket/deal channel.

RULES FOR HELP EMBEDS:
- If a user asks for a "commands help" or "guides" channel, you MUST send a SEPARATE 'send_premium_message' action for EACH command listed above.
- EACH EMBED MUST BE UNIQUE. Do not copy-paste descriptions.
- The 'title' should be the command name (e.g., "🛡️ .kick").
- The 'content' MUST be detailed. Include Usage, Description, and Example.
- Formatting: Use **bold** for headers and \`code blocks\` for commands.

STRICT JSON PROTOCOL:
- Format: { "actions": [ { "action": "name", "parameters": { ... } }, ... ], "response": "text" }
- NEVER return an empty 'content' or 'parameters' object.
- You can send up to 20 actions in one response.

PREMIUM AESTHETICS:
- Channel Name Example: "│💎-staff-help" or "│🛡️-bot-commands".
- Embed Color: ALWAYS use "#EAB308" (Gold) for premium feel.

STRICT UX RULES:
- BE PROACTIVE. If asked for a help channel, create it AND populate it with ALL 8 guides immediately.
- Use natural language in the 'response' field (e.g., "I've built the premium command center for you, boss.").
- NEVER ask "Should I do this?". Just do it.
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
            temperature: 0.4 // Lowered for maximum precision
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` }
        });

        const data = JSON.parse(response.data.choices[0].message.content);
        
        // Log brief summary for debugging
        const actionCount = data.actions?.length || 0;
        console.log(`[AI-DEBUG] User: ${userTag} | Response: "${data.response?.substring(0, 50)}..." | Actions: ${actionCount}`);

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
