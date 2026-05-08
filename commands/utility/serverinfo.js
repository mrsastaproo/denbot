const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display detailed information about this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const { guild } = interaction;
        const { members, channels, roles, stickers, emojis } = guild;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🏛️ ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👥 Members', value: `Total: \`${guild.memberCount}\``, inline: true },
                { name: '💬 Channels', value: `Total: \`${channels.cache.size}\``, inline: true },
                { name: '🛡️ Roles', value: `Total: \`${roles.cache.size}\``, inline: true },
                { name: '✨ Boosts', value: `Level: \`${guild.premiumTier}\` (\`${guild.premiumSubscriptionCount}\` boosts)`, inline: false }
            )
            .setFooter({ text: 'DenClient Analytics', iconURL: guild.iconURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
