const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
    ]
});

client.instanceId = Math.random().toString(36).substring(7).toUpperCase();
console.log(`[SYSTEM] Starting Instance: ${client.instanceId}`);


client.commands = new Collection();
client.cooldowns = new Collection();
client.warnings = new Map(); // Global warnings storage
client.tickets = new Map(); // Track ticket metadata (claims, etc.)

// Configuration exposure
client.config = {
    logChannel: process.env.LOG_CHANNEL_ID,
    ticketLogChannel: process.env.TICKET_LOG_CHANNEL_ID,
    modLogChannel: process.env.MOD_LOG_CHANNEL_ID,
    strictLogChannel: process.env.STRICT_LOG_CHANNEL_ID,
    autoRoleId: process.env.AUTO_ROLE_ID,
    ticketCategory: process.env.TICKET_CATEGORY_ID,
    staffRole: process.env.STAFF_ROLE_ID,
    welcomeChannel: process.env.WELCOME_CHANNEL_ID,
    staffAppCategory: process.env.STAFF_APP_CATEGORY_ID,
    ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : []
};

// Handlers load karo
const handlersPath = path.join(__dirname, 'handlers');
const handlerFiles = fs.readdirSync(handlersPath).filter(f => f.endsWith('.js'));
for (const file of handlerFiles) {
    require(`./handlers/${file}`)(client);
}

// Global Error Handling to prevent silent crashes
process.on('unhandledRejection', error => {
    console.error(' [CRITICAL ERROR] Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', error => {
    console.error(' [CRITICAL ERROR] Uncaught Exception:', error);
});

client.on('error', error => {
    console.error(' [SYSTEM ERROR] Discord Client Error:', error);
});

client.login(process.env.TOKEN).then(() => {
    console.log(`[SYSTEM] Authenticated successfully with Discord.`);
}).catch(err => {
    console.error(`[FATAL ERROR] Failed to login to Discord: ${err.message}`);
    if (err.message.includes('intent')) {
        console.error(' [REMEDY] Please enable "MESSAGE CONTENT INTENT" in Discord Developer Portal.');
    }
});