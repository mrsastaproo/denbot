const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-rules')
        .setDescription('Deploy ultimate premium rules for DenClient')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const guild = interaction.guild;

        let rulesChannel = guild.channels.cache.find(c => c.name.toLowerCase().includes('rules') && c.type === 0);

        if (!rulesChannel) {
            const infoCategory = guild.channels.cache.find(c => c.name.includes('INFO') && c.type === 4);
            rulesChannel = await guild.channels.create({
                name: '📜・rules',
                type: 0,
                parent: infoCategory || null,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.SendMessages] }
                ]
            });
        }

        const rulesEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('📜 DenClient Official Community Rules')
            .setDescription('Welcome to the official **DenClient** community. By staying in this server, you agree to abide by the guidelines listed below. Ignorance of these rules is not an excuse.')
            .setImage('https://i.pinimg.com/originals/c9/22/68/c92268d9560f85f543167b5e4f208365.gif')
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
                { 
                    name: '🛡️ Section I: General Conduct', 
                    value: '• **Respect Everyone**: Toxicity, racism, or any form of harassment will result in an immediate ban.\n• **No NSFW Content**: Strictly no adult content, gore, or disturbing images/links.\n• **Account Safety**: You are responsible for your account. Do not share credentials.' 
                },
                { 
                    name: '⚔️ Section II: Client & Competitive Integrity', 
                    value: '• **No Cheating**: Usage of external unfair advantages or exploits is forbidden.\n• **Malicious Files**: Sharing viruses, malware, or IP-loggers will result in legal action and a permanent blacklist.\n• **Bug Reporting**: Found a bug? Report it in #tickets. Do not exploit it.' 
                },
                { 
                    name: '💬 Section III: Communication Guidelines', 
                    value: '• **Language Policy**: Speak English only in #chat-english. Use regional channels for other languages.\n• **No Spamming**: Do not mass ping staff, spam text walls, or use excessive caps.\n• **Advertising**: Strictly no self-promotion or DM advertising of other servers/clients.' 
                },
                { 
                    name: '🎩 Section IV: Staff & Authority', 
                    value: '• **Staff Decisions**: Staff have the final say in all matters. Do not argue with moderators.\n• **Honesty**: Providing false evidence or lying to staff will double your punishment.' 
                }
            )
            .setFooter({ text: 'DenClient Security • Building a safer PvP Community' })
            .setTimestamp();

        await rulesChannel.send({ embeds: [rulesEmbed] });
        await interaction.editReply({ content: `✅ Premium Rules have been deployed in <#${rulesChannel.id}>!` });
    }
};
