/**
 * =========================================
 * 📌 PLUGIN: User Profile dengan UI Lengkap
 * 📌 FILE: Plugins-CJS/profile-plugin.js
 * =========================================
 */

const fs = require('fs');

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, isOwner, isPremium, getUserMode } = Obj;

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
        // 🔹 LOAD PREMIUM DATA (SAFE)
        // ======================
        let premium = [];

        try {
            if (fs.existsSync("./data/premium.json")) {
                const raw = fs.readFileSync("./data/premium.json", "utf-8");
                premium = JSON.parse(raw || "[]");
            }
        } catch {
            premium = [];
        }

        const isPrem = Array.isArray(premium)
            ? premium.includes(sender)
            : false;

        const userMode = typeof getUserMode === 'function'
            ? getUserMode(sender)
            : 'text';

        // ======================
        // 🔹 FORMAT TANGGAL
        // ======================
        const now = new Date();
        const tanggal = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // ======================
        // 🔹 ROLE RESOLUTION (PRIORITAS)
        // ======================
        let roleText = '👤 User';

        if (isOwner) {
            roleText = '👑 Owner';
        } else if (isPremium || isPrem) {
            roleText = '💎 Premium';
        }

        const profileText = `
👤 *USER PROFILE* 👤

📋 *Informasi Dasar:*
▸ Nama: *${m.pushName || 'No Name'}*
▸ Nomor: *${sender.split('@')[0]}*
▸ JID: \`${sender}\`

🎭 *Status:*
▸ Role: ${roleText}
▸ Reply Mode: *${String(userMode).toUpperCase()}*

📅 *Tanggal:* ${tanggal}

${isOwner
    ? '🔥 Anda memiliki akses penuh ke bot!'
    : (isPremium || isPrem)
        ? '💎 Terima kasih telah menjadi user premium!'
        : '💡 Upgrade ke premium untuk fitur eksklusif!'
}
        `.trim();

        // ======================
        // 🔹 BUTTON LOGIC
        // ======================
        let buttons;

        if (isOwner) {
            buttons = [
                { buttonId: ".menu", buttonText: { displayText: "📜 MENU" } },
                { buttonId: ".owner", buttonText: { displayText: "👑 OWNER MENU" } }
            ];
        } else if (isPremium || isPrem) {
            buttons = [
                { buttonId: ".menu", buttonText: { displayText: "📜 MENU" } },
                { buttonId: ".owner", buttonText: { displayText: "👑 HUBUNGI OWNER" } }
            ];
        } else {
            buttons = [
                { buttonId: ".menu", buttonText: { displayText: "📜 MENU" } },
                { buttonId: ".owner", buttonText: { displayText: "💎 UPGRADE PREMIUM" } }
            ];
        }

        // ======================
        // 🔹 OUTPUT
        // ======================
        await engine.sendWelcomeCombo(m, {
            image: global?.thumb,
            caption: profileText,
            footer: "Profile System",
            buttons,
            ctx
        });

    } catch (err) {
        console.error('[ProfilePlugin Error]', err);
        await reply('❌ Terjadi error pada profile plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['profileplugin', 'pp', 'myprofile'];
handler.tags = ['info', 'main'];
handler.help = ['profileplugin'];

module.exports = handler;