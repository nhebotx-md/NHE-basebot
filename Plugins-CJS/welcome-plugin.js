/**
 * =========================================
 * 📌 PLUGIN: Welcome Message dengan Combo UI
 * 📌 FILE: Plugins-CJS/welcome-plugin.js
 * =========================================
 */

const handler = async (m, Obj) => {
    const { text, reply, conn, createReplyEngine, global } = Obj;

    try {
        // Validasi dependency penting (anti crash engine undefined)
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        const ctx = {
            name: m.pushName || "User",
            number: m.sender?.split('@')[0] || "unknown",
            thumb: global?.thumb
        };

        // Fallback image (anti undefined)
        const imageUrl = global?.thumb || "https://i.ibb.co/997h3mWM/sho-Nhe.jpg";

        // Validasi method engine (biar gak error kayak sebelumnya)
        if (typeof engine.sendWelcomeCombo !== "function") {
            throw new Error('engine.sendWelcomeCombo is not a function');
        }

        await engine.sendWelcomeCombo(m, {
            image: imageUrl,
            caption: `
👋 *Selamat Datang ${m.pushName || "User"}!*

🤖 *${global?.botname || 'NHE BOT'}*
📱 Version: 1.2.0
⚡ Engine: ShoNhe System

Terima kasih telah menggunakan bot kami!

📋 *Cara Penggunaan:*
▸ Ketik *.menu* untuk melihat fitur
▸ Ketik *.help* untuk bantuan
▸ Ketik *.owner* untuk hubungi owner

Semoga harimu menyenangkan! 🌟
            `.trim(),
            footer: "Welcome System",
            buttons: [
                { buttonId: ".menu", buttonText: { displayText: "📜 LIHAT MENU" } },
                { buttonId: ".help", buttonText: { displayText: "❓ BANTUAN" } },
                { buttonId: ".owner", buttonText: { displayText: "👑 OWNER" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[WelcomePlugin Error]', err);
        await reply('❌ Terjadi error pada welcome plugin');
    }
};

// Metadata wajib (engine detector)
handler.command = ['welcomeplugin', 'greetplugin', 'wplugin'];
handler.tags = ['main', 'info'];
handler.help = ['welcomeplugin'];

module.exports = handler;