const badWords = ['bc', 'mc', 'bsdk', 'randi', 'madarchod', 'behenchod', 'gandu', 'suar', 'tatti', 'pille', 'ullu', 'bevda', 'bewda', 'lodu', 'lodhu', 'chutiya', 'bakchod'];

// Cleaned Hinglish list: Removed common English words that cause false positives
const hinglishWords = [
    'kaise', 'bhai', 'hai', 'kya', 'hal', 'aap', 'tum', 'mujh', 'tujh', 'apne', 'raha', 'rahe', 'tha', 'thi', 'kar', 'karo', 'karne', 'aur', 'nhi', 'nahi', 'toh', 'kyu', 'kyoon', 'hum', 'hume', 'mera', 'meri', 'mere', 'karna', 'karliya', 'gya', 'gyi', 'gye', 'bhi', 'se', 'ko', 'ki', 'ka', 'mein', 'kaha', 'tha', 'rha', 'rhi', 'rhe', 'unke', 'inko', 'unko', 'kisko', 'iska', 'uska', 'kiska', 'aisa', 'waisa', 'kaisa', 'toh', 'na', 'ne', 'par', 'tha', 'hue', 'huye', 'huey', 'le', 'lo', 'de', 'liye', 'laye', 'lao', 'jaa', 'jao', 'jaate', 'rahunga', 'jaunga', 'karunga', 'kuch', 'sab', 'sabko', 'koi', 'kisi', 'kyon', 'kyu', 'kyoon', 'hamara', 'hamari', 'hamare', 'tumhara', 'tumhari', 'tumhare', 'apna', 'apni', 'apne', 'kab', 'jab', 'tab', 'abhi', 'tabhi', 'kabhi', 'waha', 'yaha', 'jaha', 'idhar', 'udhar', 'kidhar', 'kon', 'kaun', 'jisne', 'kisne', 'usne', 'isne', 'unne', 'jinne', 'mein', 'humne', 'tumne', 'aapne', 'hu', 'ho', 'hoon', 'kese', 'kesa', 'kesi', 'acha', 'achi', 'accha', 'acchi', 'bahut', 'bohot', 'bhot', 'mast', 'yaar', 'yar', 'arey', 'are', 'bata', 'batao', 'bolo', 'suno', 'dekh', 'dekho', 'kaha', 'yahan', 'wahan', 'kahan', 'hain', 'nahi', 'nhe', 'ni', 'nai', 'mai', 'tu', 'tera', 'teri', 'tere', 'mat', 'aaj', 'kal', 'parso', 'karna', 'karo', 'karta', 'karti', 'karte', 'jana', 'jao', 'jata', 'jati', 'jate', 'aana', 'aao', 'aata', 'aati', 'aate', 'khana', 'khao', 'peena', 'piyo', 'sona', 'soo', 'rona', 'roo', 'hasna', 'haso', 'khelna', 'khelo', 'padhna', 'padho', 'likhna', 'likho', 'dekhna', 'dekho', 'sunna', 'suno', 'bolna', 'bolo', 'samajh', 'samjho', 'soch', 'socho', 'pata', 'maalum', 'malum', 'kuch', 'koi', 'sab', 'har', 'bada', 'badi', 'bade', 'chota', 'choti', 'chote', 'lamba', 'lambi', 'lambe', 'mota', 'moti', 'mote', 'patla', 'patli', 'patle', 'acha', 'achi', 'ache', 'bura', 'buri', 'bure', 'sahi', 'galat', 'sach', 'jhooth', 'naya', 'nayi', 'naye', 'purana', 'purani', 'purane', 'saaf', 'ganda', 'garam', 'thanda', 'meetha', 'khatta', 'kadwa', 'tez', 'dheere', 'jaldi', 'der', 'abhi', 'baad', 'pehle', 'upar', 'neeche', 'aage', 'peeche', 'andar', 'bahar', 'paas', 'door', 'yahan', 'wahan', 'kahan', 'jahan', 'chal', 'chalo', 'puch', 'pucho', 'khush', 'dukh', 'rona', 'hansna', 'daudna', 'bhagna', 'baithna', 'khade', 'letna', 'uthna', 'girna', 'pakadna', 'chodna', 'todna', 'jodna', 'bechna', 'khareedna', 'dena', 'lena', 'deni', 'leni', 'mili', 'mila', 'mile', 'dikha', 'dikhao', 'sikha', 'sikhao', 'samjha', 'samjhao'
];

const dmPhrases = [
    'dm me', 'dm us', 'direct message', 'pm me', 'pm us', 'message me', 'contact me', 'inbox me', 
    'msg me', 'dm karo', 'dm kr', 'dm aao', 'private me aao', 'ib me aao', 'inbox aao', 
    'dm crow', 'dm krow', 'message karo', 'text me', 'text us', 'msg us', 'dm on', 
    'send dm', 'drop dm', 'd m me', 'p m me', 'd.m. me', 'private message me', 
    'message in private', 'talk in dm', 'come to dm', 'slide into dm', 'personal message',
    'msg karo', 'baat karo dm', 'private message', 'dm pls', 'dm please'
];

function fastModerate(content, channelName = "") {
    const results = {
        actions: [],
        response: null
    };

    const cleanContent = content.toLowerCase();
    
    // Improved Normalization: Only strip spaces to check for obfuscated links/words
    const spaceStripped = cleanContent.replace(/\s+/g, '');

    // 1. Link Detection (Refined)
    const tlds = ['com', 'net', 'org', 'in', 'xyz', 'gg', 'me', 'biz', 'info', 'io', 'tk', 'ml', 'ga', 'cf', 'gq', 'co', 'be', 'link', 'app', 'dev'];
    
    // Protocol Check (High confidence)
    const protocolRegex = /https?:\/\/[^\s]+/gi;
    if (protocolRegex.test(cleanContent)) {
        results.actions.push({ action: 'delete_message' });
        results.actions.push({ action: 'timeout', parameters: { duration: 15, reason: 'Unauthorized Link Sharing' } });
        results.response = "Link sharing is strictly prohibited.";
        return results;
    }

    // Obfuscated Link Check (e.g., google . com)
    // We check spaceStripped content, but we look for a dot followed by a TLD
    // We avoid matching dots at the end of sentences or ellipsis
    const obfuscatedLinkRegex = new RegExp(`[a-z0-9-]+\\.(?!\\.)(${tlds.join('|')})($|[^a-z0-9])`, 'i');
    if (obfuscatedLinkRegex.test(spaceStripped)) {
        // Special case: don't block common phrases like "wait.me" if they look like typos, 
        // but here we are strict as per DenClient requirements.
        // However, let's check if there's at least one letter before the dot to avoid "...me"
        results.actions.push({ action: 'delete_message' });
        results.actions.push({ action: 'timeout', parameters: { duration: 15, reason: 'Obfuscated Link Sharing' } });
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

    // 3. Bad Words Detection (Whole word matching to avoid "glass" matching "ass")
    const wordsForBadCheck = cleanContent.split(/[\s,./!?;:]+/);
    for (const word of badWords) {
        if (wordsForBadCheck.includes(word)) {
            results.actions.push({ action: 'delete_message' });
            results.actions.push({ action: 'timeout', parameters: { duration: 5, reason: 'Abusive Language' } });
            results.response = "Abusive language is not tolerated here.";
            return results;
        }
    }

    // 4. English Chat Enforcement
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
        const words = cleanContent.replace(/[.,!?()[\]{}"':;]/g, '').split(/\s+/);
        let hinglishCount = 0;
        for (const word of words) {
            if (hinglishWords.includes(word)) {
                hinglishCount++;
            }
        }
        
        // BRAIN: Threshold logic. Only block if 2+ Hinglish words found.
        // This avoids blocking "hi" mistaken for "hai" or "ka" used in some contexts.
        if (hinglishCount >= 2) {
            results.actions.push({ action: 'delete_message' });
            results.response = "English only, please. Non-English conversation detected.";
            return results;
        }
    }

    return results;
}

module.exports = { fastModerate };
