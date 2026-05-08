const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for the current channel')
        .addIntegerOption(option => 
            option.setName('seconds')
                .setDescription('Number of seconds (0 to disable)')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ content: '❌ You lack the `Manage Channels` permission.', ephemeral: true });
        }

        const seconds = interaction.options.getInteger('seconds');

        try {
            await interaction.channel.setRateLimitPerUser(seconds);
            
            const embed = new EmbedBuilder()
                .setColor(seconds === 0 ? '#ED4245' : '#57F287')
                .setDescription(`⏳ Slowmode has been set to **${seconds}** seconds ${seconds === 0 ? '(Disabled)' : ''}.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: '🛡️ Moderation Log: Slowmode Updated',
                color: '#5865F2',
                fields: [
                    { name: '📍 Channel', value: `${interaction.channel}`, inline: true },
                    { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: '🕒 Duration', value: `\`${seconds}s\``, inline: true }
                ],
                footer: 'DenClient Security Protocol'
            });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to update slowmode.', ephemeral: true });
        }
    }
};
