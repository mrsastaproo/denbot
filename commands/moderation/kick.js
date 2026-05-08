const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Execute a formal kick of a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick')),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('KickMembers')) {
            return interaction.reply({ 
                content: '❌ You lack the necessary permissions to execute this moderation action.', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) return interaction.reply({ content: '❌ Target user not found in the server.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: '❌ Security Protocol: Target user cannot be kicked by this bot.', ephemeral: true });

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setColor('#F57C00')
            .setAuthor({ name: 'Moderation Action: Kick', iconURL: user.displayAvatarURL() })
            .addFields(
                { name: 'Target User', value: `${user.tag} (${user.id})`, inline: false },
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setFooter({ text: 'DenClient Security Protocol' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        await logger.log(client, interaction.guild, {
            isMod: true,
            title: '🛡️ Moderation Log: Member Kick',
            color: '#F57C00',
            thumbnail: user.displayAvatarURL(),
            fields: [
                { name: '👤 Target User', value: `${user.tag} (${user.id})`, inline: false },
                { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: '👢 Action', value: '`Formal Kick`', inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\``, inline: false },
                { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            footer: 'DenClient Security Protocol • Disciplinary Action'
        });
    }
};