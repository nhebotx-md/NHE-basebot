/**
 * =========================================
 * 📌 PLUGIN: Credits / TQTO
 * 📌 FILE: Plugins-CJS/tqto-plugin.js
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global } = Obj;

    try {
        // Guard injection
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        const ctx = {
            name: m.pushName || "User",
            number: (m.sender || "0@s.whatsapp.net").split('@')[0],
            thumb: global?.thumb
        };

        const tqtoText = `
🙏 *TERIMA KASIH KEPADA* 🙏

👑 *Developer & Owner:*
▸ ${global?.namaowner || 'Unknown'}

📚 *Library & Modules:*
▸ @itsukichan/baileys
▸ axios - HTTP client
▸ fs-extra - File system
▸ chalk - Terminal styling
▸ yt-search - YouTube search
▸ moment-timezone - Time handling
▸ @babel/core - Code transpiler

🌐 *API Provider:*
▸ api.deline.web.id
▸ on4t.com (Downloader)
▸ catbox.moe (Uploader)
▸ telegra.ph (Uploader)

💡 *Inspiration & Community:*
▸ Baileys Community
▸ WhatsApp Bot Developers Indonesia
▸ Node.js Community

🤝 *Special Thanks:*
▸ All Users & Supporters
▸ Beta Testers
▸ Contributors
▸ Donators

⚡ *Powered by:* ShoNhe Engine

Terima kasih telah menggunakan
*${global?.botname || 'NHE BOT'}*! 💚
        `.trim();

        await engine.send(m, {
            text: tqtoText,
            ctx
        });

    } catch (err) {
        console.error('[TQTOPlugin Error]', err);
        await reply('❌ Terjadi error pada tqto plugin');
    }
};

// ✅ Metadata wajib (detector engine)
handler.command = ['tqtplugin', 'creditsplugin', 'thanksto'];
handler.tags = ['info'];
handler.help = ['tqtplugin'];

module.exports = handler;