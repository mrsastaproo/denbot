const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove a timeout from a member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The member to unmute')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ 
                content: '❌ You lack the necessary permissions to execute this moderation action.', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) return interaction.reply({ content: '❌ Target user not found in the server.', ephemeral: true });
        if (!member.communicationDisabledUntilTimestamp) return interaction.reply({ content: 'ℹ️ This user is not currently timed out.', ephemeral: true });

        try {
            await member.timeout(null);
            
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setDescription(`✅ Successfully removed timeout for **${user.tag}**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        await logger.log(client, interaction.guild, {
            isMod: true,
            title: '🛡️ Moderation Log: Member Unmuted',
            color: '#57F287',
            thumbnail: user.displayAvatarURL(),
            fields: [
                { name: '👤 Target User', value: `${user.tag} (${user.id})`, inline: false },
                { name: '🙋‍♂️ Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: '🔊 Action', value: '`Timeout Removed`', inline: true },
                { name: '🕒 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            footer: 'DenClient Security Protocol • Disciplinary Action'
        });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: '❌ Failed to remove timeout from the member.', ephemeral: true });
        }
    }
};
