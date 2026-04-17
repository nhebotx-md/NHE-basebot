/**
 * =========================================
 * 📌 PLUGIN: Donasi dengan UI Menarik (FIXED)
 * 📌 FILE: Plugins-CJS/donasi-plugin.js
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

        const donasiText = `
💝 *DONASI & SUPPORT* 💝

Terima kasih telah menggunakan *${global.botname || 'NHE BOT'}*! 🙏

Donasi Anda akan digunakan untuk:
▸ 🚀 Pengembangan fitur baru
▸ 💻 Maintenance server
▸ ☕ Support developer

💳 *Metode Donasi:*

📱 *E-Wallet:*
▸ Dana: ${global.numberown || '628xxxx'}
▸ OVO: ${global.numberown || '628xxxx'}
▸ Gopay: ${global.numberown || '628xxxx'}
▸ ShopeePay: ${global.numberown || '628xxxx'}

🏦 *Bank Transfer:*
▸ BCA: 1234567890
▸ BNI: 0987654321
▸ BRI: 1122334455

📞 *Hubungi Owner:*
wa.me/${global.numberown || '62881027174423'}

Setiap donasi, sekecil apapun,
sangat berarti bagi kami! 💚
        `.trim();

        await engine.sendWelcomeCombo(m, {
            image: global?.thumb,
            caption: donasiText,
            footer: "Donation System",
            buttons: [
                { buttonId: ".owner", buttonText: { displayText: "👑 HUBUNGI OWNER" } },
                { buttonId: ".menu", buttonText: { displayText: "📜 MENU" } }
            ],
            ctx
        });

    } catch (err) {
        console.error('[DonasiPlugin Error]', err);
        await reply('❌ Terjadi error pada donasi plugin');
    }
};

// ✅ metadata wajib (biar kedetect WhosTANG)
handler.command = ['donasiplugin', 'donateplugin', 'support'];
handler.tags = ['info', 'main'];
handler.help = ['donasiplugin'];

module.exports = handler;