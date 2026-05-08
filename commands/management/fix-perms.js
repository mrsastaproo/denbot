const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fix-perms')
        .setDescription('Fix channel permissions without deleting anything')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const guild = interaction.guild;

        const readOnly = { id: guild.id, deny: [PermissionFlagsBits.SendMessages] };
        const hideAll = { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] };

        const readOnlyChannels = [
            'tickets', 'staff-application', 'faq', 'translate', 
            'announcements', 'sneak-peek', 'changelogs', 'terms-of-service', 
            'staff', 'launcher', 'tutorials', 'badges', 'rules'
        ];

        const privateCategories = ['STAFF', 'TICKETS', 'APPLICATIONS'];

        let fixedCount = 0;

        try {
            const channels = await guild.channels.fetch();
            
            for (const channel of channels.values()) {
                // Fix Read-Only Channels
                if (readOnlyChannels.some(name => channel.name.includes(name))) {
                    await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
                    fixedCount++;
                }

                // Fix Private Categories
                if (privateCategories.some(name => channel.name.toUpperCase().includes(name)) && channel.type === 4) {
                    await channel.permissionOverwrites.edit(guild.id, { ViewChannel: false });
                    fixedCount++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Permissions Fixed')
                .setDescription(`Successfully updated permissions for **${fixedCount}** channels/categories.\n\n- Essential channels are now Read-Only.\n- Staff areas are now Hidden.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Error fixing permissions. Check bot hierarchy.' });
        }
    }
};
