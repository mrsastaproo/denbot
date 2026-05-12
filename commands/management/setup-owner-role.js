const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Using raw BigInt values to avoid undefined PermissionFlagsBits issues in this discord.js version
// Safe permissions: ViewChannel, SendMessages, EmbedLinks, AttachFiles, ReadMessageHistory,
// MentionEveryone, UseExternalEmojis, AddReactions, Connect, Speak, Stream, UseVAD,
// PrioritySpeaker, MuteMembers, DeafenMembers, MoveMembers, ManageMessages, ManageThreads,
// CreatePublicThreads, CreatePrivateThreads, SendMessagesInThreads
const SAFE_PERMISSIONS = 
    PermissionFlagsBits.ViewChannel |
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.MentionEveryone |
    PermissionFlagsBits.UseExternalEmojis |
    PermissionFlagsBits.AddReactions |
    PermissionFlagsBits.Connect |
    PermissionFlagsBits.Speak |
    PermissionFlagsBits.Stream |
    PermissionFlagsBits.UseVAD |
    PermissionFlagsBits.PrioritySpeaker |
    PermissionFlagsBits.MuteMembers |
    PermissionFlagsBits.DeafenMembers |
    PermissionFlagsBits.MoveMembers |
    PermissionFlagsBits.ManageMessages |
    PermissionFlagsBits.ManageThreads;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-owner-role')
        .setDescription('Configure the Owner Role with safe high-level permissions')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to configure (defaults to the set Owner Role)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const selectedRole = interaction.options.getRole('role');
        const OWNER_ROLE_ID = selectedRole ? selectedRole.id : '1501299141572300912';
        const role = interaction.guild.roles.cache.get(OWNER_ROLE_ID);

        if (!role) {
            return interaction.reply({ content: '❌ **Owner Role not found!** Please ensure the Role ID is correct or mention the role.', flags: 64 });
        }

        try {
            await role.setPermissions(SAFE_PERMISSIONS);

            const embed = new EmbedBuilder()
                .setColor('#EAB308')
                .setTitle('👑 Owner Role Configured')
                .setDescription(`Successfully updated permissions for <@&${OWNER_ROLE_ID}>.`)
                .addFields(
                    { name: '✅ Enabled', value: '> Manage Messages & Threads\n> Mute / Deafen / Move Members\n> Priority Speaker\n> All standard messaging & voice permissions', inline: false },
                    { name: '🚫 Blocked (Khatarnak)', value: '> Administrator\n> Manage Server / Channels / Roles\n> Kick / Ban Members\n> Manage Webhooks', inline: false }
                )
                .setFooter({ text: 'DenClient Security Protocol' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Role Update Error:', error);
            let msg = '❌ **Failed to update role permissions.**';
            if (error.code === 50013 || error.message?.includes('Missing Permissions')) {
                msg += '\n\n> Make sure the **DENCLIENT** bot role is placed **above** the role you want to edit in **Server Settings → Roles**.';
            } else {
                msg += `\n\n> Error: \`${error.message}\``;
            }
            await interaction.reply({ content: msg, flags: 64 });
        }
    }
};
