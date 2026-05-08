const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-overhaul')
        .setDescription('Transform the entire server into a professional premium layout')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;

        const overhaulEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🏗️ Server Overhaul in Progress...')
            .setDescription('Please wait while I restructure your server into a premium community. This may take a minute.')
            .setTimestamp();

        await interaction.editReply({ embeds: [overhaulEmbed] });

        try {
            // 1. HELP CENTER
            const helpCategory = await guild.channels.create({ name: '≪ HELP CENTER ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '🎫・tickets', type: ChannelType.GuildText, parent: helpCategory });
            await guild.channels.create({ name: '⭐・staff-application', type: ChannelType.GuildText, parent: helpCategory });
            await guild.channels.create({ name: '📙・faq', type: ChannelType.GuildText, parent: helpCategory });
            await guild.channels.create({ name: '🌐・translate', type: ChannelType.GuildText, parent: helpCategory });

            // 2. INFORMATION
            const infoCategory = await guild.channels.create({ name: '≪ INFO ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '📢・announcements', type: ChannelType.GuildText, parent: infoCategory, permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.SendMessages] }] });
            await guild.channels.create({ name: '👀・sneak-peek', type: ChannelType.GuildText, parent: infoCategory });
            await guild.channels.create({ name: '🎉・giveaways', type: ChannelType.GuildText, parent: infoCategory });
            await guild.channels.create({ name: '🆕・changelogs', type: ChannelType.GuildText, parent: infoCategory });
            await guild.channels.create({ name: '📜・terms-of-service', type: ChannelType.GuildText, parent: infoCategory });
            await guild.channels.create({ name: '📙・client-info', type: ChannelType.GuildText, parent: infoCategory });
            await guild.channels.create({ name: '🎩・staff', type: ChannelType.GuildText, parent: infoCategory });

            // 3. DOWNLOADS & SHOP
            const productCategory = await guild.channels.create({ name: '≪ PRODUCTS ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '🚀・launcher', type: ChannelType.GuildText, parent: productCategory });
            await guild.channels.create({ name: '💲・cosmetics-shop', type: ChannelType.GuildText, parent: productCategory });
            await guild.channels.create({ name: '🤝・partnerships', type: ChannelType.GuildText, parent: productCategory });
            await guild.channels.create({ name: '👏・tutorials', type: ChannelType.GuildText, parent: productCategory });

            // 4. GENERAL COMMUNITY
            const generalCategory = await guild.channels.create({ name: '≪ GENERAL ≫', type: ChannelType.GuildCategory });
            await guild.channels.create({ name: '💬・chat-english', type: ChannelType.GuildText, parent: generalCategory });
            await guild.channels.create({ name: '❓・community-support', type: ChannelType.GuildText, parent: generalCategory });
            await guild.channels.create({ name: '💭・more-chats', type: ChannelType.GuildText, parent: generalCategory });
            await guild.channels.create({ name: '📷・media', type: ChannelType.GuildText, parent: generalCategory });
            await guild.channels.create({ name: '💡・suggestions', type: ChannelType.GuildText, parent: generalCategory });

            // 5. STAFF AREA (Private)
            const staffCategory = await guild.channels.create({ 
                name: '≪ STAFF AREA ≫', 
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }
                ]
            });
            await guild.channels.create({ name: '🔰・staff-chat', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '🔐・private-chat', type: ChannelType.GuildText, parent: staffCategory });
            await guild.channels.create({ name: '📙・staff-guide', type: ChannelType.GuildText, parent: staffCategory });

            const successEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Overhaul Complete!')
                .setDescription('Your server has been successfully transformed into a professional Minecraft community layout.')
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ An error occurred during the overhaul. Please ensure the bot has Administrator permissions.' });
        }
    }
};
