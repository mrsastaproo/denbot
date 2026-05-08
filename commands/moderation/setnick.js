const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('Change a member\'s nickname')
        .addUserOption(option => option.setName('user').setDescription('The user to change nickname for').setRequired(true))
        .addStringOption(option => option.setName('nickname').setDescription('The new nickname (leave blank to reset)').setRequired(false)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return interaction.reply({ content: '❌ You lack the `Manage Nicknames` permission.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const nickname = interaction.options.getString('nickname') || null;
        const member = await interaction.guild.members.fetch(user.id);

        try {
            await member.setNickname(nickname);
            
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setDescription(`✅ Successfully changed **${user.tag}**'s nickname to **${nickname || 'Default'}**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: '🛡️ Moderation Log: Nickname Changed',
                color: '#5865F2',
                fields: [
                    { name: '👤 User', value: `${user.tag}`, inline: true },
                    { name: '📝 New Nickname', value: `\`${nickname || 'Reset'}\``, inline: true },
                    { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true }
                ],
                footer: 'DenClient Identity Management'
            });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to change nickname. Ensure bot role is higher than the user.', ephemeral: true });
        }
    }
};
