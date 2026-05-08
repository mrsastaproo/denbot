const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-panels')
        .setDescription('Deploy professional interactive panels')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('The type of panel to deploy')
                .setRequired(true)
                .addChoices(
                    { name: 'Support Tickets', value: 'tickets' },
                    { name: 'FAQ', value: 'faq' },
                    { name: 'Translation Info', value: 'translate' },
                    { name: 'Server Rules', value: 'rules' },
                    { name: 'Staff List', value: 'staff' },
                    { name: 'Boost Rewards', value: 'boost' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const type = interaction.options.getString('type');

        if (type === 'tickets') {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📩 DenClient Support Center')
                .setDescription('Need help? Our support team is available 24/7.\n\n**How to open a ticket:**\n1. Click the button below.\n2. State your issue clearly.\n3. Wait for a staff member to assist you.\n\n*Abusing tickets will result in a blacklist.*')
                .setImage('https://i.pinimg.com/originals/1f/26/22/1f262277f0a6d07c08794c489b099f64.gif')
                .setFooter({ text: 'DenClient Support System' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Open Ticket')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ Ticket panel deployed.', ephemeral: true });
        }

        if (type === 'faq') {
            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('❓ Frequently Asked Questions')
                .setDescription('Quick answers to common questions.')
                .addFields(
                    { name: '🚀 Where is the launcher?', value: 'Check #launcher for the latest download.' },
                    { name: '💎 How to get free capes?', value: 'Participate in giveaways or reach Level 10.' },
                    { name: '🛡️ How to apply for staff?', value: 'Go to #staff-application and follow the instructions.' }
                )
                .setThumbnail('https://i.pinimg.com/originals/c9/22/68/c92268d9560f85f543167b5e4f208365.gif')
                .setFooter({ text: 'DenClient Knowledge Base' })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ FAQ panel deployed.', ephemeral: true });
        }

        if (type === 'translate') {
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🌐 International Support')
                .setDescription('DenClient supports players from all around the world.')
                .addFields(
                    { name: '💬 English Only', value: 'Please use #chat-english for English conversations.' },
                    { name: '🤖 Translation Bot', value: 'React with a flag to translate any message.' }
                )
                .setFooter({ text: 'DenClient Global' })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ Translation info deployed.', ephemeral: true });
        }

        if (type === 'rules') {
            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('📜 DenClient Community Rules')
                .setDescription('Follow these rules to ensure a safe environment for everyone.')
                .addFields(
                    { name: '1️⃣ No Toxicity', value: 'Respect all members and staff.' },
                    { name: '2️⃣ No Cheating', value: 'Usage of unfair advantages is strictly prohibited.' },
                    { name: '3️⃣ No Advertising', value: 'Do not promote other servers or services.' }
                )
                .setImage('https://i.pinimg.com/originals/c9/22/68/c92268d9560f85f543167b5e4f208365.gif')
                .setFooter({ text: 'DenClient Terms of Service' })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ Rules panel deployed.', ephemeral: true });
        }

        if (type === 'staff') {
            await interaction.deferReply({ ephemeral: true });
            
            const staffEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎩 DenClient Official Team Directory')
                .setDescription('The professionals behind the scenes of DenClient.')
                .setThumbnail('https://i.pinimg.com/originals/0d/17/83/0d17838114f659e97e80980ba98f623a.gif')
                .setTimestamp();

            const roleGroups = {
                '👑 Project Lead': ['Owner'],
                '🏛️ Management': ['Manager', 'Admin', 'Ticket Manager'],
                '⚔️ Moderation Team': ['Lead Moderator', 'Senior Moderator', 'Moderator', 'Junior Moderator'],
                '💻 Development': ['Frontend Developer', 'Backend Developer'],
                '🎨 Creative Design': ['Model Designer', 'Designer'],
                '🤝 Support & Media': ['Media Manager', 'Support', 'Trial Support', 'Partner']
            };

            await interaction.guild.members.fetch();

            for (const [groupName, roles] of Object.entries(roleGroups)) {
                let membersString = '';
                for (const roleName of roles) {
                    const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
                    if (role) {
                        const members = role.members.map(m => `<@${m.id}>`).join(', ');
                        if (members) {
                            membersString += `**${role.name}**\n${members}\n`;
                        }
                    }
                }
                if (membersString) {
                    staffEmbed.addFields({ name: groupName, value: membersString, inline: false });
                }
            }

            if (!staffEmbed.data.fields?.some(f => f.name.includes('Project Lead'))) {
                staffEmbed.addFields({ name: '👑 Project Lead', value: '<@1496085984297877514>', inline: false });
            }

            await interaction.channel.send({ embeds: [staffEmbed] });
            return interaction.editReply({ content: '✅ Staff List has been generated!' });
        }

        if (type === 'boost') {
            await interaction.deferReply({ ephemeral: true });
            const guild = interaction.guild;

            // Strict search to avoid 'boost-logs'
            let boostChannel = guild.channels.cache.find(c => 
                (c.name.toLowerCase() === 'boost-rewards' || c.name.includes('boost-rewards')) && 
                !c.name.includes('logs') && 
                c.type === 0
            );

            if (!boostChannel) {
                const rewardCategory = await guild.channels.create({ name: '≪ REWARDS ≫', type: 4 });
                boostChannel = await guild.channels.create({
                    name: '💎・boost-rewards',
                    type: 0,
                    parent: rewardCategory.id,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.SendMessages] }
                    ]
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF73FA')
                .setTitle('🚀 DenClient Nitro Boost Rewards')
                .setDescription('Help us grow by boosting the server and unlock exclusive premium perks in Discord and within the DenClient itself!')
                .setImage('https://i.pinimg.com/originals/c9/22/68/c92268d9560f85f543167b5e4f208365.gif')
                .addFields(
                    { 
                        name: '✨ Level 1 (1 Boost)', 
                        value: '• **💎 Booster Rank**: Stand out with a premium role.\n• **✨ Client Cosmetics**: Access to 10+ exclusive capes and wings.\n• **🎨 Custom Tag**: A special `[BOOSTER]` tag in client chat.\n• **🚀 Boost Badge**: Dedicated badge next to your name in-client.' 
                    },
                    { 
                        name: '🔥 Level 2 (2 Boosts)', 
                        value: '• **🔱 Elite Booster Rank**: A high-prestige role for top supporters.\n• **🎭 Animated Cosmetics**: Access to rare animated capes and aura effects.\n• **⚙️ Premium Features**: Early access to beta builds and experimental client features.\n• **💎 Custom Badge**: A personalized elite badge displayed in-client.' 
                    }
                )
                .setFooter({ text: 'DenClient Community Support' })
                .setTimestamp();

            await boostChannel.send({ embeds: [embed] });
            return interaction.editReply({ content: `✅ Boost Rewards panel deployed in <#${boostChannel.id}>!` });
        }
    }
};
