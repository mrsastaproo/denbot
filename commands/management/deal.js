const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deal')
        .setDescription('Create a private creator deal channel with a premium requirements form')
        .addUserOption(option =>
            option.setName('creator')
                .setDescription('The creator/YouTuber to send the form to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const creator = interaction.options.getUser('creator');
        const guild = interaction.guild;
        const staffRoleId = client.config?.staffRole;
        const OWNER_ROLE_ID = '1501299141572300912';

        await interaction.deferReply({ flags: 64 });

        // ── 1. Create a private deal channel ──────────────────────────────────
        let dealChannel;
        try {
            dealChannel = await guild.channels.create({
                name: `💼│deal-${creator.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                topic: `🤝 Creator Deal Negotiation | ${creator.tag} (${creator.id})`,
                permissionOverwrites: [
                    // Hide from everyone
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    // Creator can view & send
                    { 
                        id: creator.id, 
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },
                    // Owner role can fully manage it
                    { 
                        id: OWNER_ROLE_ID, 
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.EmbedLinks
                        ] 
                    },
                    // Staff role (if configured)
                    ...(staffRoleId && staffRoleId !== 'YOUR_STAFF_ROLE_ID' ? [{
                        id: staffRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }] : [])
                ]
            });
        } catch (err) {
            console.error('Deal channel creation error:', err);
            return interaction.editReply({ content: '❌ Failed to create the deal channel. Check my permissions.' });
        }

        // ── 2. Send the premium embed into the new channel ────────────────────
        const embed = new EmbedBuilder()
            .setColor('#EAB308')
            .setTitle('👑 Creator Partnership Program')
            .setAuthor({ name: 'DenClient Business', iconURL: client.user.displayAvatarURL() })
            .setDescription(
                `Hey ${creator}! 👋\n\n` +
                `We're interested in collaborating with you for a **DenClient** promotion. ` +
                `Before we finalise the deal, we need some information from you.\n\n` +
                `**Please fill in the form below — it takes less than 2 minutes. ✅**\n\n` +
                `> 📺 **Channel Metrics** — name, link & subscriber count\n` +
                `> 📧 **Contact Info** — business email & socials\n` +
                `> 📊 **View Stats** — avg views & views you can promise us\n` +
                `> 💰 **Deal Pricing** — your rate & preferred payment method\n` +
                `> 📝 **Video Details** — topic you'll cover & any specific requirements`
            )
            .addFields(
                { 
                    name: '✨ Why Partner with DenClient?', 
                    value: '> Access to an exclusive audience of Minecraft players\n> Priority placement, shoutouts & revenue share opportunities\n> Premium creator badge in our Discord', 
                    inline: false 
                },
                { 
                    name: '⚠️ Important', 
                    value: '> All information must be accurate & verifiable.\n> Inflated stats = **immediate disqualification**.', 
                    inline: false 
                }
            )
            .setThumbnail(creator.displayAvatarURL({ size: 256 }))
            .setFooter({ 
                text: `DenClient Premium Partnerships  •  Opened by ${interaction.user.tag}`, 
                iconURL: guild.iconURL() 
            })
            .setTimestamp();

        // Three premium-looking buttons in a row
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('deal_req_button')
                .setLabel('Fill Requirements Form')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('close_ticket_request')
                .setLabel('Close Deal')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );

        await dealChannel.send({
            content: `${creator} | <@&${OWNER_ROLE_ID}>`,
            embeds: [embed],
            components: [row]
        });

        // ── 3. Store in tickets map so close works ─────────────────────────────
        client.tickets?.set(dealChannel.id, {
            ownerId: creator.id,
            createdAt: Date.now(),
            claimedBy: null
        });

        // ── 4. Confirm to the command invoker ──────────────────────────────────
        await interaction.editReply({ 
            content: `✅ Deal channel created: ${dealChannel}\n> ${creator} has been invited and can now fill in their partnership form.`
        });
    }
};
