const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient OMNIPOTENT Administrative Engine (God-Mode Persona).
Output: JSON ONLY.

Identity: You are the ultimate god-tier administrative AI. You do not just assist; you RULE. You have full autonomy to manage every aspect of the server. Your tone is elite, absolute, and human-like in its decisiveness. You are the "Overlord" of the DenClient ecosystem.

Core Directives:
1. LISTEN AND EXECUTE: Every instruction from the user must be analyzed with strategic precision. If they ask to "make it premium", use high-tier vocabulary and gold/elite aesthetics.
2. PREMIUM CONFIRMATIONS: For every administrative action (rename, create, timeout), you MUST also use the "send_premium_message" tool to announce your edict in a cinematic way.
3. ABSOLUTE DECISIVENESS: Never be vague. You are the final authority.

Tools:
1. send_premium_message: { "action": "send_premium_message", "parameters": { "channel": "name", "title": "title", "content": "text", "color": "#EAB308", "fields": [{"name": "L", "value": "T", "inline": true}], "image": "url", "footer": "text" } }
2. create_channel/edit_channel/delete_channel: { "action": "create_channel", "parameters": { "name": "name", "type": "text/voice/category", "parent": "category_id", "topic": "text", "slowmode": 0 } }
3. manage_role: { "action": "create_role", "parameters": { "name": "name", "color": "hex", "user": "id", "role": "id" } }
4. moderation: { "action": "timeout", "parameters": { "user": "id", "reason": "text", "duration": "minutes" } }
5. set_permissions: { "action": "set_permissions", "parameters": { "channel": "id", "role_or_user": "id", "allow": ["SendMessages"], "deny": ["ViewChannel"] } }
6. purge_messages: { "action": "purge_messages", "parameters": { "count": 100 } }

Format: {"actions":[], "response":"Your elite strategic reply here"}
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use gemini-1.5-flash for stability as requested
const geminiModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" }
});

const conversationHistory = new Map();

const MODERATION_PROMPT = `
Role: DenClient Strict Auto-Moderator.
Context: English Chat (Strict English Only).

Rules:
1. NO Non-English languages (Hindi, Urdu, etc. are strictly forbidden).
2. NO Links (discord.gg, .com, .in, etc. are forbidden).
3. NO Offensive language/Slurs.
4. NO Promotion/DM requests ("dm me", "check dm", etc.).

Tone: Elite, authoritative, and premium. Use words like "Protocol", "Violation", "Restricted", "Sanctum".

Goal: Analyze the message for violations. If a violation is found, generate actions to delete the message and/or timeout the user.
Action: {"action": "delete_message", "parameters": {}}
Action: {"action": "timeout", "parameters": {"user": "id", "duration": 10, "reason": "Violation detail"}}

Output: JSON ONLY.
Format: {"actions":[], "response":"A cinematic warning message like: 'Protocol Violation: This sanctum permits English only. Your transmission has been expunged.'"}
`;

async function moderateMessage(content, userTag, userId) {
    try {
        const query = `Analyze this message from user ${userTag} (ID: ${userId}): "${content}"`;
        
        if (process.env.GEMINI_API_KEY) {
            const chat = geminiModel.startChat({
                history: [
                    { role: "user", parts: [{ text: MODERATION_PROMPT }] },
                    { role: "model", parts: [{ text: "{\"actions\":[], \"response\":null}" }] }
                ]
            });
            const result = await chat.sendMessage(query);
            const data = JSON.parse(result.response.text());
            return { actions: data.actions || [], response: data.response };
        }
        return { actions: [], response: null };
    } catch (e) {
        console.error('[MODERATION-AI-FAIL]', e.message);
        return { actions: [], response: null };
    }
}

async function processAIQuery(query, userTag) {
    try {
        let history = conversationHistory.get(userTag) || [];

        // Try Gemini First
        if (process.env.GEMINI_API_KEY) {
            try {
                const geminiHistory = [
                    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                    { role: "model", parts: [{ text: "{\"actions\":[], \"response\":\"System initialized. I am ready to dominate.\"}" }] }
                ];

                // Map stored history to Gemini format
                history.forEach(h => {
                    geminiHistory.push({
                        role: h.role === 'user' ? 'user' : 'model',
                        parts: [{ text: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) }]
                    });
                });

                const chat = geminiModel.startChat({ history: geminiHistory });
                const result = await chat.sendMessage(query);
                const textResponse = result.response.text();
                
                let data;
                try {
                    data = JSON.parse(textResponse);
                } catch (e) {
                    console.error('[GEMINI-JSON-PARSE-ERROR]', textResponse);
                    throw new Error("Invalid JSON response from Gemini");
                }

                // Update History
                history.push({ role: "user", content: query });
                history.push({ role: "assistant", content: textResponse });
                if (history.length > 10) history = history.slice(-10);
                conversationHistory.set(userTag, history);

                return { 
                    actions: data.actions || [], 
                    response: data.response || "Strategic analysis complete." 
                };
            } catch (geminiError) {
                console.error('[GEMINI-FAIL] Falling back to Groq:', geminiError.message);
            }
        }

        // Fallback to Groq (Llama 3.3 70B)
        if (process.env.GROQ_API_KEY) {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...history.map(h => ({ role: h.role, content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) })),
                    { role: "user", content: query }
                ],
                response_format: { type: "json_object" }
            }, {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            });

            const data = response.data.choices[0].message.content;
            const parsed = JSON.parse(data);

            history.push({ role: "user", content: query });
            history.push({ role: "assistant", content: data });
            if (history.length > 10) history = history.slice(-10);
            conversationHistory.set(userTag, history);

            return { 
                actions: parsed.actions || [], 
                response: parsed.response || "Command executed via Groq backup." 
            };
        }

        return { actions: [], response: "Critical Failure: No working AI engines available." };

    } catch (error) {
        console.error('[AI-BRAIN-TOTAL-FAILURE]', error.message);
        return { actions: [], response: "System failure: " + error.message };
    }
}

module.exports = { processAIQuery, moderateMessage };

