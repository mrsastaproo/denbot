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
            .setTitle('🎬 Want us to make a video for you?')
            .setAuthor({ name: 'DenClient Business Partnerships', iconURL: client.user.displayAvatarURL() })
            .setDescription(
                '### 📣 Calling All Creators!\n\n' +
                'Are you a **YouTuber, Streamer, or Content Creator** looking for a high-quality Minecraft video? ' +
                '**DenClient** offers premium promotional video services tailored to your audience.\n\n' +
                '**What we offer:**\n' +
                '> 🎮 Professional Minecraft content creation\n' +
                '> 📈 Targeted reach to the right gaming audience\n' +
                '> 🤝 Flexible deals — barter, paid, or revenue-share\n' +
                '> ⚡ Fast turnaround & clear communication\n\n' +
                '**To get started, hit the button below.** Our team will review your application and open a private deal channel just for you!'
            )
            .addFields(
                { 
                    name: '📋 What you\'ll need to provide:', 
                    value: '> Your channel link & subscriber count\n> Email / Discord for contact\n> Average & expected views\n> Your proposed deal price\n> Video topic & requirements', 
                    inline: false 
                },
                { 
                    name: '⏱️ Response Time', 
                    value: '> We typically respond within **24–48 hours**.\n> Incomplete or fake info will be **automatically rejected**.', 
                    inline: false 
                }
            )
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://images-ext-1.discordapp.net/external/VBvMBKHJaicCXrZPXtGs8PvJnG_vEbOATR0YQ49ZRLI/https/i.pinimg.com/originals/0d/17/83/0d17838114f659e97e80980ba98f623a.gif')
            .setFooter({ 
                text: 'DenClient  •  Premium Content Creator Program', 
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
