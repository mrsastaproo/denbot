const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Initialize the professional ticket support system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('🎫 DenClient Official Support')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
                'Welcome to the **DenClient Support Portal**. Our dedicated staff team is here to assist you with any inquiries, reports, or technical issues.\n\n' +
                '**Guidelines:**\n' +
                '• Please be patient after opening a ticket.\n' +
                '• Describe your issue in detail for faster assistance.\n' +
                '• Avoid pinging staff unless it is an emergency.'
            )
            .setFooter({ text: 'Secure Support System • DenClient', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Initialize Support Session')
                    .setEmoji('🛡️')
                    .setStyle(ButtonStyle.Secondary),
            );

        await interaction.reply({ content: '✅ **Support Portal** has been successfully initialized.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [button] });
    }
};
