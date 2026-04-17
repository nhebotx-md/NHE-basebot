/**
 * =========================================
 * 📌 FILE: src/middleware/userMiddleware.js
 * 📌 DESCRIPTION:
 * Global Middleware Engine - CORE ARCHITECTURE
 * Layer global yang berjalan SEBELUM semua plugin atau case dieksekusi.
 *
 * FLOW:
 * Message masuk → middleware jalan → cek register user
 * → jika belum register → tampilkan REGISTER BUTTON (1X SAJA) lalu STOP
 * → jika sudah register → resolve role + level → inject context ke Obj
 * → lanjut ke plugin/case system
 *
 * OUTPUT FORMAT:
 *   Jika BLOCKED: { blocked: true, type: "register", payload: register button UI }
 *   Jika ALLOWED: { blocked: false, ctx: { user, isOwner, isAdmin, isPremium, level, xp, levelUp } }
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================
 */

// =========================================
// 📌 IMPORTS
// =========================================
const { buildContext, updateContextAfterCommand } = require('./contextBuilder');
const { enforceGate, isRegistered, createUnregisteredUser, processRegistration, isRegisterKeyword } = require('./registerGate');
const { addXP, calculateLevel } = require('./levelSystem');
const { resolveRoles } = require('./roleResolver');

// =========================================
// 📌 CONSTANTS
// =========================================
const XP_PER_COMMAND = 5;

// =========================================
// 📌 USER MANAGEMENT
// =========================================

/**
 * Ensure user exists in global.db.users
 * Creates new user entry if not exists
 *
 * @param {string} userId - User JID
 * @returns {Object} - User object (existing or newly created)
 */
function ensureUserExists(userId) {
    // Ensure global.db exists
    if (!global.db) {
        global.db = { users: {} };
    }
    if (!global.db.users) {
        global.db.users = {};
    }

    const usersDb = global.db.users;

    // Return existing user
    if (usersDb[userId]) {
        return usersDb[userId];
    }

    // Create new unregistered user
    const newUser = createUnregisteredUser(userId);
    usersDb[userId] = newUser;

    console.log(`[Middleware] New user created: ${userId}`);
    return newUser;
}

/**
 * Get user from database
 * @param {string} userId - User JID
 * @returns {Object|null} - User object or null
 */
function getUser(userId) {
    if (!global.db || !global.db.users) return null;
    return global.db.users[userId] || null;
}

// =========================================
// 📌 ANTI-SPAM PROTECTION
// =========================================

// In-memory tracking for rate limiting (resets on restart)
const spamTracker = new Map();

/**
 * Check if user is being rate limited
 * @param {string} userId - User JID
 * @returns {boolean}
 */
function isRateLimited(userId) {
    const now = Date.now();
    const lastRequest = spamTracker.get(userId);

    if (!lastRequest) {
        spamTracker.set(userId, now);
        return false;
    }

    // 3-second cooldown between register prompts
    if (now - lastRequest < 3000) {
        return true;
    }

    spamTracker.set(userId, now);
    return false;
}

// =========================================
// 📌 CORE MIDDLEWARE FUNCTION
// =========================================

/**
 * Main middleware runner
 * This is THE entry point called by MessageHandler
 *
 * @param {Object} m - Serialized message object (from smsg)
 * @param {Object} globalState - Global state object
 * @param {Object} engine - Engine/socket instance (WhosTANG)
 * @returns {Object} - Middleware result
 */
function userMiddleware(m, globalState, engine) {
    try {
        // --- Step 1: Extract user info ---
        const userId = m.sender || m.key?.participant || m.key?.remoteJid;
        const messageText = m.text || m.body || '';

        if (!userId) {
            console.warn('[Middleware] Cannot identify user, allowing message');
            return {
                blocked: false,
                ctx: buildContext({ user: null, userId: 'unknown', botNumber: '', groupMetadata: null })
            };
        }

        // --- Step 2: Ensure user exists in DB ---
        const user = ensureUserExists(userId);

        // --- Step 3: Check for registration keyword ---
        // If user sends "register" keyword, process registration immediately
        if (isRegisterKeyword(messageText) && !isRegistered(user)) {
            const regResult = processRegistration(user, userId.split('@')[0]);

            if (regResult.success) {
                // Build context for newly registered user
                const botNumber = engine?.user?.id
                    ? (engine.user.id.split(":")[0] + "0@s.whatsapp.net" || engine.user.id)
                    : '';

                const ctx = buildContext({
                    user,
                    userId,
                    botNumber,
                    groupMetadata: m.isGroup ? m.groupMetadata : null,
                    levelUp: false
                });

                return {
                    blocked: false,
                    ctx,
                    registrationResult: regResult
                };
            }

            // Registration failed but still blocked
            return {
                blocked: true,
                type: 'register',
                payload: {
                    text: regResult.message || 'Registrasi gagal. Silakan coba lagi.',
                    contextInfo: {
                        externalAdReply: {
                            title: 'Registrasi',
                            body: 'Coba lagi',
                            thumbnailUrl: global.thumbnail || '',
                            mediaType: 1
                        }
                    }
                }
            };
        }

        // --- Step 4: Enforce register gate ---
        const gateResult = enforceGate({ user, userId, messageText });

        if (gateResult.blocked) {
            // User not registered - return block result
            if (gateResult.silent) {
                // Silent block - don't send anything, just stop execution
                return {
                    blocked: true,
                    type: 'silent_block',
                    silent: true,
                    payload: null
                };
            }

            return {
                blocked: true,
                type: gateResult.type || 'register',
                payload: gateResult.payload
            };
        }

        // --- Step 5: User is registered - resolve roles ---
        const botNumber = engine?.user?.id
            ? (engine.user.id.split(":")[0] + "0@s.whatsapp.net" || engine.user.id)
            : '';

        const roles = resolveRoles({
            userId,
            botNumber,
            groupMetadata: m.isGroup ? m.groupMetadata : null
        });

        // --- Step 6: Update XP (if message is a command) ---
        const isCmd = messageText && /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\©^]/.test(messageText);
        let levelUp = false;

        if (isCmd) {
            const xpResult = addXP(user, XP_PER_COMMAND);
            levelUp = xpResult.leveledUp;

            // Increment command counter
            user.totalCommand = (user.totalCommand || 0) + 1;
        }

        // Update last active
        user.lastActive = Date.now();

        // --- Step 7: Build context ---
        const ctx = buildContext({
            user,
            userId,
            botNumber,
            groupMetadata: m.isGroup ? m.groupMetadata : null,
            levelUp
        });

        // --- Step 8: Return allowed result ---
        return {
            blocked: false,
            ctx,
            levelUp,
            isNewLevel: levelUp
        };

    } catch (error) {
        console.error('[Middleware] Error in userMiddleware:', error);

        // On error, allow message through (fail-open for reliability)
        // But log the error for debugging
        return {
            blocked: false,
            ctx: buildContext({ user: null, userId: m.sender, botNumber: '', groupMetadata: null }),
            error: error.message
        };
    }
}

// =========================================
// 📌 POST-COMMAND TRACKING
// =========================================

/**
 * Update user stats after command execution
 * Call this AFTER plugin/case execution completes
 *
 * @param {string} userId - User JID
 * @param {Object} ctx - Current context
 * @returns {Object} - Updated context
 */
function postCommandUpdate(userId, ctx) {
    const user = getUser(userId);
    if (!user || !ctx) return ctx;

    return updateContextAfterCommand(user, ctx);
}

// =========================================
// 📌 UTILITY FUNCTIONS
// =========================================

/**
 * Get all registered users count
 * @returns {number}
 */
function getRegisteredCount() {
    if (!global.db || !global.db.users) return 0;
    return Object.values(global.db.users).filter(u => u.registered).length;
}

/**
 * Get total users count (registered + unregistered)
 * @returns {number}
 */
function getTotalUsersCount() {
    if (!global.db || !global.db.users) return 0;
    return Object.keys(global.db.users).length;
}

/**
 * Get middleware stats
 * @returns {Object}
 */
function getStats() {
    return {
        registeredUsers: getRegisteredCount(),
        totalUsers: getTotalUsersCount(),
        unregisteredUsers: getTotalUsersCount() - getRegisteredCount()
    };
}

// =========================================
// 📌 INIT FUNCTION (called on startup)
// =========================================

/**
 * Initialize middleware system
 * Ensures global.db.users exists
 */
function initMiddleware() {
    if (!global.db) {
        global.db = {};
    }
    if (!global.db.users) {
        global.db.users = {};
    }
    console.log('[Middleware] Global middleware system initialized');
    console.log(`[Middleware] Users in database: ${getTotalUsersCount()}`);
}

// =========================================
// 📌 EXPORT
// =========================================
module.exports = {
    // Core middleware
    userMiddleware,
    initMiddleware,

    // User management
    ensureUserExists,
    getUser,

    // Post-command
    postCommandUpdate,

    // Stats
    getStats,
    getRegisteredCount,
    getTotalUsersCount
};
