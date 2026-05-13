const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const m = "gemini-2.5-flash";
    try {
        console.log(`Testing ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("hi, say hello back briefly");
        console.log(`✅ ${m} works! Response: ${result.response.text()}`);
    } catch (e) {
        console.log(`❌ ${m} failed: ${e.message}`);
    }
}

test();
