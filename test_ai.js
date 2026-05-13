const { processAIQuery } = require('./utils/ai');
require('dotenv').config();

async function test() {
    console.log("Testing NVIDIA NIM (Llama 3.3 70B)...");
    try {
        const result = await processAIQuery("Hello! Who are you and what is your purpose?", "AdminTest");
        console.log("✅ NVIDIA NIM Response:");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("❌ NVIDIA NIM Failed:", e.message);
    }
}

test();
