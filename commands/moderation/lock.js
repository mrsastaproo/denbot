const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock the current channel to prevent members from sending messages'),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ You lack the `Manage Channels` permission.', ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🔒 Channel Locked')
                .setDescription('This channel has been placed under lockdown by a moderator.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: '🛡️ Moderation Log: Channel Locked',
                color: '#ED4245',
                fields: [
                    { name: '📍 Channel', value: `${interaction.channel}`, inline: true },
                    { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true }
                ],
                footer: 'DenClient Security Protocol'
            });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to lock channel.', ephemeral: true });
        }
    }
};
