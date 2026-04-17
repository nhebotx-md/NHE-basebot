/**
 * =========================================
 * 📌 PLUGIN: Source Code Info
 * 📌 FILE: Plugins-CJS/source-plugin.js
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

        const sourceText = `
📂 *SOURCE CODE INFORMATION* 📂

🤖 *Bot:* ${global?.botname || 'NHE BOT'}
📦 *Version:* 1.2.0
⚡ *Engine:* ShoNhe System

📁 *Repository:*
github.com/nhebotx-md/NHE-basebot

📝 *Base Library:*
▸ @itsukichan/baileys
▸ Node.js (JavaScript)

📋 *Features:*
▸ CJS & ESM Plugin System
▸ Interactive UI (Button, List, Flow)
▸ Fake Quoted Messages
▸ Reply Engine
▸ Multi Downloader

💻 *Developer:* ${global?.namaowner || 'Unknown'}
📞 *Contact:* wa.me/${global?.numberown || '62881027174423'}

⚠️ *Note:*
Dilarang menjual script ini!
Silakan gunakan dengan bijak.

⭐ Jangan lupa star repositorynya!
        `.trim();

        await engine.sendHybrid(m, {
            text: sourceText,
            footer: "Source Code Info",
            buttons: [
                { buttonId: ".owner", buttonText: { displayText: "👑 CONTACT DEV" } },
                { buttonId: ".menu", buttonText: { displayText: "📜 MENU" } },
                { buttonId: ".tqto", buttonText: { displayText: "🙏 CREDITS" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[SourcePlugin Error]', err);
        await reply('❌ Terjadi error pada source plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['sourceplugin', 'scplugin', 'scriptplugin'];
handler.tags = ['info'];
handler.help = ['sourceplugin'];

module.exports = handler;