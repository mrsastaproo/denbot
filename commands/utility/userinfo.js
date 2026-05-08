const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get detailed information about a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('user').setDescription('The user to get info for').setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
                { name: '📅 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '📅 Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '🛡️ Highest Role', value: `${member.roles.highest}`, inline: true },
                { name: '🎨 Color', value: `\`${member.displayHexColor.toUpperCase()}\``, inline: true },
                { name: '🤖 Bot', value: `\`${user.bot ? 'Yes' : 'No'}\``, inline: true }
            )
            .setFooter({ text: 'DenClient Identity' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
