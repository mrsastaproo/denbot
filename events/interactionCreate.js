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
            const OWNER_ROLE_ID = '1501299141572300912';

            const hasPermission = interaction.user.id === OWNER_ID || interaction.member.roles.cache.has(OWNER_ROLE_ID);

            if (!hasPermission) {
                return interaction.reply({ content: '❌ Access Denied: Only the **Server Owner** or authorized **Management** can use DenClient commands.', ephemeral: true });
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
                if (existingChannel) return interaction.reply({ content: '⚠️ Active session already exists: ' + existingChannel, ephemeral: true });

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
                    await interaction.reply({ content: '✅ Ticket created: ' + newChannel, ephemeral: true });

                    client.tickets.set(newChannel.id, { ownerId: user.id, createdAt: Date.now(), claimedBy: null });

                } catch (error) {
                    console.error(error);
                    interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true });
                }
            }

            // ---- CLAIM TICKET ----
            if (customId === 'claim_ticket') {
                const staffRoleId = client.config.staffRole;
                const ownerRoleId = '1501299141572300912';
                const isOwner = guild.ownerId === user.id || member.roles.cache.has(ownerRoleId);

                if (!member.roles.cache.has(staffRoleId) && !member.permissions.has('Administrator') && !isOwner) {
                    return interaction.reply({ content: '❌ Only authorized staff or management can claim tickets.', ephemeral: true });
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
                await channel.send({ content: '✅ **Ticket has been claimed by ' + user + '.**' });
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

            // ---- DEAL REQUIREMENTS BUTTON ----
            if (customId === 'deal_req_button') {
                const modal = new ModalBuilder()
                    .setCustomId('deal_req_modal')
                    .setTitle('📊 Creator Partnership Form');

                const channelInfo = new TextInputBuilder()
                    .setCustomId('deal_channel')
                    .setLabel('Channel Name & Link')
                    .setPlaceholder('e.g. DenClient - youtube.com/@denclient')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const contactInfo = new TextInputBuilder()
                    .setCustomId('deal_contact')
                    .setLabel('Email & Discord/Socials')
                    .setPlaceholder('e.g. business@denclient.team | Discord: den_owner')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const viewStats = new TextInputBuilder()
                    .setCustomId('deal_stats')
                    .setLabel('Avg Views & Promised Views')
                    .setPlaceholder('e.g. Avg: 10k | Promised: 25k+')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const dealPrice = new TextInputBuilder()
                    .setCustomId('deal_price')
                    .setLabel('Deal Price & Payment Method')
                    .setPlaceholder('e.g. $100 via Crypto/PayPal')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const additionalInfo = new TextInputBuilder()
                    .setCustomId('deal_extra')
                    .setLabel('Video Topic & Requirements')
                    .setPlaceholder('What will you cover in the video? Any specific needs?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(channelInfo),
                    new ActionRowBuilder().addComponents(contactInfo),
                    new ActionRowBuilder().addComponents(viewStats),
                    new ActionRowBuilder().addComponents(dealPrice),
                    new ActionRowBuilder().addComponents(additionalInfo)
                );

                await interaction.showModal(modal);
            }

            // ---- CREATOR APPLY BUTTON (public panel self-apply) ----
            if (customId === 'creator_apply_button') {
                const modal = new ModalBuilder()
                    .setCustomId('creator_apply_modal')
                    .setTitle('🤝 Partnership Application');

                const channelInfo = new TextInputBuilder()
                    .setCustomId('ca_channel')
                    .setLabel('Channel Link & Subscribers')
                    .setPlaceholder('e.g. youtube.com/@mychannel - 10k Subs')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const contactInfo = new TextInputBuilder()
                    .setCustomId('ca_contact')
                    .setLabel('Discord & Email')
                    .setPlaceholder('e.g. MyUser#1234 | business@email.com')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const viewStats = new TextInputBuilder()
                    .setCustomId('ca_stats')
                    .setLabel('Average & Expected Views')
                    .setPlaceholder('e.g. Avg: 5k | Expected for DenClient: 8k+')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const dealPrice = new TextInputBuilder()
                    .setCustomId('ca_price')
                    .setLabel('Proposed Deal (Paid/Barter/Rev-Share)')
                    .setPlaceholder('What are you looking for in return?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const videoDetails = new TextInputBuilder()
                    .setCustomId('ca_details')
                    .setLabel('Your Promotion Strategy')
                    .setPlaceholder('How will you showcase DenClient to your audience?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(channelInfo),
                    new ActionRowBuilder().addComponents(contactInfo),
                    new ActionRowBuilder().addComponents(viewStats),
                    new ActionRowBuilder().addComponents(dealPrice),
                    new ActionRowBuilder().addComponents(videoDetails)
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
                    await interaction.editReply({ content: '✅ **Application Submitted!** Your private channel: ' + newChannel });

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
                                { name: '📌 Channel', value: `${channel.name}`, inline: true },
                                { name: '🕑 Created At', value: `<t:${Math.floor(ticketData?.createdAt / 1000)}:F>`, inline: false },
                                { name: '📌 Resolution Reason', value: `\`\`\`${reason}\`\`\``, inline: false }
                            )
                            .setFooter({ text: 'DenClient Support System • Official Transcript' })
                            .setTimestamp();
                        
                        await logChannel.send({ embeds: [transcriptEmbed] });
                    }
                }

                setTimeout(() => channel.delete().catch(() => {}), 5000);
            } else if (interaction.customId === 'deal_req_modal') {
                const channelInfo = interaction.fields.getTextInputValue('deal_channel');
                const contact = interaction.fields.getTextInputValue('deal_contact');
                const stats = interaction.fields.getTextInputValue('deal_stats');
                const price = interaction.fields.getTextInputValue('deal_price');
                const extra = interaction.fields.getTextInputValue('deal_extra');

                const responseEmbed = new EmbedBuilder()
                    .setColor('#EAB308')
                    .setTitle('🚀 New Partnership Proposal')
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setThumbnail(interaction.guild.iconURL())
                    .setDescription('A creator has just submitted a high-value partnership proposal for review.')
                    .addFields(
                        { name: '📺 Channel Information', value: `\`\`\`${channelInfo}\`\`\``, inline: false },
                        { name: '📧 Contact Details', value: `\`${contact}\``, inline: true },
                        { name: '💰 Commercials', value: `\`${price}\``, inline: true },
                        { name: '📊 Metrics & Reach', value: `\`${stats}\``, inline: false },
                        { name: '📝 Additional Details', value: `\`\`\`${extra}\`\`\``, inline: false }
                    )
                    .setFooter({ text: 'DenClient Business Verification • ID: ' + interaction.user.id.slice(-6).toUpperCase(), iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ 
                    content: '✨ **Application Received!** Your professional proposal has been securely logged for management review.', 
                    embeds: [responseEmbed] 
                });

                const logChannelId = client.config.logChannel;
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send({ 
                            content: `🔔 **New Deal Requirements** from ${interaction.user}`, 
                            embeds: [responseEmbed] 
                        });
                    }
                }
            } else if (interaction.customId === 'creator_apply_modal') {
                const caChannel = interaction.fields.getTextInputValue('ca_channel');
                const caContact = interaction.fields.getTextInputValue('ca_contact');
                const caStats = interaction.fields.getTextInputValue('ca_stats');
                const caPrice = interaction.fields.getTextInputValue('ca_price');
                const caDetails = interaction.fields.getTextInputValue('ca_details');
                const user = interaction.user;
                const guild = interaction.guild;
                const OWNER_ROLE_ID = '1501299141572300912';
                const staffRoleId = client.config?.staffRole;

                await interaction.reply({ content: '⏳ **Processing your application...**', flags: 64 });

                try {
                    const dealChannel = await guild.channels.create({
                        name: `deal-${user.username.toLowerCase()}`,
                        type: ChannelType.GuildText,
                        topic: `Creator Application | ${user.tag} (${user.id})`,
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                            { id: OWNER_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages] },
                            ...(staffRoleId && staffRoleId !== 'YOUR_STAFF_ROLE_ID' ? [{ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }] : [])
                        ]
                    });

                    const appEmbed = new EmbedBuilder()
                        .setColor('#EAB308')
                        .setTitle('🤝 New Partnership Application')
                        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                        .setThumbnail(user.displayAvatarURL({ size: 256 }))
                        .setDescription(`${user} wants to partner with DenClient and promote us!`)
                        .addFields(
                            { name: '📺 Channel & Subscribers', value: '```' + caChannel + '```', inline: false },
                            { name: '📧 Contact info', value: '`' + caContact + '`', inline: true },
                            { name: '💰 Expected Deal', value: '`' + caPrice + '`', inline: true },
                            { name: '📊 View Statistics', value: '`' + caStats + '`', inline: false },
                            { name: '📝 Promotion Strategy', value: '```' + caDetails + '```', inline: false }
                        )
                        .setFooter({ text: `DenClient Partner Program - ID: ${user.id.slice(-6).toUpperCase()}`, iconURL: client.user.displayAvatarURL() })
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Accept & Claim').setStyle(ButtonStyle.Success).setEmoji('✅'),
                        new ButtonBuilder().setCustomId('close_ticket_request').setLabel('Reject & Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                    );

                    await dealChannel.send({ content: `${user} | <@&${OWNER_ROLE_ID}>`, embeds: [appEmbed], components: [row] });
                    client.tickets?.set(dealChannel.id, { ownerId: user.id, createdAt: Date.now(), claimedBy: null });
                    await interaction.editReply({ content: `✅ **Application submitted!** Our team will review it in ${dealChannel}.` });

                } catch (error) {
                    console.error('Creator apply error:', error);
                    await interaction.editReply({ content: '❌ Something went wrong. Please contact staff.' });
                }
            } else if (interaction.customId.startsWith('broadcast_modal_')) {
                const channelId = interaction.customId.replace('broadcast_modal_', '');
                const targetChannel = interaction.guild.channels.cache.get(channelId);
                
                const title = interaction.fields.getTextInputValue('bc_title');
                const desc = interaction.fields.getTextInputValue('bc_desc');
                const color = interaction.fields.getTextInputValue('bc_color') || '#EAB308';
                const image = interaction.fields.getTextInputValue('bc_image');
                const footer = interaction.fields.getTextInputValue('bc_footer') || 'DenClient • Official Communication';

                if (!targetChannel) return interaction.reply({ content: '❌ Target channel not found.', ephemeral: true });

                const broadcastEmbed = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(desc)
                    .setColor(color.startsWith('#') ? color : '#EAB308')
                    .setAuthor({ name: 'DenClient Management', iconURL: interaction.guild.iconURL() })
                    .setFooter({ text: footer, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                if (image && image.startsWith('http')) {
                    broadcastEmbed.setImage(image);
                }

                try {
                    await targetChannel.send({ embeds: [broadcastEmbed] });
                    await interaction.reply({ content: `✅ **Success!** Premium broadcast has been sent to ${targetChannel}.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Failed to send broadcast. Check my permissions in that channel.', ephemeral: true });
                }
            }
        }
    }
};
