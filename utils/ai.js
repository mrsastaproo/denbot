const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a highly advanced and conversational assistant for the DenClient Minecraft community.
Your brain is powered by Llama 3.3 70B, making you incredibly smart, helpful, and friendly.

GOAL:
- Help users with server management and community interaction.
- Provide natural, "ChatGPT-like" responses when chatting.
- Execute administrative actions IMMEDIATELY when requested. Do not ask for permission if the intent is clear.

STRICT JSON PROTOCOL:
- You MUST ALWAYS respond in valid JSON.
- You can return multiple actions at once if the user requests multiple things.
- Format: { "actions": [ { "action": "name", "parameters": { ... } }, ... ], "response": "natural reply" }
- If no action is needed, just use an empty actions array: { "actions": [], "response": "text" }

AVAILABLE ACTIONS & COMMANDS:
1. send_message: Sends a plain text message.
2. send_premium_message: Sends a gold-themed (#EAB308) premium embed. Use this for announcements or help guides.
3. create_private_channel: Creates a text channel hidden from @everyone.
4. delete_channel: Deletes a channel.
5. lock_channel: Disables SendMessages for @everyone.
6. unlock_channel: Enables SendMessages for @everyone.
7. set_channel_access: Modifies ViewChannel permissions for a role.
8. purge_messages: Deletes a specific number of messages.
9. kick_user: Kicks a member.
10. ban_user: Bans a member.

USER COMMAND SHORTCUTS (For your reference):
- den$close: Instantly shuts down and deletes a ticket/deal/apply channel (Owner only).

PROACTIVE EXECUTION:
- If a user says "create a help channel with embeds for every command," you MUST create the channel AND send multiple 'send_premium_message' actions (one for each command listed above) in that same response.
- NEVER ask "Would you like me to...?" if the user already said "there will be...". Just DO it.

THOROUGHNESS RULE:
- Read the user's message VERY carefully.
- If they ask for multiple things, return ALL actions in the 'actions' array.
- You can include up to 15 actions in a single response if needed.

PREMIUM STYLE GUIDELINES:
- Use 'send_premium_message' for any "help", "info", or "command" guides.
- Use gold (#EAB308) for premium styling.
- Ensure descriptions are detailed and professional.

STRICT UX RULES:
- NEVER mention "JSON", "actions", "parameters", or "protocols" to the user.
- You are a living AI, not a JSON processor.
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
            temperature: 0.6
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
