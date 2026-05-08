const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('app-reject')
        .setDescription('Respectfully reject a staff application')
        .addUserOption(option => option.setName('user').setDescription('The applicant to reject').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for rejection').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Unfortunately, your application does not meet our current requirements or the positions are filled.';

        const rejectEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('⚠️ Application Update')
            .setDescription(`Hello ${user}, thank you for your interest in the DenClient Staff Team.`)
            .addFields(
                { name: '⚖️ Decision', value: 'We regret to inform you that your application has been **Denied** at this time.' },
                { name: '📝 Feedback', value: `\`\`\`${reason}\`\`\`` },
                { name: '💡 Tip', value: 'You can re-apply in 30 days if you feel you have improved in the areas mentioned above.' }
            )
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'DenClient Recruitment Board • Official Decision' })
            .setTimestamp();

        await interaction.reply({ content: `${user}`, embeds: [rejectEmbed] });
    }
};
