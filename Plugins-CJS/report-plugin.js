/**
 * =========================================
 * 📌 PLUGIN: Report Bug/Feedback
 * 📌 FILE: Plugins-CJS/report-plugin.js
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, text } = Obj;

    try {
        // Guard injection
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
        // 🔹 MODE TANPA INPUT
        // ======================
        if (!text) {
            return await engine.sendHybrid(m, {
                text: `
📩 *REPORT & FEEDBACK* 📩

Laporkan bug atau berikan feedback
untuk pengembangan bot yang lebih baik!

📋 *Cara pakai:*
▸ *.reportplugin [pesan Anda]*

📌 *Contoh:*
▸ *.reportplugin Fitur download error*
▸ *.reportplugin Request fitur baru*
▸ *.reportplugin Ada bug di menu*

📞 Atau hubungi owner langsung:
*.owner*
                `.trim(),
                footer: "Report System",
                buttons: [
                    { buttonId: ".owner", buttonText: { displayText: "👑 HUBUNGI OWNER" } }
                ],
                ctx
            });
        }

        // ======================
        // 🔹 KIRIM LAPORAN
        // ======================
        const reportText = `
📩 *BUG REPORT / FEEDBACK*

👤 *From:* ${m.pushName || "User"}
📱 *Number:* ${sender.split('@')[0]}
🆔 *JID:* ${sender}
⏰ *Time:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

📝 *Message:*
${text}
        `.trim();

        // 🔥 SAFE OWNER LOOP
        if (Array.isArray(global?.owner) && global.owner.length > 0) {
            for (const ownerJid of global.owner) {
                try {
                    await conn.sendMessage(ownerJid, { text: reportText });
                } catch (e) {
                    console.error('[Report Send Owner Error]', e);
                }
            }
        }

        // ======================
        // 🔹 KONFIRMASI USER
        // ======================
        const preview = text.length > 50
            ? text.substring(0, 50) + '...'
            : text;

        await engine.send(m, {
            text: `
✅ *LAPORAN TERKIRIM!*

Terima kasih ${m.pushName || "User"}! 🙏

Laporan Anda telah dikirim ke owner:
📝 *${preview}*

Kami akan segera menindaklanjuti laporan Anda.
            `.trim(),
            ctx
        });

    } catch (err) {
        console.error('[ReportPlugin Error]', err);
        await reply('❌ Terjadi error pada report plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['reportplugin', 'bugplugin', 'feedback'];
handler.tags = ['tools', 'info'];
handler.help = ['reportplugin'];

module.exports = handler;