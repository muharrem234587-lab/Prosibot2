const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`ProsiBot aktif! Giriş yapılan bot: ${client.user.tag}`);
});

client.login('MTU1MDQ4MTQzMzc5MTgyMzk0Mw.GlQze9.EYbsxRDV93PIojtN8SDmRGsE4dynSJ9Ih7QgQs');
