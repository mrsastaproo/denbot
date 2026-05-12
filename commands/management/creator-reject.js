const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('creator-reject')
        .setDescription('Professionally decline a creator partnership application')
        .addUserOption(option => option.setName('user').setDescription('The creator to decline').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for decline').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Your current channel metrics or content style do not align with our current requirements.';

        const rejectEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🙏 Partnership Update')
            .setAuthor({ name: 'DenClient Creator Program', iconURL: interaction.client.user.displayAvatarURL() })
            .setDescription(`Hello ${user}, thank you for your interest in partnering with **DenClient**.`)
            .addFields(
                { name: '📝 Feedback from Management', value: `\`\`\`${reason}\`\`\``, inline: false },
                { name: '🔄 What\'s Next?', value: 'While we are moving in a different direction for now, feel free to apply again in the future as your channel grows!', inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: 'DenClient Business • Partnership Review' })
            .setTimestamp();

        await interaction.reply({ content: `${user}`, embeds: [rejectEmbed] });
    }
};
