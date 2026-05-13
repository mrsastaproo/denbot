const spamMap = new Map();
const logger = require('../utils/logger');
const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { processAIQuery } = require('../utils/ai');

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

const processedMessages = new Set();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        // Deduplication: Stop double-replies from the same process
        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000); // Clear after 1 min

        const member = message.member || await message.guild.members.fetch(message.author.id);
        if (!member) return;

        const content = message.content;
        const lowerContent = content.toLowerCase();
        const normalizedContent = lowerContent.replace(/\s+/g, '');

        // ---- SHORTCUT: den$accept @user @role ----
        if (lowerContent.startsWith('den$accept')) {
            const isOwner = member.id === message.guild.ownerId || member.roles.cache.has(OWNER_ROLE_ID);
            if (!isOwner) return;

            const args = content.split(' ');
            const targetUser = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
            const targetRole = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase().includes(args.slice(2).join(' ').toLowerCase()));

            if (!targetUser || !targetRole) {
                return message.reply('❌ **Usage:** `den$accept @user @role`').catch(() => {});
            }

            const acceptEmbed = new EmbedBuilder()
                .setColor('#EAB308')
                .setTitle('\uD83C\uDF89 Welcome to the Staff Team! \uD83C\uDF89')
                .setThumbnail(targetUser.displayAvatarURL())
                .setDescription(`Congratulations **${targetUser.username}**, you have been accepted as a staff member! \uD83D\uDE4C\n\n**Your Role:** ${targetRole}\n\n**Responsibilities:**\n\u2714\ufe0f Be respectful and professional \uD83D\ufe4C\n\u2714\ufe0f Follow all server rules \uD83D\uDCDA\n\u2714\ufe0f Maintain confidentiality \uD83D\uDD12\n\n**Next Steps:**\nYou will receive a DM shortly with full onboarding details. Welcome aboard! \uD83D\ude80`)
                .setFooter({ text: 'DenClient Elite Staff System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            await message.channel.send({ content: `${targetUser}`, embeds: [acceptEmbed] });
            await message.delete().catch(() => {});
            return;
        }

        // ---- OWNER SHORTCUT: den$close ----
        if (lowerContent === 'den$close' && (member.id === message.guild.ownerId || member.roles.cache.has(OWNER_ROLE_ID)) && (message.channel.name.startsWith('ticket-') || message.channel.name.startsWith('apply-') || message.channel.name.includes('deal-'))) {
            await message.delete().catch(() => {});
            
            const ticketData = client.tickets.get(message.channel.id);
            const owner = ticketData ? await client.users.fetch(ticketData.ownerId).catch(() => ({ tag: 'Unknown' })) : { tag: 'Unknown' };
            const claimer = ticketData?.claimedBy ? await client.users.fetch(ticketData.claimedBy).catch(() => ({ tag: 'None' })) : { tag: 'None' };

            const closeEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('\uD83D\uDD12 Instant Shutdown')
                .setDescription('This ticket has been instantly closed by the Server Owner. Deleting in **3 seconds**...')
                .setTimestamp();

            await message.channel.send({ embeds: [closeEmbed] });

            const logChannelId = client.config.ticketLogChannel || client.config.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const transcriptEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('\uD83D\uDCC4 Support Ticket Transcript (Owner Shortcut)')
                        .addFields(
                            { name: '\uD83D\uDC64 Requester', value: `${owner.tag || 'N/A'} (${ticketData?.ownerId || 'N/A'})`, inline: false },
                            { name: '\uD83D\uDE4B\u200D\u2642\ufe0f Claimed By', value: `${claimer.tag || 'None'}`, inline: true },
                            { name: '\uD83D\uDD12 Closed By', value: `Owner (${message.author.tag})`, inline: true },
                            { name: '\uD83D\uDCDD Reason', value: '`Instant Shutdown via Shortcut`', inline: false }
                        )
                        .setFooter({ text: 'DenClient Support System \u2022 Official Transcript' })
                        .setTimestamp();
                    await logChannel.send({ embeds: [transcriptEmbed] });
                }
            }

            setTimeout(() => message.channel.delete().catch(() => {}), 3000);
            return;
        }

        // ---- REAL AI SMART CONSOLE (Gemini): den-ai: or . ----
        const isAIPrefix = lowerContent.startsWith('den-ai:') || lowerContent.startsWith('.');
        if (isAIPrefix) {
            const isOwner = member.id === message.guild.ownerId || (OWNER_ROLE_ID && member.roles.cache.has(OWNER_ROLE_ID));
            if (!isOwner) return;

            const query = lowerContent.replace('den-ai:', '').replace(/^\./, '').trim();
            if (!query) return;

            try {
                console.log(`[AI-DEBUG] Processing query from ${message.author.tag}: ${query}`);
                await message.channel.sendTyping();
                
                const result = await processAIQuery(query, message.author.tag);
                if (!result) throw new Error('AI returned null result');

                const actions = result.actions || (result.action ? [result] : []);
                let lastCreatedChannel = null;
                const results = [];

                const findChannel = (input) => {
                    if (!input) return null;
                    const strInput = String(input).toLowerCase();
                    if (strInput === 'current' || strInput === 'here') return message.channel;
                    
                    const exact = message.guild.channels.cache.get(input) || 
                                  message.guild.channels.cache.find(c => c.name.toLowerCase() === strInput);
                    if (exact) return exact;

                    const cleanInput = strInput.replace(/[^\w\s]/g, '').trim();
                    if (!cleanInput) return null;

                    return message.guild.channels.cache.find(c => c.name.toLowerCase().replace(/[^\w\s]/g, '') === cleanInput) ||
                           message.guild.channels.cache.find(c => c.name.toLowerCase().includes(cleanInput));
                };

                for (const act of actions) {
                    if (!act || !act.action) continue;
                    try {
                        if (act.action === 'send_message') {
                            const target = findChannel(act.parameters?.channel) || lastCreatedChannel || message.channel;
                            await target.send(act.parameters.content).catch(() => {});
                            results.push(`Sent message to ${target.name}`);
                        } else if (act.action === 'send_premium_message') {
                            const target = findChannel(act.parameters?.channel) || lastCreatedChannel || message.channel;
                            const embed = new EmbedBuilder()
                                .setColor(act.parameters.color || '#EAB308')
                                .setTitle(act.parameters.title || 'DenClient Notification')
                                .setDescription(act.parameters.content || act.parameters.description || '...')
                                .setTimestamp();

                            if (act.parameters?.thumbnail) embed.setThumbnail(act.parameters.thumbnail);
                            if (act.parameters?.image) embed.setImage(act.parameters.image);
                            if (act.parameters?.footer) embed.setFooter({ text: act.parameters.footer, iconURL: client.user.displayAvatarURL() });
                            else embed.setFooter({ text: 'DenClient Elite System', iconURL: client.user.displayAvatarURL() });
                            
                            if (act.parameters?.author) embed.setAuthor({ name: act.parameters.author, iconURL: client.user.displayAvatarURL() });
                            
                            if (Array.isArray(act.parameters?.fields)) {
                                act.parameters.fields.forEach(f => {
                                    if (f.name && f.value) embed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
                                });
                            }

                            await target.send({ embeds: [embed] }).catch(() => {});
                            results.push(`Sent premium embed to ${target.name}`);
                        } else if (act.action === 'create_private_channel') {
                            const categoryInput = act.parameters?.category;
                            let category = null;
                            if (categoryInput) {
                                category = message.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes(String(categoryInput).toLowerCase()) || c.id === categoryInput));
                            }
                            lastCreatedChannel = await message.guild.channels.create({
                                name: act.parameters?.name || 'den-console',
                                type: ChannelType.GuildText,
                                parent: category ? category.id : null,
                                topic: act.parameters?.topic || 'Elite Control Center',
                                permissionOverwrites: [
                                    { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                                    { id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                                ]
                            });
                            results.push(`Created channel ${lastCreatedChannel}`);
                        } else if (act.action === 'rename_channel') {
                            const target = findChannel(act.parameters?.channel) || message.channel;
                            if (target) {
                                const oldName = target.name;
                                await target.setName(act.parameters.name).catch(() => {});
                                results.push(`Renamed \`${oldName}\` to \`${act.parameters.name}\``);
                            }
                        } else if (act.action === 'delete_channel') {
                            const target = findChannel(act.parameters?.id);
                            if (target && target.id !== message.channel.id) {
                                results.push(`Deleted \`${target.name}\``);
                                await target.delete().catch(() => {});
                            }
                        } else if (act.action === 'lock_channel' || act.action === 'unlock_channel') {
                            const isLock = act.action === 'lock_channel';
                            const target = findChannel(act.parameters?.id) || message.channel;
                            await target.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: !isLock }).catch(() => {});
                            results.push(`${isLock ? 'Locked' : 'Unlocked'} ${target.name}`);
                        } else if (act.action === 'purge_messages') {
                            const count = Math.min(parseInt(act.parameters?.count) || 10, 100);
                            await message.channel.bulkDelete(count, true).catch(() => {});
                            results.push(`Purged ${count} messages`);
                        } else if (act.action === 'kick_user' || act.action === 'ban_user') {
                            const isBan = act.action === 'ban_user';
                            const targetInput = String(act.parameters?.user || '');
                            const targetMember = message.guild.members.cache.find(m => m.user.tag.includes(targetInput) || m.id === targetInput || m.user.username.includes(targetInput));
                            if (targetMember && targetMember.moderatable) {
                                if (isBan) await targetMember.ban({ reason: act.parameters?.reason }).catch(() => {});
                                else await targetMember.kick(act.parameters?.reason).catch(() => {});
                                results.push(`${isBan ? 'Banned' : 'Kicked'} ${targetMember.user.tag}`);
                            }
                        } else if (act.action === 'add_role' || act.action === 'remove_role') {
                            const isAdd = act.action === 'add_role';
                            const targetInput = String(act.parameters?.user || '');
                            const roleInput = String(act.parameters?.role || '');
                            
                            const cleanTarget = targetInput.replace(/[<@!&>]/g, '');
                            const cleanRole = roleInput.replace(/[<@!&>]/g, '');
                            
                            const targetMember = message.guild.members.cache.get(cleanTarget) || message.guild.members.cache.find(m => m.user.tag.includes(targetInput) || m.user.username.includes(targetInput));
                            const targetRole = message.guild.roles.cache.get(cleanRole) || message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleInput.toLowerCase()));
                            
                            if (targetMember && targetRole) {
                                if (isAdd) await targetMember.roles.add(targetRole).catch(e => console.error('Role Add Fail:', e.message));
                                else await targetMember.roles.remove(targetRole).catch(e => console.error('Role Remove Fail:', e.message));
                                results.push(`${isAdd ? 'Assigned' : 'Removed'} role \`${targetRole.name}\` to/from ${targetMember.user.tag}`);
                            }
                        }
                    } catch (err) { console.error(err); }
                }

                if (results.length > 0) {
                    const summary = results.map(r => `\u2705 **Action:** ${r}`).join('\n');
                    await message.reply(summary).catch(() => {});
                }

                const aiResponse = result.response || result.message || result.answer || result.content;
                if (aiResponse) {
                    await message.reply(`${aiResponse}\n\n*ID: ${client.instanceId}*`).catch(() => message.channel.send(aiResponse));
                }

                return;
            } catch (error) {
                console.error('AI Processing Error:', error);
                await message.reply("\u274c **Error:** I encountered a technical issue. Please try again.").catch(() => {});
                return;
            }
        }

        // ---- WHITELIST: Only Owner Role ----
        if (member.roles.cache.has(OWNER_ROLE_ID)) return;
        const isStrictMember = STRICT_ROLES.some(id => member.roles.cache.has(id));

        // ---- DETECTION PATTERNS ----
        const inviteRegex = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
        const linkRegex = /(([a-z0-9]+\.)+[a-z]{2,})|(\[dot\])|( \. )/i;
        const dmRegex = /dm|pm|directmessage/i;
        
        const hasOffensive = OFFENSIVE_WORDS.some(word => normalizedContent.includes(word));
        const hasPromotion = PROMOTION_PHRASES.some(phrase => normalizedContent.includes(phrase.replace(/\s+/g, '')));
        
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

        // ---- LANGUAGE POLICY ----
        const ENGLISH_ONLY_IDS = ['1503896954038517840'];
        const isEnglishOnlyChannel = (ENGLISH_ONLY_IDS.includes(message.channel.id) || 
                                     (message.channel.name.toLowerCase().includes('english') && message.channel.name.toLowerCase().includes('chat'))) && 
                                   !message.channel.name.includes('ticket-') && 
                                   !message.channel.name.includes('apply-');

        if (!violationType && isEnglishOnlyChannel) {
            const hindiKeywords = [
                'hai', 'kya', 'nhi', 'nahi', 'kuch', 'baat', 'sab', 'bhai', 'behen', 'bol', 'rhe', 'rha', 'thi', 'tha', 'kar', 'raha', 'rahe', 
                'aap', 'tum', 'tera', 'mera', 'iska', 'uska', 'krna', 'kaise', 'h', 'vla', 'mene', 'chal', 'be', 're', 'ga', 'gi', 'se', 'ko',
                'par', 'toh', 'hi', 'bhi', 'na', 'ne', 'mein', 'hum', 'he', 'hu', 'ho', 'ab', 'tak', 'jab', 'tab', 'ka', 'ki', 'ke'
            ];
            const words = content.split(/\s+/);
            const wordsNormalized = words.map(w => w.replace(/[^\w]/g, ''));
            const hasHindi = wordsNormalized.some(w => hindiKeywords.includes(w));
            
            if (hasHindi) {
                const warns = (langWarningMap.get(userId) || 0) + 1;
                langWarningMap.set(userId, warns);

                if (warns >= 3) {
                    await member.timeout(3600000, 'Language Policy Violation: 3 Warnings Reached (#chat-english)');
                    await message.channel.send({ content: `\uD83D\uDEAB ${message.author}, you have been timed out for **1 hour** for repeated language policy violations (English Only).` });
                    langWarningMap.delete(userId);
                    await message.delete().catch(() => {});
                    return;
                } else {
                    await message.delete().catch(() => {});
                    const warnMsg = await message.channel.send({ content: `\u26A0\ufe0f ${message.author}, please speak **English only** in this channel. (Warning ${warns}/3)` });
                    setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                    return;
                }
            }
        }

        if (violationType) {
            await message.delete().catch(() => {});
            try {
                if (!member.moderatable) return;
                await member.timeout(600000, `Highly Strict Moderation x100: ${violationType}`);
                const warnEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setAuthor({ name: 'Security Protocol: Highly Strict x100', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`\uD83D\uDEAB ${message.author}, you have been timed out for **10 minutes**.\n**Reason:** ${violationType}`)
                    .setTimestamp();
                await message.channel.send({ embeds: [warnEmbed] }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                await logger.log(client, message.guild, {
                    isMod: true,
                    isStrict: isStrictMember,
                    title: '\uD83D\uDEE1\ufe0f Strict Security Violation',
                    color: '#ED4245',
                    fields: [
                        { name: '\uD83D\uDC64 User', value: `${message.author.tag}`, inline: true },
                        { name: '\u2696\ufe0f Action', value: '`10 Minute Timeout`', inline: true },
                        { name: '\u26A0\ufe0f Violation', value: violationType, inline: true }
                    ]
                });
            } catch (e) { console.error(e); }
            return;
        }

        // ---- ANTI SPAM ----
        const now = Date.now();
        const windowMs = 5000;
        const maxMessages = 5;

        if (!spamMap.has(userId)) spamMap.set(userId, []);
        const timestamps = spamMap.get(userId);
        const recentMessages = timestamps.filter(t => now - t < windowMs);
        recentMessages.push(now);
        spamMap.set(userId, recentMessages);

        if (recentMessages.length >= maxMessages) {
            try {
                await member.timeout(600000, 'Anti-Spam Protocol');
                const spamEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(`\u26A0\ufe0f ${message.author} has been timed out for **10 minutes** due to spamming.`)
                    .setTimestamp();
                await message.channel.send({ embeds: [spamEmbed] });
            } catch (e) { console.error(e); }
        }
    }
};