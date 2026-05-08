const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-config')
        .setDescription('Generate the .env configuration block for the current server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guild = interaction.guild;
        
        // Find channels by name for the config
        const findChannel = (name) => guild.channels.cache.find(c => c.name.includes(name));

        const config = {
            LOG_CHANNEL_ID: findChannel('moderation-logs')?.id || 'NOT_FOUND',
            TICKET_LOG_CHANNEL_ID: findChannel('transcripts')?.id || 'NOT_FOUND',
            MOD_LOG_CHANNEL_ID: findChannel('moderation-logs')?.id || 'NOT_FOUND',
            STRICT_LOG_CHANNEL_ID: findChannel('analyzer-logs')?.id || 'NOT_FOUND',
            TICKET_CATEGORY_ID: guild.channels.cache.find(c => c.name.toLowerCase() === 'open tickets')?.id || 'NOT_FOUND',
            WELCOME_CHANNEL_ID: findChannel('welcome')?.id || 'NOT_FOUND',
            STAFF_APP_CATEGORY_ID: guild.channels.cache.find(c => c.name.toLowerCase() === 'application tickets')?.id || 'NOT_FOUND',
            AUTO_ROLE_ID: guild.roles.cache.find(r => r.name.toLowerCase().includes('member'))?.id || 'NOT_FOUND',
            STAFF_ROLE_ID: guild.roles.cache.find(r => r.name.toLowerCase().includes('staff'))?.id || 'NOT_FOUND'
        };

        const configString = [
            `LOG_CHANNEL_ID=${config.LOG_CHANNEL_ID}`,
            `TICKET_LOG_CHANNEL_ID=${config.TICKET_LOG_CHANNEL_ID}`,
            `MOD_LOG_CHANNEL_ID=${config.MOD_LOG_CHANNEL_ID}`,
            `STRICT_LOG_CHANNEL_ID=${config.STRICT_LOG_CHANNEL_ID}`,
            `AUTO_ROLE_ID=${config.AUTO_ROLE_ID}`,
            `TICKET_CATEGORY_ID=${config.TICKET_CATEGORY_ID}`,
            `STAFF_ROLE_ID=${config.STAFF_ROLE_ID}`,
            `WELCOME_CHANNEL_ID=${config.WELCOME_CHANNEL_ID}`,
            `STAFF_APP_CATEGORY_ID=${config.STAFF_APP_CATEGORY_ID}`
        ].join('\n');

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📄 DenClient .env Configuration')
            .setDescription('Copy the block below and paste it into your `.env` file to update your bot\'s configuration.')
            .addFields({ name: 'Config Block', value: `\`\`\`env\n${configString}\n\`\`\`` })
            .setFooter({ text: 'DenClient System Utilities' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
