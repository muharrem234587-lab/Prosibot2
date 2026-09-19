const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Veritabanı ve Ses Takibi
const levels = new Map();
const voiceTimeouts = new Map();

client.once('ready', () => {
    console.log(`ProsiBot görsel rank sistemi aktif! Giriş yapılan bot: ${client.user.tag}`);
});

// 1. MESAJ YAZARAK XP KAZANMA VE RANK KARTI
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;

    if (!levels.has(key)) {
        levels.set(key, { xp: 0, level: 1 });
    }

    const userStats = levels.get(key);
    userStats.xp += 10; 
    const neededXp = userStats.level * 100;

    if (userStats.xp >= neededXp) {
        userStats.level += 1;
        userStats.xp = 0;
        message.channel.send(`🎉 Tebrikler ${message.author}, seviye atladın! Yeni seviyen: **${userStats.level}**! 🏆`);
    }

    // --- GÖRSEL RANK KARTI ( !rank veya !seviye ) ---
    if (message.content === '!rank' || message.content === '!seviye') {
        const stats = levels.get(key);
        const neededXpNext = stats.level * 100;
        
        const canvasWidth = 930;
        const canvasHeight = 280;
        const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Arka Plan Rengi
        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Profil Resmi Çerçevesi ve Resim
        const avatarRadius = 80;
        ctx.beginPath();
        ctx.arc(140, canvasHeight / 2, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        try {
            const avatar = await Canvas.loadImage(message.author.displayAvatarURL({ extension: 'jpg', size: 512 }));
            ctx.drawImage(avatar, 140 - avatarRadius, canvasHeight / 2 - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        } catch (e) {
            console.error("Profil resmi yüklenemedi.", e);
        }

        ctx.restore();
        ctx.font = '40px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(message.author.username, 300, 100);

        ctx.font = '28px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`Level: ${stats.level}`, 300, 145);

        ctx.font = '32px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(`${stats.xp} / ${neededXpNext} XP`, canvasWidth - 40, 190);

        // XP Barı (Çubuğu)
        const barWidth = 570;
        const barHeight = 40;
        const barX = 300;
        const barY = 200;
        const cornerRadius = 20;
        const progress = stats.xp / neededXpNext;
        
        ctx.fillStyle = '#484B51';
        ctx.beginPath();
        ctx.moveTo(barX + cornerRadius, barY);
        ctx.lineTo(barX + barWidth - cornerRadius, barY);
        ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + cornerRadius);
        ctx.lineTo(barX + barWidth, barY + barHeight - cornerRadius);
        ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - cornerRadius, barY + barHeight);
        ctx.lineTo(barX + barWidth - cornerRadius, barY + barHeight);
        ctx.lineTo(barX + cornerRadius, barY + barHeight);
        ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - cornerRadius);
        ctx.lineTo(barX, barY + cornerRadius);
        ctx.quadraticCurveTo(barX, barY, barX + cornerRadius, barY);
        ctx.closePath();
        ctx.fill();

        if (progress > 0) {
            const fillWidth = barWidth * progress;
            ctx.fillStyle = '#0099ff';
            ctx.beginPath();
            ctx.moveTo(barX + cornerRadius, barY);
            ctx.lineTo(barX + fillWidth - cornerRadius, barY);
            ctx.quadraticCurveTo(barX + fillWidth, barY, barX + fillWidth, barY + cornerRadius);
            ctx.lineTo(barX + fillWidth, barY + barHeight - cornerRadius);
            ctx.quadraticCurveTo(barX + fillWidth, barY + barHeight, barX + fillWidth - cornerRadius, barY + barHeight);
            ctx.lineTo(barX + fillWidth - cornerRadius, barY + barHeight);
            ctx.lineTo(barX + cornerRadius, barY + barHeight);
            ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - cornerRadius);
            ctx.lineTo(barX, barY + cornerRadius);
            ctx.quadraticCurveTo(barX, barY, barX + cornerRadius, barY);
            ctx.closePath();
            ctx.fill();
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank-card.png' });
        message.reply({ files: [attachment] });
    }
});

// 2. SES KANALINDA DURARAK XP KAZANMA
client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const userId = member.user.id;
    const guildId = newState.guild.id;
    const key = `${guildId}-${userId}`;

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
            userStats.xp += 15; 
            const neededXp = userStats.level * 100;

            if (userStats.xp >= neededXp) {
                userStats.level += 1;
                userStats.xp = 0;
            }
        }, 60000);

        voiceTimeouts.set(key, interval);
    } 
    else if (!newState.channelId && oldState.channelId) {
        if (voiceTimeouts.has(key)) {
            clearInterval(voiceTimeouts.get(key));
            voiceTimeouts.delete(key);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
