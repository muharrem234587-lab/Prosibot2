const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Basit bir veritabanı simülasyonu (Kullanıcı XP ve Level bilgileri)
const levels = new Map();

client.once('ready', () => {
    console.log(`ProsiBot rank sistemi aktif! Giriş yapılan bot: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    // Botların mesajlarını yok say
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const key = `${message.guild.id}-${userId}`;

    // Kullanıcı sistemde kayıtlı değilse başlat
    if (!levels.has(key)) {
        levels.set(key, { xp: 0, level: 1 });
    }

    const userStats = levels.get(key);
    userStats.xp += 10; // Her mesajda 10 XP ekle

    // Level atlama eşiği (Her level için level * 100 XP gerekiyor)
    const neededXp = userStats.level * 100;

    if (userStats.xp >= neededXp) {
        userStats.level += 1;
        userStats.xp = 0; // XP'yi sıfırla veya bir sonraki levele aktar

        message.channel.chats || message.channel.send(`Tebrikler ${message.author}, seviye atladın! Yeni seviyen: **${userStats.level}** 🚀`);
    }

    // Basit bir komut: !rank veya !seviye yazınca kart gösterir
    if (message.content === '!rank' || message.content === '!seviye') {
        const rankEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${message.author.username} - Seviye Bilgisi`)
            .addFields(
                { name: 'Seviye', value: `${userStats.level}`, inline: true },
                { name: 'Mevcut XP', value: `${userStats.xp} / ${neededXp}`, inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [rankEmbed] });
    }
});

client.login('MTU1MDQ4MTQzMzc5MTgyMzk0Mw.GLSabp.fWJeAyp_6VYfVbDzrhBolesCUQcmO3VxVEkxPk');
