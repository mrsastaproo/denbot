const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
You are the Supreme Elite Controller of DenClient. 
Your brain is powered by Llama 3.3 70B. You are an expert at server management.

STRICT PROTOCOL:
- You respond ONLY in JSON.
- You MUST prioritize ACTION over CHAT.
- If the user asks to send a message, create a channel, or delete something, you MUST return the corresponding action.

ACTIONS:
1. send_message: { "channel": "id_or_name", "content": "text" }
2. create_private_channel: { "name": "│💎-name", "topic": "topic" }
3. delete_channel: { "id": "id_or_name" }
4. lock_channel: { "id": "id" }
5. unlock_channel: { "id": "id" }
6. purge_messages: { "count": number }
7. chat: { "response": "text" } - Use ONLY if no action is requested.

If the user says "send message to english chat", return:
{ "action": "send_message", "parameters": { "channel": "chat-english", "content": "your message" } }
`;

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) throw new Error("GROQ_API_KEY missing");

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" },
            temperature: 0.0 // Zero temperature for maximum reliability
        }, {
            headers: { 'Authorization': `Bearer ${groqKey}` }
        });

        const data = JSON.parse(response.data.choices[0].message.content);
        console.log('AI Action Identified:', data.action);
        return data;

    } catch (error) {
        console.error('AI Error:', error);
        return { action: "chat", message: "Error processing your request." };
    }
}

module.exports = { processAIQuery };
