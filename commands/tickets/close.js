const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('Finalize and close the current support ticket')
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for closing this ticket')
                .setRequired(true)),

    async execute(interaction, client) {
        const staffRoleId = client.config.staffRole;
        const isStaff = interaction.member.roles.cache.has(staffRoleId);
        const isAdmin = interaction.member.permissions.has('Administrator');
        const isOwner = interaction.guild.ownerId === interaction.user.id;
        const isTicketChannel = interaction.channel.name.startsWith('ticket-');

        if (!isTicketChannel) {
            return interaction.reply({ content: '❌ This command can only be executed within an active ticket channel.', ephemeral: true });
        }

        if (!isStaff && !isAdmin && !isOwner && !interaction.channel.topic?.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ You do not have the required permissions to close this support ticket.', ephemeral: true });
        }

        const reason = interaction.options.getString('reason');
        const ticketData = client.tickets.get(interaction.channel.id);
        const owner = ticketData ? await client.users.fetch(ticketData.ownerId).catch(() => ({ tag: 'Unknown' })) : { tag: 'Unknown' };
        const claimer = ticketData?.claimedBy ? await client.users.fetch(ticketData.claimedBy).catch(() => ({ tag: 'None' })) : { tag: 'None' };

        const closeEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🔒 Ticket Finalization')
            .setDescription('This support session is now complete. This channel will be permanently deleted in **5 seconds**.')
            .setTimestamp();

        await interaction.reply({ embeds: [closeEmbed] });

        // Professional Transcript Log
        const logChannelId = client.config.ticketLogChannel || client.config.logChannel;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const transcriptEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('📄 Support Ticket Transcript (Command)')
                    .setThumbnail(owner.displayAvatarURL ? owner.displayAvatarURL() : null)
                    .addFields(
                        { name: '👤 Requester', value: `${owner.tag || 'N/A'} (${ticketData?.ownerId || 'N/A'})`, inline: false },
                        { name: '🙋‍♂️ Claimed By', value: `${claimer.tag || 'None'}`, inline: true },
                        { name: '🔒 Closed By', value: `${interaction.user.tag}`, inline: true },
                        { name: '📝 Resolution Reason', value: `\`\`\`${reason}\`\`\``, inline: false }
                    )
                    .setFooter({ text: 'DenClient Support System • Official Transcript' })
                    .setTimestamp();
                
                await logChannel.send({ embeds: [transcriptEmbed] });
            }
        }

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
};
