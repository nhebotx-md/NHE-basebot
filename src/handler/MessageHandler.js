/**
 * =========================================
 * 📌 FILE: src/handler/MessageHandler.js (MODIFIED)
 * 📌 DESCRIPTION:
 * Handler untuk event messages.upsert
 * Menangani pesan masuk dan routing ke command handler
 *
 * 🔧 MODIFICATION: Added Global Middleware Integration
 * - Initialize middleware system on startup
 * - Run userMiddleware before WhosTANG handler
 * - Handle register gate blocking (anti-spam)
 * - Inject context (ctx) to message object
 *
 * 📁 INTEGRATION POINT: Middleware Layer
 * =========================================
 */

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================
const { smsg } = require('../utils/message');
const { userMiddleware, initMiddleware } = require('../middleware/userMiddleware');

// =========================================
// 📌 INIT MIDDLEWARE SYSTEM
// =========================================
initMiddleware();

// =========================================
// 📌 CORE LOGIC / MAIN FUNCTIONS
// =========================================

/**
 * Register message handler ke WhatsApp socket
 * @param {Object} WhosTANG - WhatsApp socket instance
 * @param {Object} store - In-memory store
 */
function registerMessageHandler(WhosTANG, store) {

    // -----------------------------------------
    // MESSAGE UPSERT HANDLER
    // -----------------------------------------
    WhosTANG.ev.on('messages.upsert', async chatUpdate => {
        try {
            // Ambil pesan pertama dari update
            let mek = chatUpdate.messages[0];

            // Skip jika tidak ada message
            if (!mek.message) return;

            // Handle ephemeral message
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

            // Skip status broadcast
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;

            // Skip jika public mode off dan bukan dari bot
            if (!WhosTANG.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;

            // Skip pesan dari Baileys sendiri
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;

            // Serialize message
            let m = smsg(WhosTANG, mek, store);

            // =========================================
            // 🔧 GLOBAL MIDDLEWARE EXECUTION
            // =========================================
            const middlewareResult = userMiddleware(m, global, WhosTANG);

            if (middlewareResult.blocked) {
                // --- BLOCKED: User not registered or other block reason ---

                if (middlewareResult.silent) {
                    // Silent block - don't send anything (anti-spam protection)
                    // Just stop execution
                    return;
                }

                // Send block payload (e.g., register button)
                if (middlewareResult.payload) {
                    try {
                        await WhosTANG.sendMessage(
                            m.key.remoteJid,
                            middlewareResult.payload,
                            { quoted: m }
                        );
                    } catch (sendErr) {
                        console.error('[Middleware] Error sending block payload:', sendErr.message);
                    }
                }

                // STOP execution - don't proceed to WhosTANG
                return;
            }

            // --- ALLOWED: User passed middleware checks ---

            // Inject context ke message object
            // Semua plugin dan case handlers can access: m.ctx.user, m.ctx.isOwner, dll
            if (middlewareResult.ctx) {
                m.ctx = middlewareResult.ctx;

                // Log level up notification
                if (middlewareResult.levelUp) {
                    console.log(`[Middleware] User ${m.ctx.userId} leveled up to level ${m.ctx.level}`);
                }
            }

            // =========================================
            // PROCEED TO MAIN HANDLER (WhosTANG.js)
            // =========================================
            require('../core/WhosTANG')(WhosTANG, m, chatUpdate, store);

        } catch (error) {
            console.error("Error processing message upsert:", error);
        }
    });

    // -----------------------------------------
    // MESSAGES UPDATE HANDLER
    // -----------------------------------------
    WhosTANG.ev.on('messages.update', async chatUpdate => {
        // Handler untuk message updates (status read, dll)
        // Bisa ditambahkan logika sesuai kebutuhan
    });
}

// =========================================
// 📌 EXPORT / MODULE
// =========================================
module.exports = registerMessageHandler;
