const { EmbedBuilder, PermissionsBitField, ChannelType, AuditLogEvent } = require('discord.js');
const { processAIQuery } = require('../utils/ai');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const prefix = 'den-ai:';
        const staffPrefix = 'den$';
        const queryPrefix = '.';
        
        const isAI = message.content.startsWith(prefix) || message.content.startsWith(queryPrefix);
        const isStaffCmd = message.content.startsWith(staffPrefix);

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

            const typingMsg = await message.reply("\uD83D\uDD34 **DenClient Strategic Analysis in progress...**");

            try {
                const result = await processAIQuery(query, message.author.tag);
                await typingMsg.delete().catch(() => {});

                const results = [];
                let lastCreatedChannel = null;

                const findChannel = (input) => {
                    if (!input) return null;
                    const clean = String(input).replace(/[<#>]/g, '');
                    return message.guild.channels.cache.get(clean) || message.guild.channels.cache.find(c => c.name.toLowerCase().includes(String(input).toLowerCase()));
                };

                if (result.actions && Array.isArray(result.actions)) {
                    for (const act of result.actions) {
                        try {
                            if (act.action === 'send_premium_message') {
                                const target = findChannel(act.parameters?.channel) || lastCreatedChannel || message.channel;
                                const embed = new EmbedBuilder()
                                    .setColor(act.parameters?.color || '#EAB308')
                                    .setTitle(act.parameters?.title || 'DenClient Notification')
                                    .setDescription(act.parameters?.content || '...')
                                    .setTimestamp();
                                if (act.parameters?.image) embed.setImage(act.parameters.image);
                                if (act.parameters?.footer) embed.setFooter({ text: act.parameters.footer });
                                if (Array.isArray(act.parameters?.fields)) {
                                    act.parameters.fields.forEach(f => { if(f.name && f.value) embed.addFields({ name: f.name, value: f.value, inline: !!f.inline }); });
                                }
                                await target.send({ embeds: [embed] }).catch(() => {});
                                results.push(`Sent premium embed to ${target.name}`);
                            } else if (act.action === 'create_channel' || act.action === 'edit_channel' || act.action === 'delete_channel') {
                                const typeMap = { 'text': ChannelType.GuildText, 'voice': ChannelType.GuildVoice, 'category': ChannelType.GuildCategory };
                                if (act.action === 'create_channel') {
                                    lastCreatedChannel = await message.guild.channels.create({
                                        name: act.parameters?.name || 'new-channel',
                                        type: typeMap[act.parameters?.type] || ChannelType.GuildText,
                                        parent: act.parameters?.parent || null,
                                        topic: act.parameters?.topic || ''
                                    });
                                    results.push(`Created ${act.parameters?.type || 'text'} channel ${lastCreatedChannel.name}`);
                                } else if (act.action === 'edit_channel') {
                                    const target = findChannel(act.parameters?.id) || message.channel;
                                    await target.edit({ name: act.parameters?.name, topic: act.parameters?.topic, rateLimitPerUser: act.parameters?.slowmode }).catch(() => {});
                                    results.push(`Updated ${target.name}`);
                                } else if (act.action === 'delete_channel') {
                                    const target = findChannel(act.parameters?.id);
                                    if (target) { await target.delete().catch(() => {}); results.push(`Deleted ${target.name}`); }
                                }
                            } else if (act.action === 'create_role' || act.action === 'add_role' || act.action === 'remove_role') {
                                if (act.action === 'create_role') {
                                    const role = await message.guild.roles.create({ name: act.parameters?.name || 'New Role', color: act.parameters?.color || '#99AAB5' });
                                    results.push(`Created role ${role.name}`);
                                } else {
                                    const cleanU = String(act.parameters?.user || '').replace(/[<@!&>]/g, '');
                                    const cleanR = String(act.parameters?.role || '').replace(/[<@!&>]/g, '');
                                    const member = message.guild.members.cache.get(cleanU) || message.guild.members.cache.find(m => m.user.tag === act.parameters?.user);
                                    const role = message.guild.roles.cache.get(cleanR) || message.guild.roles.cache.find(r => r.name.toLowerCase() === String(act.parameters?.role).toLowerCase());
                                    if (member && role) {
                                        if (act.action === 'add_role') await member.roles.add(role);
                                        else await member.roles.remove(role);
                                        results.push(`${act.action === 'add_role' ? 'Added' : 'Removed'} ${role.name} for ${member.user.tag}`);
                                    }
                                }
                            } else if (act.action === 'timeout' || act.action === 'kick' || act.action === 'ban') {
                                const cleanU = String(act.parameters?.user || '').replace(/[<@!&>]/g, '');
                                const member = message.guild.members.cache.get(cleanU);
                                if (member && member.moderatable) {
                                    if (act.action === 'timeout') await member.timeout((act.parameters?.duration || 10) * 60000);
                                    else if (act.action === 'kick') await member.kick();
                                    else if (act.action === 'ban') await member.ban();
                                    results.push(`Executed ${act.action} on ${member.user.tag}`);
                                }
                            } else if (act.action === 'purge_messages') {
                                const count = Math.min(parseInt(act.parameters?.count) || 10, 100);
                                await message.channel.bulkDelete(count, true);
                                results.push(`Purged ${count} messages`);
                            }
                        } catch (e) { console.error('Action Fail:', e.message); }
                    }
                }

                if (results.length > 0) {
                    await message.reply(results.map(r => `\u2705 **Action:** ${r}`).join('\n')).catch(() => {});
                }

                if (result.response) {
                    await message.reply(`${result.response}\n\n*ID: ${client.instanceId}*`).catch(() => message.channel.send(result.response));
                } else if (results.length === 0) {
                    await message.reply("\u26A0\uFE0F **Analysis complete but no specific response or actions were generated.**").catch(() => {});
                }

            } catch (error) {
                console.error('AI Fatal Error:', error);
                const errorMsg = error.message.includes('JSON') ? 'Invalid response format from AI.' : 'Infrastructure issue detected.';
                await typingMsg.edit(`\u274c **Strategic Analysis Failed.** ${errorMsg}`).catch(() => {});
            }
        }
    }
};