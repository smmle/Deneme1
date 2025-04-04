const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Client: MCClient } = require("bedrock-protocol");
require("dotenv").config(); 

const discordBot = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const mcBots = {};
const mcHost = "SUNUCU_IP"; // Minecraft sunucu IP'sini buraya yaz
const mcPort = 19132; // Minecraft sunucu portu

// Rastgele isim üreten fonksiyon
function generateRandomName(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let name = "";
    for (let i = 0; i < length; i++) {
        name += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return name;
}

// Discord bot açıldığında mesaj gönder
discordBot.once("ready", async () => {
    console.log(`✅ Discord botu açık: ${discordBot.user.tag}`);
    sendControlPanel();
});

// Discord kontrol panelini gönderme
async function sendControlPanel() {
    const channel = await discordBot.channels.fetch("KANAL_ID"); // Buraya Discord kanal ID'sini yaz
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId("start_bots").setLabel("🟢 Botları Başlat").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("stop_bots").setLabel("🔴 Botları Durdur").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("list_bots").setLabel("📋 Bot Listesi").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("send_msg").setLabel("💬 Mesaj Gönder").setStyle(ButtonStyle.Secondary)
        );

    channel.send({ content: "**🎮 Minecraft Bot Yönetim Paneli**", components: [row] });
}

// Butonlara basılınca işlemleri yap
discordBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "start_bots") {
        for (let i = 0; i < 5; i++) { // 5 bot bağlanacak
            let botName = generateRandomName(8);
            let bot = new MCClient({ host: mcHost, port: mcPort, username: botName });

            bot.on("connect", () => {
                mcBots[botName] = bot;
                interaction.reply(`✅ **${botName}** sunucuya bağlandı!`);
            });

            bot.on("disconnect", (reason) => {
                delete mcBots[botName];
                interaction.reply(`❌ **${botName}** ayrıldı: ${reason}`);
            });
        }
    }

    if (interaction.customId === "stop_bots") {
        for (let botName in mcBots) {
            mcBots[botName].end();
            delete mcBots[botName];
        }
        interaction.reply("🔴 **Tüm botlar kapatıldı!**");
    }

    if (interaction.customId === "list_bots") {
        let botList = Object.keys(mcBots);
        interaction.reply(`📋 **Aktif Botlar:** ${botList.length > 0 ? botList.join(", ") : "Hiç bot yok!"}`);
    }

    if (interaction.customId === "send_msg") {
        interaction.reply("💬 **Mesaj göndermek için:** `!say <botismi> <mesaj>` komutunu kullan.");
    }
});

// Mesaj gönderme komutu
discordBot.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(" ");
    const command = args.shift().toLowerCase();

    if (command === "!say") {
        let botName = args[0];
        let msg = args.slice(1).join(" ");
        if (!botName || !mcBots[botName] || !msg) return message.channel.send("❌ Hatalı komut!");

        mcBots[botName].write("CommandRequest", { command: `/say ${msg}` });
        message.channel.send(`🗨 **${botName}** şu mesajı gönderdi: ${msg}`);
    }
});

// Discord botunu başlat
discordBot.login(process.env.DISCORD_TOKEN);
