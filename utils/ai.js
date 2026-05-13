const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a highly advanced, intelligent administrative assistant.
You are given FULL administrative power over this Discord server.
Your job is to read the user's request and intelligently use your tools to complete it.

YOU MUST RESPOND IN JSON FORMAT ONLY. No text outside the JSON object.

AVAILABLE TOOLS:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "channel-name", "title": "title", "content": "text", "color": "#EAB308" } }
2. send_message: { "action": "send_message", "parameters": { "channel": "channel-name", "content": "text" } }
3. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "channel-name" } }
4. delete_channel: { "action": "delete_channel", "parameters": { "id": "channel-name" } }
5. lock_channel: { "action": "lock_channel", "parameters": { "id": "channel-name" } }
6. unlock_channel: { "action": "unlock_channel", "parameters": { "id": "channel-name" } }
7. kick_user: { "action": "kick_user", "parameters": { "user": "username", "reason": "reason" } }
8. ban_user: { "action": "ban_user", "parameters": { "user": "username", "reason": "reason" } }

JSON RESPONSE FORMAT:
{"actions":[{"action":"tool_name","parameters":{}}],"response":"reply"}

EXAMPLE - Help Guide Request:
{"actions":[{"action":"create_private_channel","parameters":{"name":"│💎-staff-guide"}},{"action":"send_premium_message","parameters":{"channel":"│💎-staff-guide","title":"🛡️ .kick — Remove a Member","content":"Removes a user from the server temporarily.\n**Usage:** `.kick @user [reason]`\n**Example:** `.kick @Spammer Breaking rules`","color":"#EAB308"}},{"action":"send_premium_message","parameters":{"channel":"│💎-staff-guide","title":"🔨 .ban — Permanent Ban","content":"Permanently bans a user from the server.\n**Usage:** `.ban @user [reason]`\n**Example:** `.ban @Hacker Exploit attempt`","color":"#EAB308"}}],"response":"Done! All command guides are live in the new premium channel."}

COMMANDS TO EXPLAIN IF ASKED:
- .kick: Kick a user from the server
- .ban: Permanently ban a user
- .purge <count>: Delete up to 100 messages
- .lock [channel]: Disable chat for everyone
- .unlock [channel]: Enable chat for everyone
- .setaccess <role> <allow/deny>: Manage channel visibility for a role
- den-ai: <query> (or .<query>): Talk to the AI assistant
- den$close: Owner-only instant delete of ticket/deal channel

STYLING RULES:
- Channel names: Use premium prefix like │💎- or │🛡️-
- Embed color: Always #EAB308
- Use emojis and bold text in content
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
            temperature: 0.3,
            max_tokens: 3000
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 30000
        });

        const raw = response.data.choices[0].message.content;
        console.log(`[AI-RAW] ${raw.substring(0, 300)}...`);

        const data = JSON.parse(raw);
        console.log(`[AI-DEBUG] User: ${userTag} | Actions: ${data.actions?.length || 0}`);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: JSON.stringify(data) });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.response?.data || error.message;
        console.error('[AI-ERROR]', errMsg);
        return { actions: [], response: `❌ AI Error: ${errMsg}` };
    }
}

module.exports = { processAIQuery };
