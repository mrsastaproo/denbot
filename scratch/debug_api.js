const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('GEMINI_API_KEY is not set');
        return;
    }

    const versions = ['v1', 'v1beta'];
    
    for (const v of versions) {
        try {
            console.log(`Checking API version ${v}...`);
            const response = await axios.get(`https://generativelanguage.googleapis.com/${v}/models?key=${key}`);
            console.log(`✅ Success for ${v}!`);
            const models = response.data.models.map(m => m.name);
            console.log('Available models:', models);
        } catch (error) {
            console.log(`❌ Failed for ${v}: ${error.response ? error.response.status : error.message}`);
            if (error.response && error.response.data) {
                console.log('Error data:', JSON.stringify(error.response.data));
            }
        }
    }
}

listModels();
