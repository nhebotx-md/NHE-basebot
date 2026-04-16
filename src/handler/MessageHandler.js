/**
 * =========================================
 * 📌 FILE: src/handler/MessageHandler.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Handler untuk event messages.upsert
 * Menangani pesan masuk dan routing ke command handler
 *
 * 📁 MAPPING: Bagian dari main.js (original) → src/handler/MessageHandler.js
 * =========================================
 */

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================
const { smsg } = require('../utils/message');

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
            
            // Panggil handler utama (WhosTANG.js)
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
