/**
 * =========================================
 * 📌 FILE: Plugins-CJS/register.js
 * 📌 DESCRIPTION:
 * Plugin .register – Menggunakan SEMUA logika dari src/middleware/registerGate.js
 * Mendukung command .register / daftar
 * Meng-handle proses registrasi lengkap (generate code, update data user, tampilkan hasil detail)
 * Menggunakan base plugin template CJS resmi dari NHE-basebot
 *
 * 📁 MAPPING: Plugins-CJS/register.js (baru)
 * =========================================
 */

const registerGate = require('../src/middleware/registerGate');

/**
 * Handler utama plugin
 * @param {Object} m - Message object dari WhatsApp
 * @param {Object} Obj - Object berisi utilities dan helpers
 * @param {string} Obj.text - Text arguments
 * @param {Array} Obj.args - Array arguments
 * @param {Function} Obj.reply - Reply function
 * @param {Object} Obj.conn - WhatsApp connection
 * @param {Function} Obj.createReplyEngine - Engine untuk kirim hybrid message
 * @param {Object} Obj.global - Global object (termasuk db, botname, thumb, dll)
 */
const handler = async (m, Obj) => {
    const {
        text,
        reply,
        conn,
        createReplyEngine,
        global
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
        const phoneNumber = sender.split('@')[0];

        const ctx = {
            name: m.pushName || "User",
            number: phoneNumber,
            thumb: global?.thumb
        };

        // ======================
        // 🔹 AMBIL / BUAT USER DATA DARI DB
        // ======================
        let user = global.db?.users?.[sender];

        if (!user) {
            user = registerGate.createUnregisteredUser(sender);
            global.db.users = global.db.users || {};
            global.db.users[sender] = user;
        }

        // ======================
        // 🔥 PROSES REGISTRASI (SEMUA LOGIKA DARI MIDDLEWARE)
        // ======================
        const result = registerGate.processRegistration(user, phoneNumber);

        let responseMessage = result.message;

        if (!result.success && !result.alreadyRegistered) {
            responseMessage = `❌ Gagal memproses registrasi:\n${result.error || 'Unknown error'}`;
        }

        // ======================
        // 🔹 RESPONSE (menggunakan engine hybrid seperti base template)
        // ======================
        await engine.sendHybrid(m, {
            text: responseMessage,
            footer: global?.botname || "NHE Basebot",
            buttons: [
                {
                    buttonId: ".menu",
                    buttonText: { displayText: "📚 MENU" }
                }
            ],
            ctx
        });

    } catch (err) {
        console.error(`[register plugin error]`, err);
        await reply('❌ Terjadi error pada plugin register');
    }
};

// ======================
// 🔥 METADATA WAJIB
// ======================
handler.command = ['register', 'daftar'];
handler.tags = ['main'];
handler.help = ['register'];

module.exports = handler;