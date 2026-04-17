/**
 * =========================================
 * 📌 PLUGIN: Group Info dengan UI
 * 📌 FILE: Plugins-CJS/group-info-plugin.js
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

        // ======================
        // 🔹 GROUP CHECK (SAFE)
        // ======================
        const isGroup = m.chat?.endsWith('@g.us');

        if (!isGroup) {
            return await reply('❌ Fitur ini hanya bisa digunakan di grup!');
        }

        const ctx = {
            name: m.pushName || "User",
            number: sender.split('@')[0],
            thumb: global?.thumb
        };

        // ======================
        // 🔹 GET METADATA (SAFE)
        // ======================
        let groupMetadata = {};
        try {
            groupMetadata = await conn.groupMetadata(m.chat);
        } catch {
            groupMetadata = {};
        }

        const participants = Array.isArray(groupMetadata.participants)
            ? groupMetadata.participants
            : [];

        const groupOwner =
            groupMetadata.owner ||
            participants.find(p => p.admin === 'superadmin')?.id ||
            null;

        const groupAdmins = participants.filter(p =>
            p.admin === 'admin' || p.admin === 'superadmin'
        );

        // ======================
        // 🔹 CREATED DATE (FIXED)
        // ======================
        let createdDate = 'Unknown';

        if (groupMetadata.creation) {
            try {
                createdDate = new Date(groupMetadata.creation * 1000)
                    .toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
            } catch {
                createdDate = 'Unknown';
            }
        }

        // ======================
        // 🔹 TEXT BUILD
        // ======================
        const groupInfoText = `
👥 *GROUP INFORMATION* 👥

📛 *Nama Grup:*
${groupMetadata.subject || 'Unknown'}

🆔 *Group ID:*
\`${m.chat}\`

👤 *Owner:*
${groupOwner ? '@' + groupOwner.split('@')[0] : 'Unknown'}

📊 *Statistik:*
▸ Total Members: *${participants.length}*
▸ Admin: *${groupAdmins.length}*
▸ Regular: *${participants.length - groupAdmins.length}*

🔐 *Status:*
▸ ${groupMetadata.announce ? '🔒 Ditutup (Hanya admin)' : '🔓 Terbuka'}

📅 *Dibuat:* ${createdDate}
        `.trim();

        // ======================
        // 🔹 SEND (MENTION SAFE)
        // ======================
        await conn.sendMessage(m.chat, {
            text: groupInfoText,
            mentions: groupOwner ? [groupOwner] : [],
            contextInfo: engine.buildContextInfo(m, {
                title: global?.botname,
                body: "Group Info System"
            })
        }, {
            quoted: engine.buildFake('fkontak', ctx)
        });

    } catch (err) {
        console.error('[GroupInfoPlugin Error]', err);
        await reply('❌ Terjadi error pada group info plugin');
    }
};

// ✅ Metadata wajib
handler.command = ['groupplugin', 'gcplugin', 'groupinfo'];
handler.tags = ['group'];
handler.help = ['groupplugin'];

module.exports = handler;