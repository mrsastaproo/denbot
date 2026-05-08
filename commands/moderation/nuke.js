const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Completely clear all messages in this channel (Delete & Clone)'),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ This high-level command requires **Administrator** permissions.', ephemeral: true });
        }

        const channel = interaction.channel;
        const position = channel.position;

        try {
            const newChannel = await channel.clone();
            await channel.delete();
            await newChannel.setPosition(position);

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('☢️ Channel Nuked')
                .setDescription('This channel has been completely cleared.')
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/HhTXt43pk1I1W/giphy.gif')
                .setTimestamp();

            await newChannel.send({ embeds: [embed] });

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: '☢️ Moderation Log: Channel Nuked',
                color: '#ED4245',
                fields: [
                    { name: '📍 New Channel', value: `${newChannel}`, inline: true },
                    { name: '🙋‍♂️ Executor', value: `${interaction.user.tag}`, inline: true }
                ],
                footer: 'DenClient Critical Operation'
            });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to nuke channel. Check bot permissions.', ephemeral: true });
        }
    }
};
