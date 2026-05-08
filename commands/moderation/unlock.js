const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock the current channel to allow members to send messages'),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ You lack the `Manage Channels` permission.', ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            });

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🔓 Channel Unlocked')
                .setDescription('The lockdown has been lifted. You can now send messages.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: '🛡️ Moderation Log: Channel Unlocked',
                color: '#57F287',
                fields: [
                    { name: '📍 Channel', value: `${interaction.channel}`, inline: true },
                    { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true }
                ],
                footer: 'DenClient Security Protocol'
            });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to unlock channel.', ephemeral: true });
        }
    }
};
