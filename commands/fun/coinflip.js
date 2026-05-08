const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin!'),

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const image = result === 'Heads' 
            ? 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/6Y3W5bI2s3n2a/giphy.gif' 
            : 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5YmR5JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/6Y3W5bI2s3n2a/giphy.gif'; // Coinflip gif

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🪙 Coin Flip')
            .setDescription(`The coin landed on... **${result}**!`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
