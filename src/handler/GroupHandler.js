/**
 * =========================================
 * 📌 FILE: src/handler/GroupHandler.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Handler untuk event group-participants.update
 * Menangani welcome, goodbye, promote, demote
 *
 * 📁 MAPPING: Library/participants.js (original) → src/handler/GroupHandler.js
 * =========================================
 */

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================
const GroupParticipants = require('../lib/participants');

// =========================================
// 📌 CORE LOGIC / MAIN FUNCTIONS
// =========================================

/**
 * Register group handler ke WhatsApp socket
 * @param {Object} WhosTANG - WhatsApp socket instance
 */
function registerGroupHandler(WhosTANG) {
    
    // -----------------------------------------
    // GROUP PARTICIPANTS UPDATE HANDLER
    // -----------------------------------------
    WhosTANG.ev.on("group-participants.update", async (m) => {
        await GroupParticipants(WhosTANG, m);
    });
}

// =========================================
// 📌 EXPORT / MODULE
// =========================================
module.exports = registerGroupHandler;
