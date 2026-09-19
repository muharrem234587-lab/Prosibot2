const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // Ses kanallarını takip etmek için
    ]
});

// Veritabanı simülasyonu
const levels = new Map();
const voiceTimeouts = new Map();

client.once('ready', () => {
    console.log(`ProsiBot stabil rank sistemi aktif! Giriş yapılan bot: ${client.user.tag}`);
});

// 1. MESAJ YAZARAK XP KAZANMA VE KOMUTLAR
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;

    if (!levels.has(key)) {
        levels.set(key, { xp: 0, level: 1 });
    }

    const userStats = levels.get(key);
    userStats.xp += 10; // Her mesajda 10 XP
    const neededXp = userStats.level * 100;

    if (userStats.xp >= neededXp) {
        userStats.level += 1;
        userStats.xp = 0;
        message.channel.send(`🎉 Tebrikler ${message.author}, seviye atladın! Yeni seviyen: **${userStats.level}**! 🏆`);
    }

    // --- !rank VEYA !seviye KOMUTU ---
    if (message.content === '!rank' || message.content === '!seviye') {
        const stats = levels.get(key);
        const neededXpNext = stats.level * 100;

        // Yüzdelik ilerleme çubuğu hesaplama
        const percentage = Math.min(Math.max(stats.xp / neededXpNext, 0), 1);
        const progressBars = Math.round(percentage * 10);
        const emptyBars = 10 - progressBars;
        const progressBarString = '█'.repeat(progressBars) + '░'.repeat(emptyBars);

        const rankEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: `${message.author.username} - Seviye Bilgisi`, iconURL: message.author.displayAvatarURL() })
            .addFields(
                { name: '🏆 Seviye', value: `${stats.level}`, inline: true },
                { name: '✨ Toplam XP', value: `${stats.xp} / ${neededXpNext}`, inline: true },
                { name: '📊 İlerleme Durumu', value: `\`[${progressBarString}]\` %${Math.round(percentage * 100)}`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'ProsiBot Seviye Sistemi' });

        message.reply({ embeds: [rankEmbed] });
    }
});

// 2. SES KANALINDA DURARAK XP KAZANMA
client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const userId = member.user.id;
    const guildId = newState.guild.id;
    const key = `${guildId}-${userId}`;

    // Kullanıcı sese katıldıysa
    if (newState.channelId && !oldState.channelId) {
        const interval = setInterval(() => {
            if (!member.voice.channelId) {
                clearInterval(interval);
                voiceTimeouts.delete(key);
                return;
            }

            if (!levels.has(key)) {
                levels.set(key, { xp: 0, level: 1 });
            }

            const userStats = levels.get(key);
            userStats.xp += 15; // Seste durulan her dakika için 15 XP
            const neededXp = userStats.level * 100;

            if (userStats.xp >= neededXp) {
                userStats.level += 1;
                userStats.xp = 0;
            }
        }, 60000); // Her 1 dakikada bir

        voiceTimeouts.set(key, interval);
    } 
    // Kullanıcı sesten çıktıysa
    else if (!newState.channelId && oldState.channelId) {
        if (voiceTimeouts.has(key)) {
            clearInterval(voiceTimeouts.get(key));
            voiceTimeouts.delete(key);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
