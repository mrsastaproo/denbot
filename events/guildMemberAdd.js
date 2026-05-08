const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const guild = member.guild;
        const autoRoleId = client.config.autoRoleId;

        // ---- AUTO ROLE ----
        if (autoRoleId && autoRoleId !== 'YOUR_AUTO_ROLE_ID') {
            const role = guild.roles.cache.get(autoRoleId);
            if (role) {
                try {
                    await member.roles.add(role);
                } catch (error) {
                    console.error('Auto Role Error:', error);
                }
            }
        }

        // ---- PROFESSIONAL WELCOME MESSAGE ----
        const welcomeChannelId = client.config.welcomeChannel;
        if (welcomeChannelId) {
            const channel = guild.channels.cache.get(welcomeChannelId);
            if (channel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('✨ Welcome to DenClient!')
                    .setDescription(`Welcome ${member}, we are thrilled to have you here! You are our **${guild.memberCount}th** member.`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .addFields(
                        { name: '📜 Server Rules', value: 'Please follow all guidelines.', inline: true },
                        { name: '🎫 Get Support', value: 'Open a ticket in <#1501299316013138050> if you need help.', inline: true },
                        { name: '🚀 Get Started', value: 'Introduce yourself in the chat!', inline: false }
                    )
                    .setImage('https://i.pinimg.com/originals/0d/17/83/0d17838114f659e97e80980ba98f623a.gif') // Dynamic aesthetic banner
                    .setFooter({ text: `DenClient • Secure Community`, iconURL: guild.iconURL() })
                    .setTimestamp();

                await channel.send({ content: `Hey ${member}! Welcome to the family! 🥂`, embeds: [welcomeEmbed] });
            }
        }
    }
};
