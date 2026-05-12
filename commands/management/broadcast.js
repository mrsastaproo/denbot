const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
    ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Create and send a professional, premium embed to any channel')
        .addChannelOption(option => 
            option.setName('target')
                .setDescription('The channel to send the message to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('target');

        const modal = new ModalBuilder()
            .setCustomId(`broadcast_modal_${targetChannel.id}`)
            .setTitle('💎 Premium Embed Builder');

        const titleInput = new TextInputBuilder()
            .setCustomId('bc_title')
            .setLabel('Embed Title')
            .setPlaceholder('Enter a catchy, professional title...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('bc_desc')
            .setLabel('Message Content')
            .setPlaceholder('Describe what you want to say in a premium way...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const colorInput = new TextInputBuilder()
            .setCustomId('bc_color')
            .setLabel('Hex Color Code (Optional)')
            .setPlaceholder('e.g. #EAB308 (Gold) or leave blank for default')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const imageInput = new TextInputBuilder()
            .setCustomId('bc_image')
            .setLabel('Image URL (Optional)')
            .setPlaceholder('Add a premium banner link...')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('bc_footer')
            .setLabel('Footer Text')
            .setPlaceholder('e.g. DenClient • Official Announcement')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        await interaction.showModal(modal);
    }
};
