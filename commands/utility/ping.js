const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and API status')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '🌐 Latency', value: `\`${latency}ms\``, inline: true },
                { name: '⚡ API Latency', value: `\`${apiLatency}ms\``, inline: true },
                { name: '🔌 Status', value: '✅ Operational', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'DenClient Connectivity' });

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
