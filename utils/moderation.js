const badWords = ['bc', 'mc', 'bsdk', 'randi', 'madarchod', 'behenchod', 'gandu']; // Add common abuse
const hinglishWords = ['kaise', 'bhai', 'hai', 'kya', 'kya hal', 'aap', 'tum', 'mujh', 'tujh', 'apne', 'raha', 'rahe', 'tha', 'thi', 'kar', 'karo', 'karne', 'aur', 'nhi', 'nahi', 'toh', 'kyu', 'kyoon', 'hum', 'hume', 'mera', 'meri', 'mere'];

function fastModerate(content, channelName = "") {
    const results = {
        actions: [],
        response: null
    };

    const cleanContent = content.toLowerCase();

    // 1. Link Detection (Comprehensive)
    const linkRegex = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+|[a-z0-9]+\.[a-z]{2,})/gi;
    if (linkRegex.test(cleanContent)) {
        results.actions.push({ action: 'delete_message' });
        results.actions.push({ action: 'timeout', parameters: { duration: 10, reason: 'Link Sharing' } });
        results.response = "External links are strictly prohibited.";
        return results;
    }

    // 2. Bad Words Detection
    for (const word of badWords) {
        if (cleanContent.includes(word)) {
            results.actions.push({ action: 'delete_message' });
            results.actions.push({ action: 'timeout', parameters: { duration: 5, reason: 'Abusive Language' } });
            results.response = "Abusive language is not tolerated here.";
            return results;
        }
    }

    // 3. English Chat Enforcement (No-AI version)
    const isEnglishChat = channelName.toLowerCase().includes('english');
    if (isEnglishChat) {
        // Detect non-latin characters (Hindi/Urdu script)
        const nonLatinRegex = /[^\x00-\x7F]+/g;
        if (nonLatinRegex.test(content)) {
            results.actions.push({ action: 'delete_message' });
            results.response = "This is an English-only chat. Please use English characters.";
            return results;
        }

        // Detect common Hinglish keywords (Roman Hindi)
        const words = cleanContent.split(/\s+/);
        for (const word of words) {
            if (hinglishWords.includes(word)) {
                results.actions.push({ action: 'delete_message' });
                results.response = "English only, please. Non-English detected.";
                return results;
            }
        }
    }

    return results;
}

module.exports = { fastModerate };
