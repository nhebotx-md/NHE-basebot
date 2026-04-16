/**
 * =========================================
 * 📌 FILE: src/lib/participants.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Handler untuk event group-participants.update
 * Mengelola welcome, goodbye, promote, dan demote
 *
 * 📁 MAPPING: Library/participants.js (original) → src/lib/participants.js
 * =========================================
 */

// =========================================
// 📌 IMPORT / REQUIRE
// =========================================
require('../config/config');
const { WA_DEFAULT_EPHEMERAL } = require('@itsukichan/baileys').default;

// =========================================
// 📌 CORE LOGIC / MAIN FUNCTIONS
// =========================================

/**
 * Handler utama untuk event group-participants.update
 * @param {Object} conn - WhatsApp connection instance
 * @param {Object} params - Parameter object
 * @param {string} params.id - Group JID
 * @param {Array} params.participants - Array JID participants
 * @param {string} params.action - Tipe action ('add', 'remove', 'promote', 'demote')
 * @param {string} params.author - JID user yang melakukan action
 */
async function GroupParticipants(conn, { id, participants, action, author }) {
    try {
        // =========================================
        // GET GROUP METADATA
        // =========================================
        const meta = await conn.groupMetadata(id);
        const subject = meta.subject;
        const totalMember = meta.participants.length;

        // =========================================
        // PROCESS EACH PARTICIPANT
        // =========================================
        for (let jid of participants) {
            
            // -----------------------------------------
            // FETCH USER AVATAR
            // -----------------------------------------
            let avatar;
            try {
                avatar = await conn.profilePictureUrl(jid, 'image');
            } catch {
                avatar = global.thumb;
            }

            // -----------------------------------------
            // CALCULATE MEMBER COUNT
            // -----------------------------------------
            let sisaMember = action === "remove" ? totalMember - 1 : totalMember;

            // -----------------------------------------
            // BUILD EXTERNAL AD REPLY
            // -----------------------------------------
            const external = {
                title: subject,
                body: `👥 Member: ${sisaMember}`,
                thumbnailUrl: avatar,
                mediaType: 1,
                renderLargerThumbnail: true
            };

            // =========================================
            // 📌 FEATURE HANDLERS - SWITCH ACTION
            // =========================================
            switch (action) {

                // -----------------------------------------
                // WELCOME HANDLER
                // -----------------------------------------
                case "add":
                    if (!global.welcome) return;
                    await conn.sendMessage(id, {
                        text: `👋 Selamat datang @${jid.split("@")[0]} di *${subject}*\n\n👥 Total member: ${sisaMember}`,
                        contextInfo: {
                            mentionedJid: [jid],
                            externalAdReply: external
                        }
                    }, { ephemeralExpiration: WA_DEFAULT_EPHEMERAL });
                    break;

                // -----------------------------------------
                // GOODBYE HANDLER
                // -----------------------------------------
                case "remove":
                    if (!global.goodbye) return;
                    await conn.sendMessage(id, {
                        text: `👋 Selamat tinggal @${jid.split("@")[0]}\n👥 Sisa member: ${sisaMember}`,
                        contextInfo: {
                            mentionedJid: [jid],
                            externalAdReply: external
                        }
                    }, { ephemeralExpiration: WA_DEFAULT_EPHEMERAL });
                    break;

                // -----------------------------------------
                // PROMOTE HANDLER
                // -----------------------------------------
                case "promote":
                    if (!author) return;
                    await conn.sendMessage(id, {
                        text: `👑 @${author.split("@")[0]} promote @${jid.split("@")[0]} jadi admin`,
                        contextInfo: { mentionedJid: [author, jid] }
                    });
                    break;

                // -----------------------------------------
                // DEMOTE HANDLER
                // -----------------------------------------
                case "demote":
                    if (!author) return;
                    await conn.sendMessage(id, {
                        text: `🚫 @${author.split("@")[0]} demote @${jid.split("@")[0]}`,
                        contextInfo: { mentionedJid: [author, jid] }
                    });
                    break;
            }
        }

    } catch (e) {
        console.error("GroupParticipants Error:", e);
    }
}

// =========================================
// 📌 EXPORT / MODULE
// =========================================
module.exports = GroupParticipants;
