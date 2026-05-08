const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Retrieve the disciplinary record for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true)),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const userWarnings = client.warnings.get(user.id) || [];

        if (userWarnings.length === 0) {
            return interaction.reply({ 
                content: `✅ **${user.tag}** has a clean record with no active warnings.`, 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setAuthor({ name: `Disciplinary Record: ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setDescription(userWarnings.map((w, i) => `**#${i + 1}** | **Reason:** ${w.reason}\n└ *Issued by ${w.moderator} on ${w.date}*`).join('\n\n'))
            .setFooter({ text: `Total Active Warnings: ${userWarnings.length}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
