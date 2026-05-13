const badWords = ['bc', 'mc', 'bsdk', 'randi', 'madarchod', 'behenchod', 'gandu', 'suar', 'tatti', 'pille', 'ullu', 'bevda', 'bewda'];
const hinglishWords = [
    'kaise', 'bhai', 'hai', 'kya', 'hal', 'aap', 'tum', 'mujh', 'tujh', 'apne', 'raha', 'rahe', 'tha', 'thi', 'kar', 'karo', 'karne', 'aur', 'nhi', 'nahi', 'toh', 'kyu', 'kyoon', 'hum', 'hume', 'mera', 'meri', 'mere', 'karna', 'karliya', 'gya', 'gyi', 'gye', 'hi', 'bhi', 'se', 'ko', 'ki', 'ka', 'mein', 'kaha', 'tha', 'rha', 'rhi', 'rhe', 'unke', 'inko', 'unko', 'kisko', 'iska', 'uska', 'kiska', 'aisa', 'waisa', 'kaisa', 'hi', 'toh', 'na', 'ne', 'par', 'hi', 'tha', 'hue', 'huye', 'huey', 'le', 'lo', 'do', 'de', 'liye', 'laye', 'lao', 'jaa', 'jao', 'jaate', 'raha', 'rahunga', 'jaunga', 'karunga', 'kuch', 'sab', 'sabko', 'koi', 'kisi', 'kyon', 'kyu', 'kyoon', 'hamara', 'hamari', 'hamare', 'tumhara', 'tumhari', 'tumhare', 'apna', 'apni', 'apne', 'kab', 'jab', 'tab', 'abhi', 'tabhi', 'kabhi', 'waha', 'yaha', 'jaha', 'idhar', 'udhar', 'kidhar', 'kon', 'kaun', 'jisne', 'kisne', 'usne', 'isne', 'unne', 'jinne', 'mein', 'humne', 'tumne', 'aapne', 'me', 'hu', 'ho', 'hoon'
];
const dmPhrases = ['dm me', 'dm us', 'direct message', 'pm me', 'pm us', 'message me', 'contact me', 'inbox me'];

function fastModerate(content, channelName = "") {
    const results = {
        actions: [],
        response: null
    };

    const cleanContent = content.toLowerCase();
    // Normalize content (remove spaces) but KEEP dots to catch "d e n m u s i c . i n" -> "denmusic.in"
    const spaceStripped = cleanContent.replace(/\s+/g, '');
    const fullyNormalized = cleanContent.replace(/[\s\.\-\_\*\~]+/g, '');

    // 1. Link Detection (Comprehensive + Normalized)
    const linkRegex = /([a-z0-9]+\.[a-z]{2,})/gi;
    const obfuscatedLinkRegex = /([a-z0-9]+)\.(com|net|org|in|xyz|gg|info|me|biz|ru|uk|ca|de|jp|fr|au|us|tk)/gi;
    
    if (linkRegex.test(cleanContent) || linkRegex.test(spaceStripped) || obfuscatedLinkRegex.test(spaceStripped)) {
        results.actions.push({ action: 'delete_message' });
        results.actions.push({ action: 'timeout', parameters: { duration: 10, reason: 'Link/Obfuscated Link Sharing' } });
        results.response = "Link sharing (even obfuscated) is strictly prohibited.";
        return results;
    }

    // 2. DM Solicitation Detection
    for (const phrase of dmPhrases) {
        if (cleanContent.includes(phrase) || spaceStripped.includes(phrase.replace(/\s+/g, ''))) {
            results.actions.push({ action: 'delete_message' });
            results.response = "DM solicitation is prohibited. Keep discussions in the chat.";
            return results;
        }
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
