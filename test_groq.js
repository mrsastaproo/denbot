const axios = require('axios');
require('dotenv').config();

async function test() {
    console.log("Testing Groq API Key...");
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "hi" }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        console.log("✅ Groq works! Response:", response.data.choices[0].message.content);
    } catch (error) {
        console.error("❌ Groq failed:", error.response ? error.response.data : error.message);
    }
}

test();
