/**
 * =========================================
 * 📌 FILE: src/core/ConnectionHandler.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Handler untuk event connection.update
 * Menangani koneksi WhatsApp (open, close, reconnect)
 *
 * 📁 MAPPING: Bagian dari main.js (original) → src/core/ConnectionHandler.js
 * =========================================
 */

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================
const { DisconnectReason } = require("@itsukichan/baileys");
const chalk = require('chalk');

// =========================================
// 📌 CORE LOGIC / MAIN FUNCTIONS
// =========================================

/**
 * Register connection handler ke WhatsApp socket
 * @param {Object} WhosTANG - WhatsApp socket instance
 * @param {Object} options - Options object berisi reconnect function
 */
function registerConnectionHandler(WhosTANG, options = {}) {
    const { connectToWhatsApp } = options;

    // -----------------------------------------
    // CONNECTION UPDATE HANDLER
    // -----------------------------------------
    WhosTANG.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            console.log(chalk.yellow('Connection closed'));
            
            // Reconnect jika bukan logout
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log(chalk.blue('Reconnecting...'));
                if (connectToWhatsApp) {
                    connectToWhatsApp();
                }
            } else {
                console.log(chalk.red('Logged out. Please scan QR code again.'));
            }
            
        } else if (connection === 'open') {
            console.log(chalk.green('Connection opened successfully!'));
            
            // Follow newsletter saat koneksi terbuka
            try {
                WhosTANG.newsletterFollow("120363402508663272@newsletter");
                WhosTANG.newsletterFollow("120363423625415506@newsletter");
                WhosTANG.newsletterFollow("120363424163797384@newsletter");
            } catch (err) {
                console.log(chalk.yellow('Newsletter follow skipped'));
            }
        }
    });

    // -----------------------------------------
    // CALL EVENT HANDLER
    // -----------------------------------------
    WhosTANG.ev.on('call', async (caller) => {
        console.log(chalk.yellow("CALL OUTGOING"));
    });
}

// =========================================
// 📌 EXPORT / MODULE
// =========================================
module.exports = registerConnectionHandler;
