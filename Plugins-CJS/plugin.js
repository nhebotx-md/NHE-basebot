/**
 * =========================================
 * 📌 FILE: Plugins-CJS/plugin.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Contoh plugin CJS untuk basebot
 * Struktur minimal dengan command array
 *
 * 📁 MAPPING: Plugins-CJS/plugin.js (original) → Plugins-CJS/plugin.js
 * =========================================
 */

/**
 * Handler utama plugin
 * @param {Object} m - Message object dari WhatsApp
 * @param {Object} Obj - Object berisi utilities dan helpers
 * @param {string} Obj.text - Text arguments
 * @param {Array} Obj.args - Array arguments
 * @param {Function} Obj.reply - Reply function
 * @param {Object} Obj.conn - WhatsApp connection
 * @param {Function} Obj.smartReply - Smart reply dengan mode button/text
 */
/**
 * =========================================
 * 📌 BASE PLUGIN TEMPLATE (CJS - FINAL)
 * =========================================
 */

const handler = async (m, Obj) => {
    const {
        text,
        args,
        reply,
        conn,
        createReplyEngine,
        global,
        plugins
    } = Obj;

    try {
        // ======================
        // 🔹 VALIDASI ENGINE
        // ======================
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // ======================
        // 🔹 CONTEXT USER
        // ======================
        const sender = m.sender || "0@s.whatsapp.net";

        const ctx = {
            name: m.pushName || "User",
            number: sender.split('@')[0],
            thumb: global?.thumb
        };

        // ======================
        // 🔥 AKSES PLUGIN SYSTEM
        // ======================
        const pluginData = plugins || global.plugins || {};
        const pluginList = pluginData.list || [];
        const byTag = pluginData.byTag || new Map();

        // ======================
        // 🔹 LOGIC UTAMA
        // ======================

        const totalPlugin = pluginList.length;

        let message = `
╭───〔 SYSTEM INFO 〕───╮
│ Total Plugin : ${totalPlugin}
│ Total Tag    : ${byTag.size}
╰────────────────────╯
`.trim();

        // ======================
        // 🔹 RESPONSE
        // ======================
        await engine.sendHybrid(m, {
            text: message,
            footer: global?.botname || "Bot System",
            buttons: [
                {
                    buttonId: ".menu",
                    buttonText: { displayText: "📚 MENU" }
                }
            ],
            ctx
        });

    } catch (err) {
        console.error(`[${handler.name || 'plugin'} error]`, err);
        await reply('❌ Terjadi error pada plugin');
    }
};

// ======================
// 🔥 METADATA WAJIB
// ======================
handler.command = ['baseexample'];
handler.tags = ['main'];
handler.help = ['baseexample'];

module.exports = handler;
