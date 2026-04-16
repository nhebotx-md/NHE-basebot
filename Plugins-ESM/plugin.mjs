/**
 * =========================================
 * 📌 FILE: Plugins-ESM/plugin.mjs (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Contoh plugin ESM untuk basebot
 * Struktur minimal dengan command array atau regex
 *
 * 📁 MAPPING: Plugins-ESM (new) → Plugins-ESM/plugin.mjs
 * =========================================
 */

/**
 * Handler utama plugin
 * @param {Object} m - Message object dari WhatsApp
 * @param {Object} Obj - Object berisi utilities dan helpers
 */
const handler = async (m, Obj) => {
    const { text, args, reply, conn } = Obj;
    
    // Contoh penggunaan reply biasa
    await reply(`✅ *Plugin ESM berhasil dijalankan!*

📋 *Informasi:*
• Command: .esmplugin
• Args: ${args.join(' ') || 'tidak ada'}
• Text: ${text || 'kosong'}

Ini adalah contoh plugin ESM yang berjalan dengan baik!`);
};

// =========================================
// 📌 PLUGIN METADATA
// =========================================

/**
 * Array command yang tersedia untuk plugin ini
 * Bisa juga menggunakan RegExp untuk pattern matching
 */
handler.command = ["esmplugin", "testesm", "esmdemo"];

/**
 * Array tags untuk kategorisasi plugin
 */
handler.tags = ["tools", "info"];

/**
 * Array help text untuk menu
 */
handler.help = ["esmplugin", "testesm", "esmdemo"];

/**
 * Owner only restriction
 */
handler.owner = false;

/**
 * Premium only restriction
 */
handler.premium = false;

/**
 * Group only restriction
 */
handler.group = false;

/**
 * Private only restriction
 */
handler.private = false;

// =========================================
// 📌 EXPORT / MODULE
// =========================================
export default handler;
