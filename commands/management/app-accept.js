const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('app-accept')
        .setDescription('Professionally accept a staff application')
        .addUserOption(option => option.setName('user').setDescription('The applicant to accept').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('Additional notes for the applicant').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const note = interaction.options.getString('note') || 'Your profile and skills align perfectly with our team requirements.';

        const acceptEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('🎉 Application Accepted!')
            .setDescription(`Congratulations ${user}! Your application for the **Staff Team** has been officially **Accepted**.`)
            .addFields(
                { name: '📋 Next Steps', value: 'Please wait for a Senior Staff member to contact you for your onboarding and training session.' },
                { name: '📝 Note from Management', value: `\`\`\`${note}\`\`\`` }
            )
            .setThumbnail(user.displayAvatarURL())
            .setImage('https://i.pinimg.com/originals/c5/ba/ca/c5baca196426477c7700203f57f683f1.gif')
            .setFooter({ text: 'DenClient Recruitment Board • Official Decision' })
            .setTimestamp();

        await interaction.reply({ content: `${user}`, embeds: [acceptEmbed] });
    }
};
