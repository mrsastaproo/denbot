const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get a high-resolution version of a member\'s avatar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('user').setDescription('The user to get avatar for').setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 4096 });

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🖼️ Avatar of ${user.username}`)
            .setImage(avatarURL)
            .setFooter({ text: 'DenClient Visuals' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Link to Avatar')
                    .setURL(avatarURL)
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
