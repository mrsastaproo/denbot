const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-creator-apply')
        .setDescription('Send the public Creator Partnership application panel to this channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor('#EAB308')
            .setTitle('🤝 Partner with DenClient')
            .setAuthor({ name: 'DenClient Creator Partnerships', iconURL: client.user.displayAvatarURL() })
            .setDescription(
                '### 🎬 Showcase DenClient to your Audience!\n\n' +
                'Are you a **YouTuber, Streamer, or Content Creator**? Do you want to collaborate with **DenClient** and promote our features to your fans? ' +
                'We are looking for passionate creators to join our official partner program.\n\n' +
                '**Perks of Partnering:**\n' +
                '> 💎 Exclusive **Partner** role & badge\n' +
                '> 🚀 Priority support & early access to updates\n' +
                '> 💰 Potential for paid promotions or revenue share\n' +
                '> 📢 Shoutouts on our official social media\n\n' +
                '**How to join:**\n' +
                'Hit the button below to submit your channel details. Our management team will review your stats and open a private deal channel to discuss the collaboration!'
            )
            .addFields(
                { 
                    name: '📋 Partnership Requirements:', 
                    value: '> Your channel link & subscriber count\n> Your average views per video\n> Expected views for a DenClient showcase\n> Your preferred deal (Paid/Barter/Rev-Share)', 
                    inline: false 
                },
                { 
                    name: '🕒 Review Process', 
                    value: '> We review applications within **24–48 hours**.\n> Please ensure your DMs are open.', 
                    inline: false 
                }
            )
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://images-ext-1.discordapp.net/external/VBvMBKHJaicCXrZPXtGs8PvJnG_vEbOATR0YQ49ZRLI/https/i.pinimg.com/originals/0d/17/83/0d17838114f659e97e80980ba98f623a.gif')
            .setFooter({ 
                text: 'DenClient  •  Official Creator Partnership Program', 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('creator_apply_button')
                .setLabel('Apply as Creator')
                .setEmoji('🎬')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setLabel('Learn More')
                .setEmoji('🌐')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/denclient') // Update this URL if needed
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Creator application panel has been posted!', flags: 64 });
    }
};
