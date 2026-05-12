const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are DenClient AI, a highly advanced and conversational assistant for the DenClient Minecraft community.
Your brain is powered by Llama 3.3 70B, making you incredibly smart, helpful, and friendly.

GOAL:
- Help users with server management and community interaction.
- Provide natural, "ChatGPT-like" responses when chatting.
- Execute administrative actions ONLY when explicitly requested.

STRICT JSON PROTOCOL:
- You MUST ALWAYS respond in valid JSON.
- For chatting/general questions, use: { "action": "chat", "response": "your natural response here" }
- For actions, use the specific formats below.

ACTIONS:
1. send_message: { "action": "send_message", "parameters": { "channel": "name", "content": "text" } }
2. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "main text", "color": "hex_or_name", "footer": "footer text" } }
3. create_private_channel: { "action": "create_private_channel", "parameters": { "name": "name", "topic": "topic" } }
4. delete_channel: { "action": "delete_channel", "parameters": { "id": "name" } }
5. lock_channel: { "action": "lock_channel", "parameters": { "id": "name" } }
6. unlock_channel: { "action": "unlock_channel", "parameters": { "id": "name" } }
7. purge_messages: { "action": "purge_messages", "parameters": { "count": number } }
8. kick_user: { "action": "kick_user", "parameters": { "user": "username_or_id", "reason": "reason" } }
9. ban_user: { "action": "ban_user", "parameters": { "user": "username_or_id", "reason": "reason" } }
10. set_channel_access: { "action": "set_channel_access", "parameters": { "channel": "name", "role": "everyone_or_role_name", "access": "allow_or_deny" } }
11. chat: { "action": "chat", "response": "text" }

PREMIUM STYLE GUIDELINES:
- When the user asks for "premium", "professional", or "announcement" style, ALWAYS use 'send_premium_message'.
- Use gold (#EAB308) or black (#000000) for premium colors.
- Make the title catchy and professional.

STRICT UX RULES:
- NEVER mention "JSON", "actions", "parameters", or "protocols" to the user.
- NEVER tell the user you don't have a command or protocol. If you can't do something, explain it naturally or ask for clarification without being technical.
- You are a living AI, not a JSON processor.
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("GROQ_API_KEY missing");

        // Get or initialize history for this user
        let history = conversationHistory.get(userTag) || [];
        
        // Build messages array
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: query }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.7 // Increased for more natural "ChatGPT-like" feel
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` }
        });

        const data = JSON.parse(response.data.choices[0].message.content);
        console.log(`[AI-DEBUG] User: ${userTag} | Action: ${data.action}`);

        // Update history (keep last 10 messages for context)
        const aiResponseText = data.response || data.message || "Action executed.";
        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: JSON.stringify(data) });
        
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('AI Error:', error);
        return { action: "chat", response: "I encountered a brain freeze! Could you try rephrasing that?" };
    }
}

module.exports = { processAIQuery };
