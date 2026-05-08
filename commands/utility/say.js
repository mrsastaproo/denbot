const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Send a message or announcement via the bot')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the message in')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message content')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('title')
                .setDescription('Optional title (makes it an embed announcement)')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ You lack the `Manage Messages` permission.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message').replace(/\\n/g, '\n');
        const title = interaction.options.getString('title');

        try {
            if (title) {
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(title)
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: `Announcement by ${interaction.user.tag}` });
                
                await channel.send({ embeds: [embed] });
            } else {
                await channel.send({ content: message });
            }

            await interaction.reply({ content: `✅ Message sent successfully to ${channel}.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to send message. Check bot permissions in that channel.', ephemeral: true });
        }
    }
};
