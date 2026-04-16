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
const handler = async (m, Obj) => {
    const { text, args, reply, conn, smartReply, isOwn, isPrem } = Obj;
    
    // Contoh penggunaan smartReply dengan externalAdReply
    await smartReply(`✅ *Plugin berhasil dijalankan!*

📋 *Informasi:*
• Command: .plugin
• Args: ${args.join(' ') || 'tidak ada'}
• Text: ${text || 'kosong'}
• Owner: ${isOwn ? 'Ya' : 'Tidak'}
• Premium: ${isPrem ? 'Ya' : 'Tidak'}

Ini adalah contoh plugin CJS yang berjalan dengan baik!`, {
        title: "Plugin Demo",
        body: "CJS Plugin System"
    });
};

// =========================================
// 📌 PLUGIN METADATA
// =========================================

/**
 * Array command yang tersedia untuk plugin ini
 * Semua command di array akan men-trigger handler
 */
handler.command = ["plugin", "testplugin", "demo"];

/**
 * Array tags untuk kategorisasi plugin
 */
handler.tags = ["tools", "info"];

/**
 * Array help text untuk menu
 */
handler.help = ["plugin", "testplugin", "demo"];

/**
 * Owner only restriction
 * Set ke true jika hanya owner yang bisa pakai
 */
handler.owner = false;

/**
 * Premium only restriction
 * Set ke true jika hanya premium yang bisa pakai
 */
handler.premium = false;

/**
 * Group only restriction
 * Set ke true jika hanya bisa di group
 */
handler.group = false;

/**
 * Private only restriction
 * Set ke true jika hanya bisa di private chat
 */
handler.private = false;

// =========================================
// 📌 EXPORT / MODULE
// =========================================
module.exports = handler;
