/**
 * =========================================
 * 📌 PLUGIN: Help/Bantuan dengan UI Lengkap
 * 📌 FILE: Plugins-CJS/help-plugin.js
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global } = Obj;

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

        const helpText = `
❓ *BANTUAN & CARA PENGGUNAAN* ❓

*Selamat datang di ${global?.botname || 'NHE BOT'}!*

📋 *Cara Menggunakan Bot:*

1️⃣ *Command Prefix*
   Gunakan prefix: *!* , *.* , atau *,*
   Contoh: *.menu* atau *!ping*

2️⃣ *Reply Mode*
   ▸ *.setreply button* - Mode tombol interaktif
   ▸ *.setreply text* - Mode teks biasa
   ▸ *.checkmode* - Cek mode saat ini

3️⃣ *Download Media*
   ▸ *.play <judul>* - Download lagu
   ▸ *.ytmp4 <link>* - Download video YouTube
   ▸ *.aio <link>* - Download sosmed (TikTok, IG, FB, dll)

4️⃣ *Group Commands*
   ▸ *.tagall* - Tag semua member
   ▸ *.hidetag* - Tag tersembunyi
   ▸ *.promote @user* - Jadikan admin
   ▸ *.demote @user* - Turunkan admin
   ▸ *.open* / *.close* - Buka/tutup grup

5️⃣ *Tools*
   ▸ *.remini* - HD photo (reply gambar)
   ▸ *.tourl* - Upload ke URL (reply media)
   ▸ *.calc* - Kalkulator

6️⃣ *Games & Fun*
   ▸ *.games* - Menu games
   ▸ *.quotes* - Quotes inspiratif
   ▸ *.dadu* - Lempar dadu

📞 *Butuh bantuan lebih?*
Hubungi owner: *.owner*
        `.trim();

        await engine.sendListUI(m, {
            title: "❓ BANTUAN",
            body: helpText,
            footer: "Help System",
            buttonText: "📋 MENU LENGKAP",
            sections: [
                {
                    title: "🎯 QUICK ACCESS",
                    rows: [
                        { title: "📜 Menu Utama", description: "Lihat semua fitur", rowId: ".menu" },
                        { title: "👑 Hubungi Owner", description: "Chat dengan owner", rowId: ".owner" },
                        { title: "🏓 Cek Bot", description: "Test respon bot", rowId: ".ping" },
                        { title: "🎮 Games", description: "Menu games & fun", rowId: ".games" }
                    ]
                },
                {
                    title: "⚙️ SETTINGS",
                    rows: [
                        { title: "🎨 Ganti Mode Reply", description: "Button atau Text", rowId: ".replymode" },
                        { title: "🔍 Cek Mode", description: "Mode reply saat ini", rowId: ".checkmode" }
                    ]
                }
            ],
            ctx
        });

    } catch (err) {
        console.error('[HelpPlugin Error]', err);
        await reply('❌ Terjadi error pada help plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['helpplugin', 'bantuanplugin', 'carapakai'];
handler.tags = ['main', 'info'];
handler.help = ['helpplugin'];

module.exports = handler;