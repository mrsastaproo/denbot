const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-rename')
        .setDescription('Rename the current ticket channel')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The new name for the ticket')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.channel.name.includes('ticket-') && !interaction.channel.name.includes('app-')) {
            return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
        }

        const newName = interaction.options.getString('name');
        await interaction.channel.setName(`ticket-${newName}`);
        
        await interaction.reply({ content: `✅ Ticket renamed to **ticket-${newName}**` });
    }
};
