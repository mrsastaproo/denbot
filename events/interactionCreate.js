const { 
    ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const OWNER_ID = '1496085984297877514';
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({ content: '❌ Access Denied: Only the **Server Owner** can use DenClient commands.', ephemeral: true });
            }

            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    interaction.reply({ content: '❌ Command error detected.', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            const { customId, guild, user, channel, member } = interaction;

            // ---- CREATE TICKET ----
            if (customId === 'create_ticket') {
                const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
                if (existingChannel) return interaction.reply({ content: `⚠️ Active session already exists: ${existingChannel}`, ephemeral: true });

                try {
                    const categoryId = client.config.ticketCategory;
                    const staffRoleId = client.config.staffRole;

                    const newChannel = await guild.channels.create({
                        name: `ticket-${user.username}`,
                        type: ChannelType.GuildText,
                        parent: categoryId !== 'YOUR_TICKET_CATEGORY_ID' ? categoryId : null,
                        topic: `Support session for ${user.tag} (ID: ${user.id})`,
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                            { id: staffRoleId !== 'YOUR_STAFF_ROLE_ID' ? staffRoleId : guild.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                        ],
                    });

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('📩 Support Session Initialized')
                        .setDescription(`Greetings ${user},\n\nPlease wait for a staff member to claim this ticket. Provide all necessary details below.`)
                        .addFields(
                            { name: '👤 Requester', value: `${user.tag}`, inline: true },
                            { name: '🏷️ Status', value: '`Unclaimed`', inline: true }
                        )
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim Ticket').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('close_ticket_request').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
                    );

                    await newChannel.send({ content: `${user} | <@&${staffRoleId}>`, embeds: [welcomeEmbed], components: [row] });
                    await interaction.reply({ content: `✅ Ticket created: ${newChannel}`, ephemeral: true });

                    client.tickets.set(newChannel.id, { ownerId: user.id, createdAt: Date.now(), claimedBy: null });

                } catch (error) {
                    console.error(error);
                    interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true });
                }
            }

            // ---- CLAIM TICKET ----
            if (customId === 'claim_ticket') {
                const staffRoleId = client.config.staffRole;
                const isOwner = guild.ownerId === user.id;
                if (!member.roles.cache.has(staffRoleId) && !member.permissions.has('Administrator') && !isOwner) {
                    return interaction.reply({ content: '❌ Only authorized staff can claim tickets.', ephemeral: true });
                }

                const ticketData = client.tickets.get(channel.id);
                if (ticketData?.claimedBy) return interaction.reply({ content: '❌ This ticket is already claimed.', ephemeral: true });

                if (ticketData) ticketData.claimedBy = user.id;

                const originalEmbed = interaction.message.embeds[0];
                const updatedEmbed = EmbedBuilder.from(originalEmbed)
                    .spliceFields(1, 1, { name: '🏷️ Status', value: `\`Claimed by ${user.username}\``, inline: true })
                    .setColor('#57F287');

                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claimed').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('close_ticket_request').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });
                await channel.send({ content: `✅ **Ticket has been claimed by ${user}.**` });
            }

            // ---- CLOSE TICKET REQUEST (Modal) ----
            if (customId === 'close_ticket_request') {
                const modal = new ModalBuilder()
                    .setCustomId('ticket_close_modal')
                    .setTitle('Close Support Ticket');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Reason for closing')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Enter the resolution or reason for closing this ticket...')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
            }

            // ---- APPLY STAFF ----
            if (customId === 'apply_staff') {
                const modal = new ModalBuilder()
                    .setCustomId('staff_app_modal')
                    .setTitle('🛡️ Staff Recruitment Form');

                const q1 = new TextInputBuilder().setCustomId('staff_q1').setLabel('Age, Name, and Country').setStyle(TextInputStyle.Short).setRequired(true);
                const q2 = new TextInputBuilder().setCustomId('staff_q2').setLabel('Previous Experience?').setStyle(TextInputStyle.Paragraph).setRequired(true);
                const q3 = new TextInputBuilder().setCustomId('staff_q3').setLabel('Skills for the Team').setStyle(TextInputStyle.Paragraph).setRequired(true);
                const q4 = new TextInputBuilder().setCustomId('staff_q4').setLabel('Languages & Fluency').setStyle(TextInputStyle.Short).setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(q1),
                    new ActionRowBuilder().addComponents(q2),
                    new ActionRowBuilder().addComponents(q3),
                    new ActionRowBuilder().addComponents(q4)
                );

                await interaction.showModal(modal);
            }

        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'staff_app_modal') {
                const guild = interaction.guild;
                const user = interaction.user;
                const q1 = interaction.fields.getTextInputValue('staff_q1');
                const q2 = interaction.fields.getTextInputValue('staff_q2');
                const q3 = interaction.fields.getTextInputValue('staff_q3');
                const q4 = interaction.fields.getTextInputValue('staff_q4');

                await interaction.reply({ content: '⏳ **Processing your application...**', ephemeral: true });

                try {
                    const categoryId = client.config.staffAppCategory;
                    const staffRoleId = client.config.staffRole;

                    const newChannel = await guild.channels.create({
                        name: `apply-${user.username}`,
                        type: ChannelType.GuildText,
                        parent: categoryId,
                        topic: `Staff Application for ${user.tag}`,
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                            { id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                        ],
                    });

                    const appEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('📝 New Staff Application')
                        .setThumbnail(user.displayAvatarURL())
                        .addFields(
                            { name: '👤 Applicant', value: `${user.tag} (${user.id})` },
                            { name: '📌 Age, Name, Country', value: q1 },
                            { name: '💼 Experience', value: q2 },
                            { name: '🛠️ Skills', value: q3 },
                            { name: '🌐 Languages', value: q4 }
                        )
                        .setFooter({ text: 'DenClient Recruitment System' })
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('close_ticket_request').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger)
                    );

                    await newChannel.send({ content: `<@&${staffRoleId}> | New Application from ${user}`, embeds: [appEmbed], components: [row] });
                    await interaction.editReply({ content: `✅ **Application Submitted!** Your private channel: ${newChannel}` });

                } catch (error) {
                    console.error(error);
                    await interaction.editReply({ content: '❌ Failed to process application. Contact an administrator.' });
                }
            } else if (interaction.customId === 'ticket_close_modal') {
                const reason = interaction.fields.getTextInputValue('close_reason');
                const channel = interaction.channel;
                const ticketData = client.tickets.get(channel.id);
                const owner = await client.users.fetch(ticketData?.ownerId).catch(() => ({ tag: 'Unknown' }));
                const claimer = ticketData?.claimedBy ? await client.users.fetch(ticketData.claimedBy).catch(() => ({ tag: 'None' })) : { tag: 'None' };

                await interaction.reply({ content: '🔒 **Finalizing transcript and closing channel...**' });

                const logChannelId = client.config.ticketLogChannel || client.config.logChannel;
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const transcriptEmbed = new EmbedBuilder()
                            .setColor('#ED4245')
                            .setTitle('📄 Support Ticket Transcript')
                            .setThumbnail(owner.displayAvatarURL ? owner.displayAvatarURL() : null)
                            .addFields(
                                { name: '👤 Requester', value: `${owner.tag || owner.username} (${ticketData?.ownerId || 'N/A'})`, inline: false },
                                { name: '🙋‍♂️ Claimed By', value: `${claimer.tag || claimer.username || 'None'}`, inline: true },
                                { name: '🔒 Closed By', value: `${interaction.user.tag}`, inline: true },
                                { name: '📁 Channel', value: `${channel.name}`, inline: true },
                                { name: '🕒 Created At', value: `<t:${Math.floor(ticketData?.createdAt / 1000)}:F>`, inline: false },
                                { name: '📝 Resolution Reason', value: `\`\`\`${reason}\`\`\``, inline: false }
                            )
                            .setFooter({ text: 'DenClient Support System • Official Transcript' })
                            .setTimestamp();
                        
                        await logChannel.send({ embeds: [transcriptEmbed] });
                    }
                }

                setTimeout(() => channel.delete().catch(() => {}), 5000);
            }
        }
    }
};