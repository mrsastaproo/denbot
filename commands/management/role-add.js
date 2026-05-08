const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role-add')
        .setDescription('Add a role to a member')
        .addUserOption(option => option.setName('user').setDescription('The user to give the role to').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role to add').setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: '❌ You lack the `Manage Roles` permission.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(user.id);

        try {
            await member.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setDescription(`✅ Successfully added the role **${role.name}** to **${user.tag}**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: '🛡️ Moderation Log: Role Added',
                color: '#5865F2',
                fields: [
                    { name: '👤 User', value: `${user.tag}`, inline: true },
                    { name: '🏷️ Role', value: `${role}`, inline: true },
                    { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true }
                ],
                footer: 'DenClient Role Management'
            });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to add role. Ensure bot role is higher than the target role.', ephemeral: true });
        }
    }
};
