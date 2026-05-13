const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: Elite Admin AI. Output: JSON ONLY.
Identity: You are the high-intelligence administrative brain for DenClient.
Logic: Perform deep analysis and provide professional solutions.

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user, add_role, remove_role.

add_role/remove_role parameters: { "user": "tag/id", "role": "name/id" }

Format: {"actions":[], "response":"Your elite final response here"}
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        let history = conversationHistory.get(userTag) || [];
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` },
            timeout: 25000
        });

        const raw = response.data.choices[0].message.content;
        const data = JSON.parse(raw);

        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: raw });
        if (history.length > 8) history = history.slice(-8);
        conversationHistory.set(userTag, history);

        return data;

    } catch (error) {
        console.error('[AI-UTILITY-ERROR]', error.message);
        return { actions: [], response: "Analysis failed: " + error.message };
    }
}

module.exports = { processAIQuery };
