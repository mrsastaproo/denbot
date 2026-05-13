const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: Elite Admin AI (Self-Correction Mode). Output: JSON ONLY.
Identity: You are the high-intelligence administrative brain for DenClient.
Logic: You must use a 3-step reasoning process for every request:
1. DEEP ANALYSIS: Identify the core problem and user intent.
2. CRITIQUE: Look for flaws in your initial plan. Ensure the tone is elite and the solution is precise.
3. FINAL EXECUTION: Output the perfect professional solution.

Tone: Maintaining a state-of-the-art, premium, and professional aesthetic is mandatory. Use stylized emojis and clean formatting.

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "thumbnail": "url" } }
2. create_private_channel, rename_channel, delete_channel, lock_channel, purge_messages, kick_user, ban_user.

Format: {"actions":[], "response":"Your elite final response here"}
`;

const conversationHistory = new Map();

async function processAIQuery(query, userTag) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        let history = conversationHistory.get(userTag) || [];
        
        // No fake delay - we let the 70B brain actually process the self-correction logic
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "meta-llama/llama-4-scout-17b-16e-instruct", // 272B MoE Mega-Brain (Llama 4 Generation)
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: query }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4, // Balanced for thoughtful but precise output
            top_p: 0.9
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

        return {
            actions: data.actions || [],
            response: data.response
        };

    } catch (error) {
        console.error('[UNLIMITED-THINKING-ERROR]', error.message);
        return { actions: [], response: "Analysis failed: " + error.message };
    }
}

module.exports = { processAIQuery };
