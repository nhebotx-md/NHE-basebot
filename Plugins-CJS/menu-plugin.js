/**
 * =========================================
 * 📌 PLUGIN: Menu Interaktif dengan ReplyEngine
 * 📌 FILE: Plugins-CJS/menu-plugin.js
 * =========================================
 */

const fs = require('fs');
const path = require('path');

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, runtime } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        const sender = m.sender || "0@s.whatsapp.net";

        const ctx = {
            name: m.pushName || "User",
            number: sender.split('@')[0],
            thumb: global?.thumb
        };

        // ======================
        // 🔹 COUNT UTIL (OPTIMIZED)
        // ======================
        const countCase = (filePath) => {
            try {
                if (!fs.existsSync(filePath)) return 0;
                const data = fs.readFileSync(filePath, "utf8");
                const match = data.match(/case\s+['"`][^'"`]+['"`]\s*:/g);
                return match ? match.length : 0;
            } catch {
                return 0;
            }
        };

        const countFiles = (dir) => {
            try {
                if (!fs.existsSync(dir)) return 0;
                return fs.readdirSync(dir).filter(f =>
                    f.endsWith(".js") || f.endsWith(".mjs")
                ).length;
            } catch {
                return 0;
            }
        };

        const CASE = countCase("./src/core/WhosTANG.js");
        const ESM = countFiles("./Plugins-ESM");
        const CJS = countFiles("./Plugins-CJS");
        const TOTAL = CASE + ESM + CJS;

        const menuText = `
╭──────[ *ABOUT BOT* ]──────╮
│▣ Nama-Bot : ${global?.botname || 'NHE BOT'}
│▣ Version : 1.2.0
│▣ Runtime : ${typeof runtime === 'function' ? runtime(process.uptime()) : '-'}
│▣ Feature : ${TOTAL} command
│▣ Type : CJS & ESM (Plugins)
╰─────────────────────╯

Halo ${m.pushName || "User"}! 👋
Pilih menu di bawah ini:
        `.trim();

        // ======================
        // 🔹 HYBRID UI
        // ======================
        await engine.sendHybrid(m, {
            text: menuText,
            footer: "ShoNhe Engine System",
            buttons: [
                { buttonId: ".ping", buttonText: { displayText: "🏓 PING" } },
                { buttonId: ".owner", buttonText: { displayText: "👑 OWNER" } }
            ],
            ctx
        });

        // ======================
        // 🔹 DELAY SAFE
        // ======================
        await new Promise(r => setTimeout(r, 500));

        // ======================
        // 🔹 LIST UI
        // ======================
        await engine.sendListUI(m, {
            title: "📚 ALL MENU",
            body: "Silakan pilih kategori menu:",
            footer: global?.botname || "NHE BOT",
            buttonText: "📋 BUKA MENU",
            sections: [
                {
                    title: "🤖 MAIN MENU",
                    rows: [
                        { title: "📜 Menu Utama", description: "Lihat semua fitur", rowId: ".menu" },
                        { title: "🏓 Ping Bot", description: "Cek kecepatan bot", rowId: ".ping" },
                        { title: "📊 Runtime", description: "Waktu aktif bot", rowId: ".runtime" },
                        { title: "👑 Owner", description: "Hubungi owner", rowId: ".owner" }
                    ]
                },
                {
                    title: "🎵 DOWNLOAD",
                    rows: [
                        { title: "🎵 Play Music", description: "Download lagu", rowId: ".play" },
                        { title: "📹 YouTube MP4", description: "Download video", rowId: ".ytmp4" },
                        { title: "🌐 All Sosmed", description: "Download sosmed", rowId: ".aio" }
                    ]
                },
                {
                    title: "⚙️ TOOLS",
                    rows: [
                        { title: "🖼️ HD Photo", description: "Enhance foto", rowId: ".remini" },
                        { title: "🔗 To URL", description: "Upload file", rowId: ".tourl" },
                        { title: "🎨 Reply Mode", description: "Ubah mode reply", rowId: ".replymode" }
                    ]
                }
            ],
            ctx
        });

    } catch (err) {
        console.error('[MenuPlugin Error]', err);
        await reply('❌ Terjadi error pada menu plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['menuplugin', 'menureply', 'menup'];
handler.tags = ['main', 'menu'];
handler.help = ['menuplugin'];

module.exports = handler;