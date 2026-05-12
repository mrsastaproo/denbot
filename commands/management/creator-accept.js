const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('creator-accept')
        .setDescription('Professionally accept a creator partnership application')
        .addUserOption(option => option.setName('user').setDescription('The creator to accept').setRequired(true))
        .addStringOption(option => option.setName('perks').setDescription('Specific perks for this creator').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const perks = interaction.options.getString('perks') || 'Exclusive Partner Badge, Media Rank, and Social Media Shoutouts.';

        const acceptEmbed = new EmbedBuilder()
            .setColor('#EAB308')
            .setTitle('🤝 Partnership Officially Accepted!')
            .setAuthor({ name: 'DenClient Creator Program', iconURL: interaction.client.user.displayAvatarURL() })
            .setDescription(`Congratulations ${user}! We have reviewed your channel and metrics, and we are excited to welcome you as an official **DenClient Partner**.`)
            .addFields(
                { name: '💎 Your New Perks', value: `\`\`\`${perks}\`\`\``, inline: false },
                { name: '🚀 Next Steps', value: 'Our management team will contact you in this channel to finalize the promotion details and provide your exclusive assets.', inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setImage('https://i.pinimg.com/originals/0d/17/83/0d17838114f659e97e80980ba98f623a.gif')
            .setFooter({ text: 'DenClient Business • Strategic Partnership Approved' })
            .setTimestamp();

        await interaction.reply({ content: `${user}`, embeds: [acceptEmbed] });
    }
};
