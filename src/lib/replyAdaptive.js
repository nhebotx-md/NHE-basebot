/**
 * =========================================
 * 📌 FILE: src/lib/replyAdaptive.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Abstraction layer untuk sistem dual reply mode
 * Menangani reply sesuai preferensi user (button/text)
 *
 * 📁 MAPPING: Library/replyAdaptive.js (original) → src/lib/replyAdaptive.js
 * =========================================
 */

const { getUserReplyMode } = require('./replyMode');

/**
 * Konversi button array ke format text yang readable
 * @param {Array} buttons - Array button dari plugin
 * @returns {string} - Formatted text dengan daftar opsi
 */
const formatButtonsToText = (buttons) => {
    if (!Array.isArray(buttons) || buttons.length === 0) return '';
    
    let textOutput = '\n\n';
    let quickReplies = [];
    let sections = [];
    let ctaItems = [];
    
    buttons.forEach(btn => {
        if (!btn || !btn.name) return;
        
        try {
            const params = JSON.parse(btn.buttonParamsJson || '{}');
            
            switch (btn.name) {
                case 'quick_reply':
                    quickReplies.push(`[ ${params.display_text} ] → Ketik: ${params.id}`);
                    break;
                    
                case 'single_select':
                    if (params.sections && Array.isArray(params.sections)) {
                        params.sections.forEach(section => {
                            if (section.rows && Array.isArray(section.rows)) {
                                textOutput += `\n📁 *${section.title || 'Menu'}*\n`;
                                section.rows.forEach(row => {
                                    sections.push(`  • ${row.title}${row.description ? ` - ${row.description}` : ''} → Ketik: ${row.id}`);
                                });
                            }
                        });
                    }
                    break;
                    
                case 'cta_url':
                    ctaItems.push(`🔗 ${params.display_text}: ${params.url}`);
                    break;
                    
                case 'cta_call':
                    ctaItems.push(`📞 ${params.display_text}: ${params.id}`);
                    break;
            }
        } catch (e) {
            // Skip invalid button
        }
    });
    
    if (quickReplies.length > 0) {
        textOutput += '\n📋 *Pilihan Cepat:*\n' + quickReplies.join('\n') + '\n';
    }
    
    if (sections.length > 0) {
        textOutput += sections.join('\n') + '\n';
    }
    
    if (ctaItems.length > 0) {
        textOutput += '\n📎 *Link & Kontak:*\n' + ctaItems.join('\n') + '\n';
    }
    
    return textOutput;
};

/**
 * Ambil mode reply user dari database
 * @param {string} userId - JID user
 * @returns {string} - 'button' atau 'text'
 */
const getUserMode = (userId) => {
    const userData = getUserReplyMode(userId);
    return userData?.mode || 'text';
};

/**
 * Fungsi utama untuk adaptive reply
 * @param {Object} m - Message object
 * @param {Object} Obj - Object berisi conn, q, button, dll
 * @param {Object} content - Object berisi text, buttons, options
 * @returns {Promise} - Hasil send message
 */
const replyAdaptive = async (m, Obj, content) => {
    const { conn, q, button } = Obj;
    const userMode = getUserMode(m.sender);
    
    const {
        text = '',
        buttons = [],
        title = global.botname || 'NHE BOT',
        body = 'Verified System',
        thumbnailUrl = global.thumbnail || 'https://files.catbox.moe/5x2b8n.jpg',
        sourceUrl = 'https://wa.me/62881027174423',
        footer = '© NHE SYSTEM',
        mentions = [],
        quoted = m,
        forceText = false
    } = content;
    
    console.log(`[ReplyMode]: ${userMode} | User: ${m.sender.split('@')[0]}`);
    
    if (userMode === 'button' && !forceText && buttons.length > 0) {
        try {
            return await button.sendInteractive(text, buttons, {
                title,
                body,
                thumbnailUrl,
                footer
            });
        } catch (err) {
            console.error('❌ Button reply failed, falling back to text:', err.message);
        }
    }
    
    let textContent = text;
    
    if (buttons.length > 0) {
        textContent += formatButtonsToText(buttons);
    }
    
    textContent += `\n\n_${footer}_`;
    
    try {
        return await conn.sendMessage(m.chat, {
            text: textContent,
            mentions: mentions
        }, { quoted });
    } catch (err) {
        console.error('❌ Text reply failed:', err.message);
        return conn.sendMessage(m.chat, { text: text });
    }
};

/**
 * Kirim simple text tanpa button conversion
 * @param {Object} m - Message object
 * @param {Object} Obj - Object berisi conn
 * @param {string} text - Text content
 * @param {Object} options - Optional config
 * @returns {Promise} - Hasil send message
 */
const sendSimpleText = async (m, Obj, text, options = {}) => {
    const { conn } = Obj;
    const userMode = getUserMode(m.sender);
    
    console.log(`[ReplyMode]: ${userMode} (simple) | User: ${m.sender.split('@')[0]}`);
    
    const {
        mentions = [],
        quoted = m
    } = options;
    
    try {
        return await conn.sendMessage(m.chat, {
            text,
            mentions
        }, { quoted });
    } catch (err) {
        console.error('❌ Simple text reply failed:', err.message);
        return null;
    }
};

/**
 * Kirim pesan dengan externalAdReply (card style)
 * @param {Object} m - Message object
 * @param {Object} Obj - Object berisi conn, q
 * @param {string} text - Text content
 * @param {Object} adOptions - ExternalAdReply options
 * @returns {Promise} - Hasil send message
 */
const sendWithExternalAd = async (m, Obj, text, adOptions = {}) => {
    const { conn, q } = Obj;
    const userMode = getUserMode(m.sender);
    
    const {
        title = global.botname || 'NHE BOT',
        body = 'Verified System',
        thumbnailUrl = global.thumbnail || 'https://files.catbox.moe/5x2b8n.jpg',
        sourceUrl = 'https://wa.me/62881027174423',
        quoted = m
    } = adOptions;
    
    if (userMode === 'button') {
        try {
            return await conn.sendMessage(m.chat, {
                text,
                contextInfo: {
                    externalAdReply: {
                        title,
                        body,
                        thumbnailUrl,
                        sourceUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted });
        } catch (err) {
            console.error('❌ ExternalAd reply failed:', err.message);
        }
    }
    
    return sendSimpleText(m, Obj, text, { quoted });
};

module.exports = {
    replyAdaptive,
    sendSimpleText,
    sendWithExternalAd,
    getUserMode,
    formatButtonsToText
};
