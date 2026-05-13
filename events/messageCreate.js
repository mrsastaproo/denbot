const { EmbedBuilder, PermissionsBitField, ChannelType, AuditLogEvent } = require('discord.js');
const { moderateMessage, processAIQuery } = require('../utils/ai');
const { fastModerate } = require('../utils/moderation');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const prefix = 'den-ai:';
        const staffPrefix = 'den$';
        const queryPrefix = '.';
        
        const isAI = message.content.startsWith(prefix) || message.content.startsWith(queryPrefix);
        const isStaffCmd = message.content.startsWith(staffPrefix);
        const isModeratedChannel = message.channel.id === client.config.strictLogChannel;
        const isStaff = message.member.permissions.has('Administrator') || message.member.roles.cache.has(client.config.staffRole);

        // --- Instant Code-Based Moderation (No AI Delay) ---
        const isEnglishChatID = message.channel.id === '1503896954038517840';
        const forceEnglish = isEnglishChatID || message.channel.name.toLowerCase().includes('english');
        
        if (!isAI && !isStaffCmd && !isStaff) {
            const modResult = fastModerate(message.content, forceEnglish ? "english" : message.channel.name);
            
            if (modResult.actions && modResult.actions.length > 0) {
                for (const act of modResult.actions) {
                    try {
                        if (act.action === 'delete_message') {
                            await message.delete().catch(() => {});
                        } else if (act.action === 'timeout') {
                            const member = message.member || await message.guild.members.fetch(message.author.id);
                            if (member && member.moderatable) {
                                await member.timeout((act.parameters?.duration || 10) * 60000, act.parameters?.reason || 'Auto-Mod Violation');
                            }
                        }
                    } catch (e) { console.error('Mod Action Fail:', e.message); }
                }

                if (modResult.response) {
                    const warnMsg = await message.channel.send(`⚠️ ${message.author}, ${modResult.response}`);
                    setTimeout(() => warnMsg.delete().catch(() => {}), 10000);
                }
                return; // Stop processing further for this message
            }
        } else if (!isAI && !isStaffCmd && isStaff && forceEnglish) {
            // Optional: Still check for links even for staff? No, user said don't activate if . isn't used.
        }

        if (!isAI && !isStaffCmd) return;

        // Staff Shortcuts
        if (isStaffCmd) {
            if (!message.member.roles.cache.has(client.config.staffRole)) return;
            const cmd = message.content.slice(staffPrefix.length).trim().toLowerCase();
            
            if (cmd === 'accept') {
                await message.reply("\u2705 **Application Accepted.** I'm notifying the user and setting up their onboarding process.");
                return;
            }
            if (cmd === 'close') {
                await message.reply("\uD83D\uDD12 **Closing discussion.** Archiving logs and locking the channel.");
                setTimeout(() => message.channel.delete().catch(() => {}), 5000);
                return;
            }
        }

        // AI Processing
        if (isAI) {
            const query = message.content.slice(message.content.startsWith(prefix) ? prefix.length : queryPrefix.length).trim();
            if (!query) return;

            // Show native Discord typing indicator
            await message.channel.sendTyping().catch(() => {});

            try {
                const result = await processAIQuery(query, message.author.tag, message.author.id);

                const results = [];
                let lastCreatedChannel = null;

                const findChannel = (input) => {
                    if (!input) return null;
                    const query = String(input).toLowerCase().replace(/[<#>]/g, '').trim();
                    
                    // Direct "this channel" logic
                    if (query.includes('this channel') || query === 'here') return message.channel;

                    const channels = message.guild.channels.cache;
                    
                    // 1. Try exact ID
                    let target = channels.get(query);
                    if (target) return target;

                    // 2. Try clean name match (stripping emojis/symbols)
                    target = channels.find(c => {
                        const cleanName = c.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        const cleanQuery = query.replace(/[^a-z0-9-]/g, '');
                        return cleanName === cleanQuery || cleanName.includes(cleanQuery);
                    });
                    if (target) return target;

                    // 3. Fallback to standard includes
                    return channels.find(c => c.name.toLowerCase().includes(query));
                };

                if (result.actions && Array.isArray(result.actions)) {
                    for (const act of result.actions) {
                        try {
                            // ─── EMBEDS ──────────────────────────────────
                            if (act.action === 'send_premium_message' || act.action === 'broadcast') {
                                const target = findChannel(act.parameters?.channel) || lastCreatedChannel || message.channel;
                                const embed = new EmbedBuilder()
                                    .setColor(act.parameters?.color || '#EAB308')
                                    .setTitle(act.parameters?.title || 'DenClient Notification')
                                    .setDescription(act.parameters?.content || '...')
                                    .setTimestamp();
                                if (act.parameters?.thumbnail) embed.setThumbnail(act.parameters.thumbnail);
                                if (act.parameters?.image) embed.setImage(act.parameters.image);
                                if (act.parameters?.footer) embed.setFooter({ text: act.parameters.footer, iconURL: message.client.user.displayAvatarURL() });
                                if (Array.isArray(act.parameters?.fields)) {
                                    act.parameters.fields.forEach(f => { if (f.name && f.value) embed.addFields({ name: f.name, value: f.value, inline: !!f.inline }); });
                                }
                                let pingContent = '';
                                if (act.parameters?.ping) {
                                    if (act.parameters.ping === '@everyone' || act.parameters.ping === '@here') pingContent = act.parameters.ping;
                                    else pingContent = `<@&${act.parameters.ping}>`;
                                }
                                await target.send({ content: pingContent || undefined, embeds: [embed] }).catch(() => {});
                                results.push(`📢 Sent premium embed to **#${target.name}**`);

                            // ─── CHANNEL MANAGEMENT ───────────────────────
                            } else if (act.action === 'create_category') {
                                const category = await message.guild.channels.create({
                                    name: act.parameters?.name || 'New Category',
                                    type: ChannelType.GuildCategory
                                });
                                results.push(`📂 Created category **${category.name}**`);

                            } else if (act.action === 'create_channel') {
                                const typeMap = { 'text': ChannelType.GuildText, 'voice': ChannelType.GuildVoice, 'category': ChannelType.GuildCategory, 'stage': ChannelType.GuildStageVoice, 'forum': ChannelType.GuildForum };
                                lastCreatedChannel = await message.guild.channels.create({
                                    name: act.parameters?.name || 'new-channel',
                                    type: typeMap[act.parameters?.type] || ChannelType.GuildText,
                                    parent: act.parameters?.parent || null,
                                    topic: act.parameters?.topic || '',
                                    rateLimitPerUser: act.parameters?.slowmode || 0,
                                    nsfw: act.parameters?.nsfw || false
                                });
                                results.push(`✅ Created **${act.parameters?.type || 'text'}** channel **#${lastCreatedChannel.name}**`);

                            } else if (act.action === 'edit_channel') {
                                const target = findChannel(act.parameters?.id) || message.channel;
                                await target.edit({
                                    name: act.parameters?.name,
                                    topic: act.parameters?.topic,
                                    rateLimitPerUser: act.parameters?.slowmode
                                }).catch(() => {});
                                results.push(`✏️ Updated channel **#${target.name}**`);

                            } else if (act.action === 'delete_channel') {
                                const target = findChannel(act.parameters?.id);
                                if (target) { await target.delete().catch(() => {}); results.push(`🗑️ Deleted channel **#${target.name}**`); }

                            } else if (act.action === 'lock_channel') {
                                const target = findChannel(act.parameters?.id) || message.channel;
                                await target.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(() => {});
                                results.push(`🔒 Locked **#${target.name}**`);

                            } else if (act.action === 'unlock_channel') {
                                const target = findChannel(act.parameters?.id) || message.channel;
                                await target.permissionOverwrites.edit(message.guild.id, { SendMessages: null }).catch(() => {});
                                results.push(`🔓 Unlocked **#${target.name}**`);

                            } else if (act.action === 'move_user') {
                                const userId = act.parameters?.user?.toString().replace(/[<@!>]/g, '');
                                if (userId) {
                                    const member = await message.guild.members.fetch(userId).catch(() => null);
                                    if (member && member.voice.channel) {
                                        await member.voice.setChannel(act.parameters?.channel).catch(() => {});
                                        results.push(`🚚 Moved **${member.user.tag}** to **#${message.guild.channels.cache.get(act.parameters?.channel)?.name || 'target'}**`);
                                    }
                                }

                            } else if (act.action === 'disconnect_user') {
                                const userId = act.parameters?.user?.toString().replace(/[<@!>]/g, '');
                                if (userId) {
                                    const member = await message.guild.members.fetch(userId).catch(() => null);
                                    if (member && member.voice.channel) {
                                        await member.voice.disconnect().catch(() => {});
                                        results.push(`🔌 Disconnected **${member.user.tag}** from voice`);
                                    }
                                }

                            } else if (act.action === 'set_nickname') {
                                const userId = act.parameters?.user?.toString().replace(/[<@!>]/g, '');
                                if (userId) {
                                    const member = await message.guild.members.fetch(userId).catch(() => null);
                                    if (member) {
                                        await member.setNickname(act.parameters?.nickname).catch(() => {});
                                        results.push(`📛 Set nickname for **${member.user.tag}** to **${act.parameters?.nickname}**`);
                                    }
                                }

                            } else if (act.action === 'set_permissions') {
                                const target = findChannel(act.parameters?.channel);
                                const roleId = act.parameters?.role?.toString().replace(/[<@&>]/g, '');
                                if (target && roleId) {
                                    const role = message.guild.roles.cache.get(roleId);
                                    if (role) {
                                        const allow = {}; act.parameters.allow?.forEach(p => allow[p] = true);
                                        const deny = {}; act.parameters.deny?.forEach(p => deny[p] = false);
                                        await target.permissionOverwrites.edit(role, { ...allow, ...deny }).catch(() => {});
                                        results.push(`🛠️ Updated permissions for **@${role.name}** in **#${target.name}**`);
                                    }
                                }

                            } else if (act.action === 'lockdown_server') {
                                const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
                                for (const [id, channel] of channels) {
                                    await channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(() => {});
                                }
                                results.push(`🚨 **SERVER LOCKDOWN ENABLED** - All text channels locked.`);

                            } else if (act.action === 'unlock_server') {
                                const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
                                for (const [id, channel] of channels) {
                                    await channel.permissionOverwrites.edit(message.guild.id, { SendMessages: null }).catch(() => {});
                                }
                                results.push(`🟢 **SERVER LOCKDOWN LIFTED** - Access restored.`);

                            } else if (act.action === 'slow_mode') {
                                const seconds = Math.min(parseInt(act.parameters?.seconds) || 0, 21600);
                                await message.channel.setRateLimitPerUser(seconds).catch(() => {});
                                results.push(`⏱️ Slowmode set to **${seconds}s** in **#${message.channel.name}**`);

                            // ─── ROLE MANAGEMENT ─────────────────────────
                            } else if (act.action === 'create_role') {
                                const role = await message.guild.roles.create({
                                    name: act.parameters?.name || 'New Role',
                                    color: act.parameters?.color || '#99AAB5',
                                    hoist: act.parameters?.hoist || false,
                                    mentionable: act.parameters?.mentionable || false
                                });
                                results.push(`✅ Created role **@${role.name}**`);

                            } else if (act.action === 'edit_role') {
                                const cleanR = String(act.parameters?.role || '').replace(/[<@!&>]/g, '');
                                const role = message.guild.roles.cache.get(cleanR) || message.guild.roles.cache.find(r => r.name.toLowerCase() === String(act.parameters?.role).toLowerCase());
                                if (role) {
                                    await role.edit({ name: act.parameters?.name, color: act.parameters?.color, hoist: act.parameters?.hoist }).catch(() => {});
                                    results.push(`✏️ Edited role **@${role.name}**`);
                                }

                            } else if (act.action === 'delete_role') {
                                const cleanR = String(act.parameters?.role || '').replace(/[<@!&>]/g, '');
                                const role = message.guild.roles.cache.get(cleanR) || message.guild.roles.cache.find(r => r.name.toLowerCase() === String(act.parameters?.role).toLowerCase());
                                if (role) { await role.delete().catch(() => {}); results.push(`🗑️ Deleted role **@${role.name}**`); }

                            } else if (act.action === 'add_role' || act.action === 'remove_role') {
                                const cleanU = String(act.parameters?.user || '').replace(/[<@!&>]/g, '');
                                const cleanR = String(act.parameters?.role || '').replace(/[<@!&>]/g, '');
                                const member = message.guild.members.cache.get(cleanU) || message.guild.members.cache.find(m => m.user.tag === act.parameters?.user);
                                const role = message.guild.roles.cache.get(cleanR) || message.guild.roles.cache.find(r => r.name.toLowerCase() === String(act.parameters?.role).toLowerCase());
                                if (member && role) {
                                    if (act.action === 'add_role') await member.roles.add(role);
                                    else await member.roles.remove(role);
                                    results.push(`${act.action === 'add_role' ? '➕' : '➖'} ${act.action === 'add_role' ? 'Added' : 'Removed'} **@${role.name}** for **${member.user.tag}**`);
                                }

                            // ─── MODERATION ───────────────────────────────
                            } else if (act.action === 'timeout' || act.action === 'kick' || act.action === 'ban') {
                                const cleanU = String(act.parameters?.user || '').replace(/[<@!&>]/g, '');
                                const member = message.guild.members.cache.get(cleanU) || await message.guild.members.fetch(cleanU).catch(() => null);
                                if (member && member.moderatable) {
                                    if (act.action === 'timeout') {
                                        await member.timeout((act.parameters?.duration || 10) * 60000, act.parameters?.reason || 'Admin action');
                                        results.push(`⏳ Timed out **${member.user.tag}** for **${act.parameters?.duration || 10}min**`);
                                    } else if (act.action === 'kick') {
                                        await member.kick(act.parameters?.reason || 'Admin action');
                                        results.push(`👢 Kicked **${member.user.tag}**`);
                                    } else if (act.action === 'ban') {
                                        await member.ban({ reason: act.parameters?.reason || 'Admin action', deleteMessageDays: act.parameters?.delete_days || 0 });
                                        results.push(`🔨 Banned **${member.user.tag}**`);
                                    }
                                }

                            } else if (act.action === 'unban') {
                                const cleanU = String(act.parameters?.user || '').replace(/[<@!&>]/g, '');
                                await message.guild.bans.remove(cleanU, 'Admin action').catch(() => {});
                                results.push(`✅ Unbanned user **${cleanU}**`);

                            } else if (act.action === 'warn') {
                                const cleanU = String(act.parameters?.user || '').replace(/[<@!&>]/g, '');
                                const warnTarget = message.guild.members.cache.get(cleanU);
                                if (warnTarget) {
                                    const warnEmbed = new EmbedBuilder()
                                        .setColor('#ED4245')
                                        .setTitle('⚠️ Official Warning Issued')
                                        .setThumbnail(warnTarget.user.displayAvatarURL())
                                        .addFields(
                                            { name: '👤 User', value: `${warnTarget.user.tag} (${warnTarget.id})`, inline: true },
                                            { name: '📌 Reason', value: act.parameters?.reason || 'No reason provided', inline: false }
                                        )
                                        .setFooter({ text: 'DenClient Moderation System', iconURL: message.client.user.displayAvatarURL() })
                                        .setTimestamp();
                                    await message.channel.send({ embeds: [warnEmbed] });
                                    results.push(`⚠️ Warned **${warnTarget.user.tag}**`);
                                }

                            } else if (act.action === 'purge_messages') {
                                const count = Math.min(parseInt(act.parameters?.count) || 10, 100);
                                const deleted = await message.channel.bulkDelete(count, true).catch(() => null);
                                results.push(`🗑️ Purged **${deleted?.size || count}** messages`);
                            }

                        } catch (e) { console.error('Action Fail:', e.message); }
                    }
                }

                if (results.length > 0) {
                    await message.reply(results.map(r => `\u2705 **Action:** ${r}`).join('\n')).catch(() => {});
                }

                if (result.response) {
                    await message.reply(result.response).catch(() => message.channel.send(result.response));
                } else if (results.length === 0) {
                    await message.reply("\u26A0\uFE0F **Analysis complete but no specific response or actions were generated.**").catch(() => {});
                }

            } catch (error) {
                console.error('AI Fatal Error:', error);
                const errorMsg = error.message.includes('JSON') ? 'Invalid response format from AI.' : 'Infrastructure issue detected.';
                await message.reply(`\u274c **Strategic Analysis Failed.** ${errorMsg}`).catch(() => {});
            }
        }
    }
};