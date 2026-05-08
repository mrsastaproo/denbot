const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages from the current channel')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ 
                content: '❌ You lack the necessary permissions to execute this moderation action.', 
                ephemeral: true 
            });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setDescription(`✅ Successfully purged **${deleted.size}** messages from this channel.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        await logger.log(client, interaction.guild, {
            isMod: true,
            title: '🛡️ Moderation Log: Messages Purged',
            color: '#5865F2',
            fields: [
                { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: '📁 Channel', value: `${interaction.channel}`, inline: true },
                { name: '🗑️ Amount', value: `\`${deleted.size} messages\``, inline: true },
                { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            footer: 'DenClient Security Protocol • Channel Maintenance'
        });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to purge messages. Ensure they are not older than 14 days.', ephemeral: true });
        }
    }
};
