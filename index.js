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
    staffAppCategory: process.env.STAFF_APP_CATEGORY_ID
};

// Handlers load karo
const handlersPath = path.join(__dirname, 'handlers');
const handlerFiles = fs.readdirSync(handlersPath).filter(f => f.endsWith('.js'));
for (const file of handlerFiles) {
    require(`./handlers/${file}`)(client);
}

client.login(process.env.TOKEN);