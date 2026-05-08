const { EmbedBuilder } = require('discord.js');

module.exports = {
    async log(client, guild, options) {
        // Determine the correct log channel
        let logChannelId = client.config.logChannel;
        
        // If it's a moderation action, use modLogChannel
        if (options.isMod) {
            logChannelId = client.config.modLogChannel || logChannelId;
        }

        // If it's a strict violation, use strictLogChannel
        if (options.isStrict) {
            logChannelId = client.config.strictLogChannel || logChannelId;
        }

        if (!logChannelId || logChannelId === 'YOUR_LOG_CHANNEL_ID') return;

        const channel = guild.channels.cache.get(logChannelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(options.color || '#2F3136')
            .setTitle(options.title || 'System Notification')
            .setDescription(options.description || 'No details provided.')
            .setTimestamp();

        if (options.fields) embed.addFields(options.fields);
        if (options.footer) embed.setFooter({ text: options.footer });
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Logging error:', error);
        }
    }
};
