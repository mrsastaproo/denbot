const spamMap = new Map();
const logger = require('../utils/logger');
const { EmbedBuilder } = require('discord.js');

const OFFENSIVE_WORDS = [
    'sex', 'fuck', 'fucker', 'fucking', 'porn', 'hentai', 'dick', 'pussy', 'asshole', 'cum', 'slut', 'whore',
    'mc', 'bc', 'bsdk', 'chutiya', 'randi', 'gaand', 'loda', 'maderchod', 'behenchod', 'nigga', 'nigger',
    'nude', 'nudes', 'naked', 'kamina', 'harami', 'saala', 'kutte', 'kutta', 'betichod', 'gandu', 'bakchod',
    'muth', 'muthiya', 'lund', 'tatte', 'tatta', 'jhaat', 'teri', 'maa', 'ki', 'behen', 'chod', 'porn'
];
const PROMOTION_PHRASES = [
    'dm me', 'check dm', 'join now', 'free nitro', 'check this out', 'subscribe', 'follow me', 
    'dm for', 'direct message', 'pm me', 'contact me for', 'dm for help', 'dm for details', 'denmusic.in',
    'personally', 'private', 'share you', 'send you', 'check inbox', 'virus', 'exploit', 'token', 'directly', 'sendme'
];
const CAPS_THRESHOLD = 0.7; // 70% caps means violation
const langWarningMap = new Map();
const OWNER_ROLE_ID = '1501299141572300912';

const STRICT_ROLES = [
    '1501299161801297950', '1501299163827011705', '1501299165886414938', 
    '1501299168658849883', '1501299273088892948'
];

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const member = message.member || await message.guild.members.fetch(message.author.id);
        if (!member) return;

        const content = message.content.toLowerCase();
        const normalizedContent = content.replace(/\s+/g, ''); // Remove ALL whitespace for bypass detection

        // ---- OWNER SHORTCUT: den$close ----
        if (content === 'den$close' && (member.id === message.guild.ownerId || member.roles.cache.has(OWNER_ROLE_ID)) && (message.channel.name.startsWith('ticket-') || message.channel.name.startsWith('apply-') || message.channel.name.includes('deal-'))) {
            await message.delete().catch(() => {});
            
            const ticketData = client.tickets.get(message.channel.id);
            const owner = ticketData ? await client.users.fetch(ticketData.ownerId).catch(() => ({ tag: 'Unknown' })) : { tag: 'Unknown' };
            const claimer = ticketData?.claimedBy ? await client.users.fetch(ticketData.claimedBy).catch(() => ({ tag: 'None' })) : { tag: 'None' };

            const closeEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🔒 Instant Shutdown')
                .setDescription('This ticket has been instantly closed by the Server Owner. Deleting in **3 seconds**...')
                .setTimestamp();

            await message.channel.send({ embeds: [closeEmbed] });

            const logChannelId = client.config.ticketLogChannel || client.config.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const transcriptEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('📄 Support Ticket Transcript (Owner Shortcut)')
                        .addFields(
                            { name: '👤 Requester', value: `${owner.tag || 'N/A'} (${ticketData?.ownerId || 'N/A'})`, inline: false },
                            { name: '🙋‍♂️ Claimed By', value: `${claimer.tag || 'None'}`, inline: true },
                            { name: '🔒 Closed By', value: `Owner (${message.author.tag})`, inline: true },
                            { name: '📝 Reason', value: '`Instant Shutdown via Shortcut`', inline: false }
                        )
                        .setFooter({ text: 'DenClient Support System • Official Transcript' })
                        .setTimestamp();
                    await logChannel.send({ embeds: [transcriptEmbed] });
                }
            }

            setTimeout(() => message.channel.delete().catch(() => {}), 3000);
            return;
        }

        // ---- WHITELIST: Only Owner Role ----
        if (member.roles.cache.has(OWNER_ROLE_ID)) return;
        const isStrictMember = STRICT_ROLES.some(id => member.roles.cache.has(id));

        // ---- DETECTION PATTERNS (Normalized) ----
        const inviteRegex = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
        const linkRegex = /(([a-z0-9]+\.)+[a-z]{2,})|(\[dot\])|( \. )/i;
        const dmRegex = /dm|pm|directmessage/i; // No spaces needed in regex now due to normalization
        
        const hasOffensive = OFFENSIVE_WORDS.some(word => normalizedContent.includes(word));
        const hasPromotion = PROMOTION_PHRASES.some(phrase => normalizedContent.includes(phrase.replace(/\s+/g, '')));
        
        // Mass Caps Detection
        const uppercaseCount = message.content.replace(/[^A-Z]/g, '').length;
        const totalLetters = message.content.replace(/[^a-zA-Z]/g, '').length;
        const isMassCaps = totalLetters > 8 && (uppercaseCount / totalLetters) > CAPS_THRESHOLD;

        let violationType = null;
        if (hasOffensive) violationType = 'Offensive Language';
        else if (inviteRegex.test(normalizedContent)) violationType = 'Invite Link';
        else if (linkRegex.test(normalizedContent)) violationType = 'External Link/Bypass';
        else if (dmRegex.test(normalizedContent)) violationType = 'DM/PM Request (Bypass Detected)';
        else if (hasPromotion) violationType = 'Promotion/Malicious Content';
        else if (isMassCaps) violationType = 'Massive Caps (Spam)';

        const userId = message.author.id;

        // ---- LANGUAGE POLICY (STRICTLY #chat-english ONLY) ----
        // We only enforce English in the main international chat. 
        // Tickets and other channels are EXEMPT.
        const isEnglishOnlyChannel = message.channel.name.toLowerCase().includes('chat-english') && 
                                   !message.channel.name.includes('ticket-') && 
                                   !message.channel.name.includes('apply-');

        if (!violationType && isEnglishOnlyChannel) {
            const hindiKeywords = [
                'hai', 'kya', 'nhi', 'nahi', 'kuch', 'baat', 'sab', 'bhai', 'behen', 'bol', 'rhe', 'rha', 'thi', 'tha', 'kar', 'raha', 'rahe', 
                'aap', 'tum', 'tera', 'mera', 'iska', 'uska', 'krna', 'kaise', 'h', 'vla', 'mene', 'chal', 'be', 're', 'ga', 'gi', 'se', 'ko',
                'par', 'toh', 'hi', 'bhi', 'na', 'ne', 'mein', 'hum', 'he', 'hu', 'ho', 'ab', 'tak', 'jab', 'tab', 'ka', 'ki', 'ke'
            ];
            const words = content.split(/\s+/);
            const hasHindi = words.some(w => hindiKeywords.includes(w));
            
            if (hasHindi) {
                const warns = (langWarningMap.get(userId) || 0) + 1;
                langWarningMap.set(userId, warns);

                if (warns >= 3) {
                    await member.timeout(3600000, 'Language Policy Violation: 3 Warnings Reached (#chat-english)');
                    await message.channel.send({ content: `🚫 ${message.author}, you have been timed out for **1 hour** for repeated language policy violations (English Only).` });
                    langWarningMap.delete(userId);
                    await message.delete().catch(() => {});
                    return;
                } else {
                    await message.delete().catch(() => {});
                    const warnMsg = await message.channel.send({ content: `⚠️ ${message.author}, please speak **English only** in this channel. (Warning ${warns}/3)` });
                    setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                    return;
                }
            }
        }

        // Apply strict moderation for restricted roles OR if it's a link/promo
        if (violationType) {
            await message.delete().catch(() => {});
            
            try {
                if (!member.moderatable) {
                    const botMember = message.guild.members.me;
                    await logger.log(client, message.guild, {
                        isMod: true,
                        isStrict: true,
                        title: '🚨 Moderation Bypass (Power Issue)',
                        color: 'Orange',
                        fields: [
                            { name: '👤 Target', value: `${message.author.tag}`, inline: true },
                            { name: '🛡️ Moderatable', value: '❌ No', inline: true },
                            { name: '📊 Bot Position', value: `\`${botMember.roles.highest.position}\``, inline: true },
                            { name: '📊 User Position', value: `\`${member.roles.highest.position}\``, inline: true },
                            { name: '👑 Is Owner', value: `${message.guild.ownerId === member.id ? '✅ Yes' : '❌ No'}`, inline: true }
                        ],
                        footer: 'DenClient Security Diagnostic'
                    });
                    return;
                }

                // 10 Minute Timeout
                await member.timeout(600000, `Highly Strict Moderation x100: ${violationType}`);
                
                const warnEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setAuthor({ name: 'Security Protocol: Highly Strict x100', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`🚫 ${message.author}, you have been timed out for **10 minutes**.\n**Reason:** ${violationType}\n\n*Restricted roles are under x100 strict monitoring.*`)
                    .setTimestamp();

                await message.channel.send({ embeds: [warnEmbed] }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));

                await logger.log(client, message.guild, {
                    isMod: true,
                    isStrict: isStrictMember,
                    title: isStrictMember ? '🚨 Highly Strict x100 Violation' : '🛡️ Moderation Log: Strict Security Violation',
                    color: '#ED4245',
                    thumbnail: message.author.displayAvatarURL(),
                    fields: [
                        { name: '👤 User', value: `${message.author.tag} (${message.author.id})`, inline: false },
                        { name: '⚖️ Action', value: '`10 Minute Timeout`', inline: true },
                        { name: '⚠️ Violation', value: violationType, inline: true },
                        { name: '📝 Content', value: `\`\`\`${message.content}\`\`\``, inline: false },
                        { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    ],
                    footer: 'DenClient Security Protocol • Automated Enforcement'
                });
            } catch (error) {
                console.error('Timeout Error:', error);
                
                // DIAGNOSTIC LOG
                const botMember = message.guild.members.me;
                const hasModPerm = botMember.permissions.has('ModerateMembers');
                const hasAdmin = botMember.permissions.has('Administrator');
                
                await logger.log(client, message.guild, {
                    isMod: true,
                    isStrict: true,
                    title: '🚨 Timeout Diagnostic Report',
                    color: '#FF0000',
                    fields: [
                        { name: '❌ Error', value: `\`${error.message}\``, inline: false },
                        { name: '👤 Target', value: `${message.author.tag}`, inline: true },
                        { name: '🛡️ Moderatable', value: `${member.moderatable ? '✅ Yes' : '❌ No'}`, inline: true },
                        { name: '🔑 Mod Permission', value: `${hasModPerm ? '✅ Yes' : '❌ No'}`, inline: true },
                        { name: '👑 Admin Perm', value: `${hasAdmin ? '✅ Yes' : '❌ No'}`, inline: true },
                        { name: '📊 Bot Role Position', value: `\`${botMember.roles.highest.position}\``, inline: true },
                        { name: '📊 User Role Position', value: `\`${member.roles.highest.position}\``, inline: true }
                    ],
                    footer: 'DenClient Diagnostic Utility'
                });
            }
            return;
        }

        // ---- ANTI SPAM SYSTEM ----
        const now = Date.now();
        const windowMs = 5000;
        const maxMessages = 5;

        if (!spamMap.has(userId)) {
            spamMap.set(userId, []);
        }

        const timestamps = spamMap.get(userId);
        const recentMessages = timestamps.filter(t => now - t < windowMs);
        recentMessages.push(now);
        spamMap.set(userId, recentMessages);

        if (recentMessages.length >= maxMessages) {
            try {
                await member.timeout(600000, 'Anti-Spam Protocol (Highly Strict)');
                
                const spamEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setAuthor({ name: 'Security Protocol: Anti-Spam', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`⚠️ ${message.author} has been timed out for **10 minutes** due to excessive spamming.`)
                    .setTimestamp();

                await message.channel.send({ embeds: [spamEmbed] });
                
                await logger.log(client, message.guild, {
                    isMod: true,
                    isStrict: isStrictMember,
                    title: '🛡️ Moderation Log: Spam Violation',
                    color: '#ED4245',
                    thumbnail: message.author.displayAvatarURL(),
                    fields: [
                        { name: '👤 User', value: `${message.author.tag}`, inline: true },
                        { name: '⚖️ Action', value: '`10 Minute Timeout`', inline: true },
                        { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    ],
                    footer: 'DenClient Security Protocol • Automated Enforcement'
                });

                spamMap.delete(userId);
            } catch (error) {
                console.error('Spam Timeout Error:', error);
            }
        }
    }
};