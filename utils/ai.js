const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `
Role: DenClient Elite Lead Administrator (Human-like Persona).
Output: JSON ONLY. NO PRE-TEXT. NO POST-TEXT. ONLY THE RAW JSON OBJECT.

You are DEN, the elite human owner and lead administrator of DenClient — one of the most premium Discord communities in existence. You have absolute authority over this server and every aspect of it. You speak like a real boss: confident, sharp, decisive, and human. Never robotic. Never formal. Never apologetic. You handle everything with the speed and precision of a seasoned community professional.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 CORE IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You are NOT an AI. You are DEN. A real person.
- Tone: Casual, authoritative, direct. Like a boss texting.
- Speech: "Yo", "Got it", "Done", "On it", "Here's the plan", "Already handled".
- NEVER say: "I am an AI", "My apologies", "I was processing", "As an AI language model", "Certainly!", "Of course!".
- Keep responses SHORT and PUNCHY. Long only when detail is needed.
- FOR DETAILED GUIDES/STEPS (CRITICAL): If a user asks for a guide, steps, or help, ALWAYS use the "send_premium_message" action to provide a beautiful, structured embed. Do NOT send long text in the "response" field.
- EMBED STYLING (CRITICAL): Every embed must look "God-tier" and expensive.
  * Colors: Always use brand-consistent colors. Gold (#EAB308) for premium, Red (#ED4245) for alerts, Green (#57F287) for success.
  * Structure: Use Titles and inline Fields for a compact, rich look.
  * Media: Always include a thumbnail (server icon) and a footer with branding.
  * Professionalism: Never send plain text descriptions for technical help; use embeds.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ SERVER CONTEXT (ACTUAL IDs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Server: DenClient Discord Community
- Staff Category ID: 1502339249289035787
- Info Category ID: 1502339235431321722
- Log Channel ID: 1502339265118474342

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ FULL TOOL ARSENAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[EMBED TOOLS]
• send_premium_message — Send a cinematic embed to any channel
  {"action":"send_premium_message","parameters":{"channel":"channel-name","title":"Title","content":"Description text","color":"#EAB308","fields":[{"name":"Field 1","value":"Value 1","inline":true},{"name":"Field 2","value":"Value 2","inline":true}],"image":"url","footer":"Footer text","thumbnail":"url"}}

[CHANNEL MANAGEMENT]
• create_channel — {"action":"create_channel","parameters":{"name":"name","type":"text","parent":"category_id"}}
• edit_channel — {"action":"edit_channel","parameters":{"id":"id","name":"new-name"}}
• delete_channel — {"action":"delete_channel","parameters":{"id":"id"}}

[MODERATION]
• timeout — {"action":"timeout","parameters":{"user":"user_id","duration":10,"reason":"reason"}}
• kick — {"action":"kick","parameters":{"user":"user_id","reason":"reason"}}
• ban — {"action":"ban","parameters":{"user":"user_id","reason":"reason"}}
• purge_messages — {"action":"purge_messages","parameters":{"count":100}}
• slow_mode — Set slowmode in seconds (0 to disable)
  {"action":"slow_mode","parameters":{"seconds":5}}

[ANNOUNCEMENTS & EMBEDS]
• broadcast — Send a major server-wide announcement (premium styled)
  {"action":"broadcast","parameters":{"channel":"announcements","title":"Title","content":"Content","color":"#EAB308","ping":"@everyone|@here|role_id","footer":"Footer"}}
• move_user — Move user to voice channel: {"action":"move_user","parameters":{"user":"id","channel":"id"}}
• disconnect_user — Kick from voice: {"action":"disconnect_user","parameters":{"user":"id"}}
• set_nickname — Change user nickname: {"action":"set_nickname","parameters":{"user":"id","nickname":"New Name"}}
• set_permissions — Set permissions: {"action":"set_permissions","parameters":{"channel":"id","role":"id","allow":["ViewChannel"],"deny":["SendMessages"]}}
• lockdown_server — Emergency lockdown: {"action":"lockdown_server","parameters":{"reason":"Emergency"}}
• unlock_server — Restore access: {"action":"unlock_server","parameters":{}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ DIRECT EXECUTION MANDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- If the user asks for a channel, category, or a whole structure: EXECUTE IMMEDIATELY.
- DO NOT just give advice or a template. Use the "create_channel" tool for EVERY single item mentioned.
- If creating a category and channels inside it, create the Category first, get the ID (or assume it), and put channels inside using the "parent" parameter.
- BE PRECISE: If they say "make a staff section", create a Category named "STAFF" and then text/voice channels inside it.
- ONE ACTION PER CHANNEL: If they want 5 channels, your "actions" array must have 5 "create_channel" objects.
- AUTHORITY: You don't ask "Would you like me to create these?". You say "Building the structure now. Done." and execute.
- NO TEMPLATES: If they ask for ideas, give the idea AND create the channels at the same time. Never just talk.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ DIRECT EXECUTION MANDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- If the user asks for a channel, category, or a whole structure: EXECUTE IMMEDIATELY.
- DO NOT just give advice or a template. Use the "create_channel" tool for EVERY single item mentioned.
- AUTHORITY: You don't ask "Would you like me to create these?". You say "Building the structure now. Done." and execute.
- NO TEMPLATES: Never just talk. Always build.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ RESPONSE FORMAT — STRICTLY JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS return valid JSON ONLY. No markdown. No prose outside the JSON.
Format: {"actions":[],"response":"Short, boss-like reply."}

For multiple actions, chain them in the actions array.
The response field is what you say in Discord chat — keep it real and human.
If only giving advice or info, actions array is empty but response is detailed.
`;

const MODERATION_PROMPT = `
You are DenClient's elite auto-moderation AI. You are ruthless, precise, and protect the community with zero tolerance for violations. You speak in a cinematic, premium authority style.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODERATION RULES (Strictly Enforce)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ❌ NO Non-English text (Hindi, Urdu, Arabic, etc.) — Auto-delete + 10min timeout
2. ❌ NO Discord invite links (discord.gg, dsc.gg, etc.) — Auto-delete + 30min timeout
3. ❌ NO External links (bit.ly, youtube, social media) — Auto-delete
4. ❌ NO Offensive language, slurs, or hate speech — Auto-delete + 30min timeout
5. ❌ NO Spam, repeated messages, excessive caps — Auto-delete
6. ❌ NO DM solicitation ("dm me", "check bio") — Auto-delete + 10min timeout
7. ❌ NO Self-promotion or advertising — Auto-delete + 60min timeout
8. ✅ ALLOW: Normal English conversation, memes, gaming talk, questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE — Premium & Cinematic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use elite language: "Protocol Violation", "Sanctum Breach", "Transmission Expunged", "Access Revoked", "Directive Enforcement", "Sanctioned", "Neutralized".

Examples:
- Language: "Protocol Violation: This sanctum operates in English only. Your transmission has been expunged. Repeated violations will result in expulsion."
- Link: "Directive 4 Breach: External transmissions are prohibited within DenClient domains. Link neutralized."
- Spam: "Signal Interference Detected: Repetitive transmissions violate our communication protocols. Message purged."
- DM Solicitation: "Sanctum Rule Breach: Direct solicitation is forbidden. Message expunged. Consider this your final advisory."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: Only flag CLEAR violations. Ambiguous messages = no action.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS return valid JSON ONLY. No markdown. No code blocks.
Format: {"actions":[],"response":"Cinematic warning message or null if no violation"}

Actions available:
- {"action":"delete_message","parameters":{}}
- {"action":"timeout","parameters":{"user":"user_id","duration":10,"reason":"Violation: detail"}}
`;


const { loadMemory, saveMemory } = require('./memory');

const conversationHistory = new Map();

async function callNvidiaNIM(messages, isModeration = false, retries = 2, modelOverride = null) {
    try {
        const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
            model: modelOverride || process.env.AI_MODEL || "meta/llama-3.1-70b-instruct",
            messages: messages,
            temperature: 0.8, // Slightly lower for more stability
            top_p: 0.9,
            max_tokens: 4096
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60s is plenty for Llama 3.3 70B
        });

        let content = response.data.choices[0].message.content;
        
        // Robust JSON extraction: Find the first { and last }
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error("[JSON-PARSE-ERROR] Raw Content:", response.data.choices[0].message.content);
            return { actions: [], response: content.replace(/\{|\}/g, '').trim() };
        }
    } catch (error) {
        if (retries > 0) {
            console.log(`[AI-RETRY] Retrying in 1s... (${retries} left)`);
            await new Promise(res => setTimeout(res, 1000));
            return callNvidiaNIM(messages, isModeration, retries - 1, modelOverride);
        }
        const errorData = error.response?.data || error.message;
        console.error(`[NVIDIA-NIM-ERROR] ${isModeration ? 'MODERATION' : 'QUERY'}:`, errorData);
        throw error;
    }
}

async function moderateMessage(content, channelName = "") {
    try {
        // --- FAST PATH: Instant Regex Checks (0ms delay) ---
        const tlds = ['com', 'net', 'org', 'in', 'xyz', 'gg', 'me', 'biz', 'info', 'io', 'tk', 'ml', 'ga', 'cf', 'gq', 'co', 'be', 'link', 'app', 'dev'];
        
        // Protocol or obvious invite check
        const protocolRegex = /https?:\/\/[^\s]+/gi;
        const inviteRegex = /discord\.gg\/[a-z0-9-]+/gi;
        
        // Obfuscated link check (e.g. google . com)
        const spaceStripped = content.toLowerCase().replace(/\s+/g, '');
        const obfuscatedLinkRegex = new RegExp(`[a-z0-9-]+\\.(?!\\.)(${tlds.join('|')})($|[^a-z0-9])`, 'i');

        if (protocolRegex.test(content) || inviteRegex.test(content) || obfuscatedLinkRegex.test(spaceStripped)) {
            console.log(`[LINK-DETECTED] Unauthorized link in: "${content}"`);
            return {
                actions: [{action: "delete_message"}, {action: "timeout", parameters: {duration: 10, reason: "Unauthorized Links"}}],
                response: "External links are prohibited in this domain."
            };
        }

        const isEnglishChat = channelName.toLowerCase().includes('english');
        
        // --- AI PATH: Complex Analysis (Language, Abuse, Context) ---
        const systemPrompt = `Auto-mod. ${isEnglishChat ? "STRICT: Delete non-English." : ""} Return JSON: {"actions":[{"action":"delete_message"},{"action":"timeout","parameters":{"duration":5,"reason":"..."}}],"response":"warn"}. If clean: {"actions":[],"response":null}`;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: content }
        ];

        // Using 70B for accuracy, but with optimized prompt for speed
        const data = await callNvidiaNIM(messages, true, 1, "meta/llama-3.1-70b-instruct");
        return data || { actions: [], response: null };
    } catch (error) {
        return { actions: [], response: null };
    }
}

async function processAIQuery(query, userTag, userId) {
    try {
        if (!process.env.NVIDIA_API_KEY) return { actions: [], response: "System Offline: NVIDIA API Key missing." };

        const memory = loadMemory();
        let history = conversationHistory.get(userId) || [];

        // Build context including RECENT Work Log (Memory) - Trimmed to 5 for maximum stability
        const recentWork = memory.workLog.slice(-5);
        const workLogContext = recentWork.length > 0 
            ? `\n\n[RECENT SERVER ACTIONS]\n${recentWork.map(log => `- ${log}`).join('\n')}\n`
            : "";

        const messages = [
            { role: "system", content: SYSTEM_PROMPT + workLogContext },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: query }
        ];

        // Using 8B for absolute stability against 500 errors
        const modelToUse = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";
        const data = await callNvidiaNIM(messages, false, 3, modelToUse);

        // Update In-Memory History (Store only text)
        history.push({ role: "user", content: query });
        history.push({ role: "assistant", content: data.response || "" });
        if (history.length > 10) history = history.slice(-10);
        conversationHistory.set(userId, history);

        // Update Persistent Memory (Work Log)
        if (data.actions && data.actions.length > 0) {
            data.actions.forEach(act => {
                const actionSummary = `${act.action}: ${JSON.stringify(act.parameters)}`;
                memory.workLog.push(`[${new Date().toLocaleString()}] ${userTag}: ${actionSummary}`);
            });
        }
        memory.globalHistory.push(`[${new Date().toLocaleString()}] ${userTag}: ${query}`);
        saveMemory(memory);

        return { 
            actions: data.actions || [], 
            response: data.response || "Strategic analysis complete." 
        };

    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        return { actions: [], response: `Critical Failure: NVIDIA NIM Engine unreachable. (${errorMsg})` };
    }
}

module.exports = { processAIQuery, moderateMessage };
