const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-remove')
        .setDescription('Remove a member from the current ticket')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.channel.name.includes('ticket-') && !interaction.channel.name.includes('app-')) {
            return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        await interaction.channel.permissionOverwrites.delete(user.id);

        await interaction.reply({ content: `✅ **${user.username}** has been removed from the ticket.` });
    }
};
