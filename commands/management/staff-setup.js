const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff-setup')
        .setDescription('Initialize the professional staff application portal')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛡️ DenClient Official Recruitment')
            .setDescription(`Hey @everyone!\n\n## 🚨 Staff applications are still open!  \nIf you want to help out and join the team, now’s the time.\n\n### ℹ️ Requirements:\n- Knowledge of **English** sufficient for communication with others is required.\n- **2FA** must be enabled on your **Discord** account before applying.\n- Must meet **Discord’s minimum age requirement**.\n- Must have been a **member of this server for at least a few weeks**.\n- Be **active on Discord** and reasonably available.\n- Be patient, calm, and rational.\n- No **moderation history**.\n- Willing to **follow staff rules**, accept feedback, and work as a team.\n- **Use of AI tools (e.g. ChatGPT) is strictly forbidden.**\n\n✅ Apply by clicking below. Good luck to all applicants!\n\n⏳ Your application will be reviewed within **2-4 weeks**.\n💬 **Spamming staff** will result in immediate denial.\n❗ Submitting **fake applications** will result in a **ban**.`)
            .setImage('https://i.pinimg.com/originals/0d/17/83/0d17838114f659e97e80980ba98f623a.gif')
            .setFooter({ text: 'DenClient Security & Recruitment Portal' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_staff')
                .setLabel('Send Application')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Staff application portal has been successfully initialized.', ephemeral: true });
    }
};
