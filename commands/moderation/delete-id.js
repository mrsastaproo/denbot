const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-id')
        .setDescription('Delete a specific channel or an entire category by ID')
        .addStringOption(option => 
            option.setName('target_id')
                .setDescription('The ID of the channel or category to delete')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply({ content: '❌ This high-level command requires **Administrator** permissions.' });
        }

        const targetId = interaction.options.getString('target_id');
        const target = interaction.guild.channels.cache.get(targetId);

        if (!target) {
            return interaction.editReply({ content: '❌ Invalid ID. No channel or category found with this ID in this server.' });
        }

        try {
            const name = target.name;
            const type = target.type === ChannelType.GuildCategory ? 'Category' : 'Channel';
            const isCurrentChannelDeleted = (interaction.channel.id === targetId || (target.type === ChannelType.GuildCategory && interaction.channel.parentId === targetId));

            if (target.type === ChannelType.GuildCategory) {
                const children = interaction.guild.channels.cache.filter(c => c.parentId === targetId);
                for (const child of children.values()) {
                    await child.delete().catch(() => {});
                }
                await target.delete().catch(() => {});
            } else {
                await target.delete().catch(() => {});
            }

            if (!isCurrentChannelDeleted) {
                const embed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(`✅ Successfully deleted **${type}**: \`${name}\`.`)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] }).catch(() => {});
            }

            await logger.log(client, interaction.guild, {
                isMod: true,
                title: `🗑️ Moderation Log: ${type} Deleted`,
                color: '#ED4245',
                fields: [
                    { name: '📝 Name', value: `\`${name}\``, inline: true },
                    { name: '🆔 ID', value: `\`${targetId}\``, inline: true },
                    { name: '🙋‍♂️ Executor', value: `${interaction.user.tag}`, inline: true }
                ],
                footer: 'DenClient Critical Operation'
            });

        } catch (error) {
            console.error(error);
            try {
                await interaction.editReply({ content: '❌ Failed to delete target. Check bot permissions and hierarchy.' }).catch(() => {});
            } catch (e) {}
        }
    }
};
