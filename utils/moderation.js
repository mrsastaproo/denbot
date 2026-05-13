const badWords = ['bc', 'mc', 'bsdk', 'randi', 'madarchod', 'behenchod', 'gandu']; // Add common abuse

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

    // 3. English Chat Enforcement (No-AI version: detect non-latin characters)
    const isEnglishChat = channelName.toLowerCase().includes('english');
    if (isEnglishChat) {
        // Simple check: if message contains non-ASCII characters (like Hindi/Urdu script)
        // Note: This won't catch "Hindi in English script" (Roman Urdu/Hindi)
        const nonLatinRegex = /[^\x00-\x7F]+/g;
        if (nonLatinRegex.test(content)) {
            results.actions.push({ action: 'delete_message' });
            results.response = "This is an English-only chat. Please use English characters.";
            return results;
        }
    }

    return results;
}

module.exports = { fastModerate };
