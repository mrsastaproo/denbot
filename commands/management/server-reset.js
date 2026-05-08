const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-reset')
        .setDescription('ULTIMATE RESET: Strict permissions and professional layout')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;

        const warningEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🚀 ULTIMATE SERVER RECONSTRUCTION')
            .setDescription('Deploying strict permissions and high-level infrastructure...')
            .setTimestamp();

        await interaction.editReply({ embeds: [warningEmbed] });

        try {
            const channels = await guild.channels.fetch();
            for (const channel of channels.values()) {
                if (channel.id !== interaction.channelId) {
                    await channel.delete().catch(() => {});
                }
            }

            const readOnly = { id: guild.id, deny: [PermissionFlagsBits.SendMessages] };
            const hideAll = { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] };

            // A. HELP CENTER (Read Only)
            const helpCategory = await guild.channels.create({ name: '≪ HELP CENTER ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '🎫・tickets', type: ChannelType.GuildText, parent: helpCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '⭐・staff-application', type: ChannelType.GuildText, parent: helpCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '📙・faq', type: ChannelType.GuildText, parent: helpCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '🌐・translate', type: ChannelType.GuildText, parent: helpCategory, permissionOverwrites: [readOnly] });

            // B. OPEN TICKETS & APPLICATIONS
            await guild.channels.create({ name: 'open tickets', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: 'application tickets', type: ChannelType.GuildCategory });

            // C. INFO (Read Only)
            const infoCategory = await guild.channels.create({ name: '≪ INFO ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '📢・announcements', type: ChannelType.GuildText, parent: infoCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '👀・sneak-peek', type: ChannelType.GuildText, parent: infoCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '🆕・changelogs', type: ChannelType.GuildText, parent: infoCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '📜・terms-of-service', type: ChannelType.GuildText, parent: infoCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '🎩・staff', type: ChannelType.GuildText, parent: infoCategory, permissionOverwrites: [readOnly] });

            // D. STAFF (Private)
            const staffCategory = await guild.channels.create({ 
                name: '≪ STAFF ≫', 
                type: ChannelType.GuildCategory,
                permissionOverwrites: [hideAll]
            });
            await guild.channels.create({ name: '🔰・staff-chat', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '🔐・authenticator', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '📑・moderation-logs', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '🔎・analyzer-logs', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '📄・transcripts', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '🔊・staff-voice', type: ChannelType.GuildVoice, parent: staffCategory });

            // E. DOWNLOADS (Read Only)
            const downloadCategory = await guild.channels.create({ name: '≪ DOWNLOADS ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '🚀・launcher', type: ChannelType.GuildText, parent: downloadCategory, permissionOverwrites: [readOnly] });
            await guild.channels.create({ name: '👏・tutorials', type: ChannelType.GuildText, parent: downloadCategory, permissionOverwrites: [readOnly] });

            // F. GENERAL (Normal Access)
            const generalCategory = await guild.channels.create({ name: '≪ GENERAL ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '💬・chat-english', type: ChannelType.GuildText, parent: generalCategory });
            await guild.channels.create({ name: '❓・community-support', type: ChannelType.GuildText, parent: generalCategory });

            const finalChannel = await guild.channels.create({ name: '✅・infrastructure-restored', type: ChannelType.GuildText });
            await finalChannel.send('🛡️ **Ultimate Server Reconstruction Complete.** Permissions have been strictly enforced.');

            await interaction.channel.delete().catch(() => {});

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Error during restructuring. Ensure the bot has Administrator permissions.' });
        }
    }
};
