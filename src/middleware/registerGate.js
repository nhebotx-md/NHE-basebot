/**
 * =========================================
 * FILE: src/middleware/registerGate.js
 * DESCRIPTION:
 * Register gate system dengan anti-spam protection.
 * Hard gate: user HARUS register sebelum akses fitur.
 * Anti-spam: button register hanya dikirim 1x.
 *
 * MODIFICATION (Refactoring):
 * - Added database.json persistence sync
 * - Added first interaction detection
 * - Enhanced registration output with full details
 * - Added restart safety (data tidak hilang)
 *
 * FLOW:
 * 1. User belum register → kirim button 1x → set registerPromptSent = true
 * 2. User sudah kirim keyword register → proses registrasi → sync DB
 * 3. User sudah register → ALLOW
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================
 */

// =========================================
// IMPORTS
// =========================================
const { forceSave } = require('./databaseSync');

// =========================================
// CONSTANTS
// =========================================

const REGISTER_KEYWORDS = ['register', 'daftar', '.register', '!register', '#register'];

const REGISTER_MESSAGE = `⚠️ *Kamu belum terdaftar!*

Silakan klik tombol di bawah untuk mendaftar dan mengakses semua fitur bot.`;

const REGISTER_BUTTON_TEXT = '📝 Daftar Sekarang';

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Generate registration code
 * Format: REG-<last4digits>-<timestamp4>
 * @param {string} phoneNumber - User phone number
 * @returns {string} - Registration code
 */
function generateRegCode(phoneNumber) {
    const last4 = phoneNumber.slice(-4);
    const timestamp4 = Date.now().toString().slice(-4);
    return `REG-${last4}-${timestamp4}`;
}

/**
 * Check if text contains register keyword
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isRegisterKeyword(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase().trim();
    return REGISTER_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// =========================================
// FIRST INTERACTION DETECTION
// =========================================

/**
 * Check if this is user's first interaction
 * @param {Object} user - User object from global.db.users
 * @returns {boolean}
 */
function isFirstInteraction(user) {
    return !user.firstSeen || user.firstSeen === false;
}

/**
 * Mark first interaction and set onboarding state
 * @param {Object} user - User object
 */
function markFirstInteraction(user) {
    user.firstSeen = true;
    user.firstInteractionAt = Date.now();
    console.log(`[RegisterGate] First interaction marked for user`);
}

/**
 * Build first-time onboarding message
 * @param {string} pushName - User display name
 * @returns {string} - Onboarding text
 */
function buildOnboardingMessage(pushName) {
    const botName = global.botname || 'NHE BOT';
    return `👋 *Halo ${pushName || 'Pengguna Baru'}!*

Selamat datang di *${botName}*! 🤖

Untuk menggunakan semua fitur bot, kamu perlu mendaftar terlebih dahulu.

📌 *Caranya:*
Klik tombol "Daftar" di bawah ini atau ketik *.register*

✨ Setelah terdaftar, kamu akan mendapatkan:
• Akses ke semua fitur bot
• Sistem Level & XP
• Tracking progress kamu

Yuk daftar sekarang! 🚀`;
}

// =========================================
// USER REGISTRATION CHECK
// =========================================

/**
 * Check if user is registered
 * @param {Object} user - User object from global.db.users
 * @returns {boolean}
 */
function isRegistered(user) {
    return user && user.registered === true;
}

/**
 * Check if register prompt was already sent
 * @param {Object} user - User object from global.db.users
 * @returns {boolean}
 */
function wasPromptSent(user) {
    return user && user.registerPromptSent === true;
}

/**
 * Determine if we should send register button
 * Rules:
 * - Send if prompt never sent
 * - Send if user explicitly sends register keyword
 * - Don't send if already sent and no keyword
 *
 * @param {Object} user - User object
 * @param {string} messageText - Current message text
 * @returns {boolean}
 */
function shouldSendPrompt(user, messageText) {
    // If user sends register keyword, always allow resend
    if (isRegisterKeyword(messageText)) return true;

    // If prompt already sent, don't send again
    if (wasPromptSent(user)) return false;

    // First time - send prompt
    return true;
}

// =========================================
// REGISTRATION PROCESS (ENHANCED)
// =========================================

/**
 * Build informative registration success message
 * @param {Object} user - User object
 * @param {string} regCode - Registration code
 * @returns {string} - Formatted message
 */
function buildRegistrationSuccessMessage(user, regCode) {
    const phoneNumber = user.userId ? user.userId.split('@')[0] : 'Unknown';
    const dateStr = new Date(user.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
📌 *REGISTRASI BERHASIL* ✅

╭─────────────────────────
│ 👤 *Nama:* ${user.alias || 'User'}
│ 📱 *Nomor:* ${phoneNumber}
│ 🔖 *Kode:* \`${regCode}\`
│ ⭐ *Level:* ${user.level || 1}
│ ✨ *XP:* ${user.xp || 0}
│ 🎭 *Role:* User
│ 📅 *Tanggal:* ${dateStr}
╰─────────────────────────

Selamat datang, *${user.alias || 'User'}*! 🎉

Ketik *.menu* untuk melihat fitur yang tersedia.
Ketik *.myinfo* atau *.cekprof* untuk melihat profilmu.`;
}

/**
 * Process user registration
 * UPDATED: Now syncs to database.json immediately
 *
 * @param {Object} user - User object from global.db.users
 * @param {string} phoneNumber - User phone number
 * @param {string} pushName - User display name (optional)
 * @returns {Object} - Registration result
 */
function processRegistration(user, phoneNumber, pushName = 'User') {
    if (!user) {
        return {
            success: false,
            error: 'User data not found'
        };
    }

    if (user.registered) {
        return {
            success: false,
            alreadyRegistered: true,
            message: '✅ Kamu sudah terdaftar!\n\nKetik *.myinfo* untuk melihat profilmu.'
        };
    }

    // Generate registration code
    const regCode = generateRegCode(phoneNumber);

    // Update user data with ALL required fields
    user.registered = true;
    user.regCode = regCode;
    user.createdAt = Date.now();
    user.registerPromptSent = true;
    user.alias = pushName || user.alias || 'User';
    user.level = 1;
    user.xp = 0;
    user.totalCommand = 0;
    user.role = {
        owner: false,
        admin: false,
        premium: false
    };

    // Mark first interaction if not already
    if (!user.firstSeen) {
        user.firstSeen = true;
        user.firstInteractionAt = Date.now();
    }

    // Build informative success message
    const successMessage = buildRegistrationSuccessMessage(user, regCode);

    // CRITICAL: Sync to database.json immediately
    forceSave();
    console.log(`[RegisterGate] User registered: ${phoneNumber}, Code: ${regCode}`);

    return {
        success: true,
        regCode,
        message: successMessage,
        userData: {
            name: user.alias,
            number: phoneNumber,
            regCode,
            level: user.level,
            xp: user.xp,
            role: 'User',
            date: new Date(user.createdAt).toISOString()
        }
    };
}

/**
 * Create a new unregistered user entry
 * @param {string} userId - User JID
 * @returns {Object} - New user object
 */
function createUnregisteredUser(userId) {
    return {
        userId: userId,
        registered: false,
        registerPromptSent: false,
        firstSeen: false,
        firstInteractionAt: 0,
        regCode: null,
        alias: 'User',
        xp: 0,
        level: 1,
        role: {
            owner: false,
            admin: false,
            premium: false
        },
        createdAt: 0,
        lastActive: 0,
        totalCommand: 0
    };
}

// =========================================
// REGISTER BUTTON UI
// =========================================

/**
 * Build register button payload for Baileys
 * @param {boolean} isFirstTime - Whether this is first interaction
 * @param {string} pushName - User display name
 * @returns {Object} - Button message payload
 */
function buildRegisterButton(isFirstTime = false, pushName = '') {
    let text = REGISTER_MESSAGE;

    // If first time, show onboarding message
    if (isFirstTime) {
        text = buildOnboardingMessage(pushName);
    }

    return {
        text: text,
        buttons: [
            {
                buttonId: '.register',
                buttonText: { displayText: REGISTER_BUTTON_TEXT },
                type: 1
            }
        ],
        headerType: 1,
        contextInfo: {
            externalAdReply: {
                title: isFirstTime ? '👋 Selamat Datang!' : 'Pendaftaran Diperlukan',
                body: 'Klik tombol untuk mendaftar',
                thumbnailUrl: global.thumbnail || 'https://files.catbox.moe/5x2b8n.jpg',
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    };
}

/**
 * Mark that register prompt has been sent
 * @param {Object} user - User object
 */
function markPromptSent(user) {
    if (user) {
        user.registerPromptSent = true;
        // Sync to file
        forceSave();
    }
}

/**
 * Reset register prompt flag (for manual retry)
 * @param {Object} user - User object
 */
function resetPromptFlag(user) {
    if (user) {
        user.registerPromptSent = false;
        forceSave();
    }
}

// =========================================
// GATE ENFORCEMENT (ENHANCED)
// =========================================

/**
 * Enforce register gate
 * Returns result indicating whether user should be blocked
 *
 * UPDATED: Now handles first interaction detection
 *
 * @param {Object} params - Parameters
 * @param {Object} params.user - User object from DB
 * @param {string} params.userId - User JID
 * @param {string} params.messageText - Current message text
 * @param {string} params.pushName - User display name (optional)
 * @returns {Object} - Gate result
 */
function enforceGate({ user, userId, messageText, pushName = '' }) {
    // User is registered - allow
    if (isRegistered(user)) {
        return {
            blocked: false,
            allowed: true,
            reason: null
        };
    }

    // Check first interaction
    const firstTime = isFirstInteraction(user);
    if (firstTime) {
        markFirstInteraction(user);
    }

    // User not registered - check if we should send prompt
    const canSendPrompt = shouldSendPrompt(user, messageText);

    if (canSendPrompt) {
        // Mark prompt as sent to prevent spam
        markPromptSent(user);

        // CRITICAL: Save state ke database.json
        forceSave();

        return {
            blocked: true,
            allowed: false,
            reason: 'register_required',
            type: '.register',
            payload: buildRegisterButton(firstTime, pushName),
            isFirstPrompt: firstTime
        };
    }

    // Prompt already sent, user sending non-register messages
    // Silently ignore to prevent spam
    return {
        blocked: true,
        allowed: false,
        reason: 'awaiting_registration',
        type: 'silent_block',
        payload: null,
        silent: true
    };
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Gate enforcement
    enforceGate,
    isRegistered,
    shouldSendPrompt,
    wasPromptSent,

    // Registration process
    processRegistration,
    generateRegCode,
    createUnregisteredUser,

    // First interaction
    isFirstInteraction,
    markFirstInteraction,
    buildOnboardingMessage,

    // Button UI
    buildRegisterButton,

    // Flag management
    markPromptSent,
    resetPromptFlag,

    // Keyword detection
    isRegisterKeyword,
    REGISTER_KEYWORDS,

    // Constants
    REGISTER_MESSAGE,
    REGISTER_BUTTON_TEXT
};
