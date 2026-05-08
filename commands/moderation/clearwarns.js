const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Purge all disciplinary records for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ 
                content: '❌ You lack the necessary permissions to execute this moderation action.', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');

        if (!client.warnings.has(user.id) || client.warnings.get(user.id).length === 0) {
            return interaction.reply({ 
                content: `ℹ️ **${user.tag}** already has a clean record.`, 
                ephemeral: true 
            });
        }

        const count = client.warnings.get(user.id).length;
        client.warnings.delete(user.id);

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setDescription(`✅ Successfully purged **${count}** warning(s) from **${user.tag}**'s record.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        await logger.log(client, interaction.guild, {
            isMod: true,
            title: '🛡️ Moderation Log: Records Purged',
            color: '#57F287',
            thumbnail: user.displayAvatarURL(),
            fields: [
                { name: '👤 Target User', value: `${user.tag} (${user.id})`, inline: false },
                { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: '🗑️ Records Cleared', value: `\`${count} warnings\``, inline: true },
                { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            footer: 'DenClient Security Protocol • Disciplinary Action'
        });
    }
};
