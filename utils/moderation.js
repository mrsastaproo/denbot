const badWords = ['bc', 'mc', 'bsdk', 'randi', 'madarchod', 'behenchod', 'gandu', 'suar', 'tatti', 'pille', 'ullu', 'bevda', 'bewda', 'lodu', 'lodhu', 'chutiya', 'bakchod'];
const hinglishWords = [
    'kaise', 'bhai', 'hai', 'kya', 'hal', 'aap', 'tum', 'mujh', 'tujh', 'apne', 'raha', 'rahe', 'tha', 'thi', 'kar', 'karo', 'karne', 'aur', 'nhi', 'nahi', 'toh', 'kyu', 'kyoon', 'hum', 'hume', 'mera', 'meri', 'mere', 'karna', 'karliya', 'gya', 'gyi', 'gye', 'hi', 'bhi', 'se', 'ko', 'ki', 'ka', 'mein', 'kaha', 'tha', 'rha', 'rhi', 'rhe', 'unke', 'inko', 'unko', 'kisko', 'iska', 'uska', 'kiska', 'aisa', 'waisa', 'kaisa', 'hi', 'toh', 'na', 'ne', 'par', 'hi', 'tha', 'hue', 'huye', 'huey', 'le', 'lo', 'do', 'de', 'liye', 'laye', 'lao', 'jaa', 'jao', 'jaate', 'raha', 'rahunga', 'jaunga', 'karunga', 'kuch', 'sab', 'sabko', 'koi', 'kisi', 'kyon', 'kyu', 'kyoon', 'hamara', 'hamari', 'hamare', 'tumhara', 'tumhari', 'tumhare', 'apna', 'apni', 'apne', 'kab', 'jab', 'tab', 'abhi', 'tabhi', 'kabhi', 'waha', 'yaha', 'jaha', 'idhar', 'udhar', 'kidhar', 'kon', 'kaun', 'jisne', 'kisne', 'usne', 'isne', 'unne', 'jinne', 'mein', 'humne', 'tumne', 'aapne', 'me', 'hu', 'ho', 'hoon', 'kese', 'kesa', 'kesi', 'acha', 'achi', 'accha', 'acchi', 'bahut', 'bohot', 'bhot', 'mast', 'yaar', 'yar', 'arey', 'are', 'ab', 'bata', 'batao', 'bol', 'bolo', 'sun', 'suno', 'dekh', 'dekho', 'kaha', 'yahan', 'wahan', 'kahan', 'hain', 'nahi', 'nhe', 'ni', 'nai', 'mai', 'main', 'tu', 'tera', 'teri', 'tere', 'mat', 'aaj', 'kal', 'parso', 'karna', 'karo', 'karta', 'karti', 'karte', 'jana', 'jao', 'jata', 'jati', 'jate', 'aana', 'aao', 'aata', 'aati', 'aate', 'khana', 'khao', 'peena', 'piyo', 'sona', 'soo', 'rona', 'roo', 'hasna', 'haso', 'khelna', 'khelo', 'padhna', 'padho', 'likhna', 'likho', 'dekhna', 'dekho', 'sunna', 'suno', 'bolna', 'bolo', 'samajh', 'samjho', 'soch', 'socho', 'pata', 'maalum', 'malum', 'kuch', 'koi', 'sab', 'har', 'ek', 'do', 'teen', 'chaar', 'paanch', 'chhe', 'saat', 'aath', 'nau', 'dus', 'bada', 'badi', 'bade', 'chota', 'choti', 'chote', 'lamba', 'lambi', 'lambe', 'mota', 'moti', 'mote', 'patla', 'patli', 'patle', 'acha', 'achi', 'ache', 'bura', 'buri', 'bure', 'sahi', 'galat', 'sach', 'jhooth', 'naya', 'nayi', 'naye', 'purana', 'purani', 'purane', 'saaf', 'ganda', 'garam', 'thanda', 'meetha', 'khatta', 'kadwa', 'tez', 'dheere', 'jaldi', 'der', 'abhi', 'baad', 'pehle', 'upar', 'neeche', 'aage', 'peeche', 'andar', 'bahar', 'paas', 'door', 'yahan', 'wahan', 'kahan', 'jahan', 'chal', 'chalo', 'puch', 'pucho', 'khush', 'dukh', 'rona', 'hansna', 'daudna', 'bhagna', 'baithna', 'khade', 'letna', 'uthna', 'girna', 'pakadna', 'chodna', 'todna', 'jodna', 'bechna', 'khareedna', 'dena', 'lena', 'deni', 'leni', 'mili', 'mila', 'mile', 'dikha', 'dikhao', 'sikha', 'sikhao', 'samjha', 'samjhao'
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
    // NUCLEAR NORMALIZATION: Remove ALL symbols and spaces, keeping ONLY letters, numbers, and the dot
    const nuclearContent = cleanContent.replace(/[^a-z0-9.]/g, '');
    const dotStripped = nuclearContent.replace(/\./g, '');
    const spaceStripped = cleanContent.replace(/\s+/g, '');

    // 1. Link Detection (Nuclear Path)
    // Catch any text followed by a dot and a common TLD
    const tlds = ['com', 'net', 'org', 'in', 'xyz', 'gg', 'me', 'biz', 'info', 'io', 'tk', 'ml', 'ga', 'cf', 'gq', 'co'];
    const nuclearLinkRegex = new RegExp(`\\.(${tlds.join('|')})$`, 'i');
    const dotPatternRegex = /([a-z0-9]+)\.([a-z0-9]+)/gi;

    if (dotPatternRegex.test(nuclearContent) || dotPatternRegex.test(cleanContent.replace(/\s+/g, ''))) {
        results.actions.push({ action: 'delete_message' });
        results.actions.push({ action: 'timeout', parameters: { duration: 15, reason: 'Link/Obfuscated Link Sharing (Nuclear Match)' } });
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
        // Use boundaries for bad words to avoid matching inside other words, if needed. For now simple include.
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
        // Strip punctuation first so words like "kaise?" match "kaise"
        const words = cleanContent.replace(/[.,!?()[\]{}"':;]/g, '').split(/\s+/);
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
