const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Kisi member ko mute karo')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration (minutes)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason')),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ content: '❌ Permission nahi hai!', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(user.id);

        await member.timeout(duration * 60000, reason);

        const embed = new EmbedBuilder()
            .setColor('Grey')
            .setTitle('🔇 Mute')
            .addFields(
                { name: 'User', value: `${user.tag}`, inline: true },
                { name: 'Duration', value: `${duration} minutes`, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};