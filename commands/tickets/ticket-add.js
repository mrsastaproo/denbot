const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-add')
        .setDescription('Add a member to the current ticket')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to add')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.channel.name.includes('ticket-') && !interaction.channel.name.includes('app-')) {
            return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        await interaction.channel.permissionOverwrites.create(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        await interaction.reply({ content: `✅ **${user.username}** has been added to the ticket.` });
    }
};
