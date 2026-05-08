const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue a formal warning to a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ 
                content: '❌ You lack the necessary permissions to execute this moderation action.', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;

        if (!client.warnings.has(user.id)) client.warnings.set(user.id, []);
        client.warnings.get(user.id).push({ reason, moderator: moderator.tag, date: new Date().toLocaleString() });

        const warnCount = client.warnings.get(user.id).length;

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setAuthor({ name: 'Moderation Action: Warning', iconURL: user.displayAvatarURL() })
            .addFields(
                { name: 'Target User', value: `${user.tag} (${user.id})`, inline: false },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Warn Count', value: `\`${warnCount}\``, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setFooter({ text: 'DenClient Security Protocol' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Logging
        await logger.log(client, interaction.guild, {
            isMod: true,
            title: '🛡️ Moderation Log: Member Warning',
            color: '#FEE75C',
            thumbnail: user.displayAvatarURL(),
            fields: [
                { name: '👤 Target User', value: `${user.tag} (${user.id})`, inline: false },
                { name: '🙋‍♂️ Moderator', value: `${moderator.tag}`, inline: true },
                { name: '⚠️ Warning Count', value: `\`${warnCount}/3\``, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\``, inline: false },
                { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            footer: 'DenClient Security Protocol • Disciplinary Action'
        });

        // Auto ban at 3 warnings
        if (warnCount >= 3) {
            const member = interaction.guild.members.cache.get(user.id);
            if (member && member.bannable) {
                await member.ban({ reason: 'Security Protocol: Maximum warnings reached (3/3).' });
                const banEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(`🔨 ${user} has been automatically banned for reaching the maximum warning limit (3/3).`)
                    .setTimestamp();
                
                await interaction.followUp({ embeds: [banEmbed] });
                
                await logger.log(client, interaction.guild, {
                    title: '🛡️ Automated Ban',
                    description: `${user} was banned after reaching 3 warnings.`,
                    color: 'Red'
                });
            }
        }
    }
};