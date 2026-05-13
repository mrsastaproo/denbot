const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '../data/server_memory.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'));
}

function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading memory:', e);
    }
    return {
        workLog: [], // Stores last X actions
        globalHistory: [] // Stores last X messages
    };
}

function saveMemory(memory) {
    try {
        // Keep logs lean
        if (memory.workLog.length > 50) memory.workLog = memory.workLog.slice(-50);
        if (memory.globalHistory.length > 20) memory.globalHistory = memory.globalHistory.slice(-20);
        
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
    } catch (e) {
        console.error('Error saving memory:', e);
    }
}

module.exports = { loadMemory, saveMemory };
