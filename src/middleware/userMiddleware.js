/**
 * =========================================
 * FILE: src/middleware/userMiddleware.js
 * DESCRIPTION:
 * Global Middleware Engine - CORE ARCHITECTURE
 * Layer global yang berjalan SEBELUM semua plugin atau case dieksekusi.
 *
 * MODIFICATION (Refactoring):
 * - Added database.json persistence (load on init, save on change)
 * - Added first interaction detection with onboarding
 * - Added restart safety (data restore dari file)
 * - Enhanced XP handling with real-time level recalculation
 * - Sync ke database.json setiap operasi kritis
 *
 * FLOW:
 * Message masuk → middleware jalan → cek register user
 * → jika belum register → tampilkan REGISTER BUTTON (1X SAJA) lalu STOP
 * → jika sudah register → resolve role + level → inject context ke Obj
 * → lanjut ke plugin/case system
 *
 * OUTPUT FORMAT:
 *   Jika BLOCKED: { blocked: true, type: "register", payload: register button UI }
 *   Jika ALLOWED: { blocked: false, ctx: { user, isOwner, isAdmin, isPremium, level, xp, levelProgress, nextLevelXP, levelUp } }
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================
 */

// =========================================
// IMPORTS
// =========================================
const { buildContext, updateContextAfterCommand } = require('./contextBuilder');
const { enforceGate, isRegistered, createUnregisteredUser, processRegistration, isRegisterKeyword, markFirstInteraction } = require('./registerGate');
const { addXP, calculateLevel, recalculateLevelFromXP } = require('./levelSystem');
const { resolveRoles } = require('./roleResolver');
const { syncGlobalDb, forceSave } = require('./databaseSync');

// =========================================
// CONSTANTS
// =========================================
const XP_PER_COMMAND = 5;

// =========================================
// STATE
// =========================================
let isInitialized = false;

// =========================================
// USER MANAGEMENT (ENHANCED)
// =========================================

/**
 * Ensure user exists in global.db.users
 * Creates new user entry if not exists
 * AFTER: Sync ke database.json jika user baru dibuat
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
        // Pastikan level selalu sinkron dengan XP
        recalculateLevelFromXP(usersDb[userId]);
        return usersDb[userId];
    }

    // Create new unregistered user
    const newUser = createUnregisteredUser(userId);
    usersDb[userId] = newUser;

    // CRITICAL: Sync new user ke database.json
    forceSave();
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
// ANTI-SPAM PROTECTION
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
// FIRST INTERACTION HANDLER
// =========================================

/**
 * Handle first interaction for new users
 * Sends onboarding message and marks firstSeen
 *
 * @param {Object} user - User object
 * @param {string} pushName - User display name
 * @returns {boolean} - True if this was first interaction
 */
function handleFirstInteraction(user, pushName = '') {
    if (!user.firstSeen || user.firstSeen === false) {
        markFirstInteraction(user);
        console.log(`[Middleware] First interaction handled for: ${pushName || 'unknown'}`);
        return true;
    }
    return false;
}

// =========================================
// CORE MIDDLEWARE FUNCTION (ENHANCED)
// =========================================

/**
 * Main middleware runner
 * This is THE entry point called by MessageHandler
 *
 * ENHANCEMENTS:
 * - Auto-sync database.json saat startup
 * - First interaction detection
 * - Real-time level recalculation
 * - Persistent data save setelah perubahan
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
        const pushName = m.pushName || 'User';

        if (!userId) {
            console.warn('[Middleware] Cannot identify user, allowing message');
            return {
                blocked: false,
                ctx: buildContext({ user: null, userId: 'unknown', botNumber: '', groupMetadata: null })
            };
        }

        // --- Step 2: Ensure user exists in DB ---
        const user = ensureUserExists(userId);

        // --- Step 3: Handle first interaction ---
        const isFirstTime = handleFirstInteraction(user, pushName);

        // --- Step 4: Check for registration keyword ---
        // If user sends "register" keyword, process registration immediately
        if (isRegisterKeyword(messageText) && !isRegistered(user)) {
            const regResult = processRegistration(user, userId.split('@')[0], pushName);

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
                    registrationResult: regResult,
                    isNewRegistration: true
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

        // --- Step 5: Enforce register gate ---
        const gateResult = enforceGate({ user, userId, messageText, pushName });

        if (gateResult.blocked) {
            // User not registered - return block result
            if (gateResult.silent) {
                // Silent block - don't send anything (anti-spam protection)
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
                payload: gateResult.payload,
                isFirstPrompt: gateResult.isFirstPrompt
            };
        }

        // --- Step 6: User is registered - resolve roles ---
        const botNumber = engine?.user?.id
            ? (engine.user.id.split(":")[0] + "0@s.whatsapp.net" || engine.user.id)
            : '';

        const roles = resolveRoles({
            userId,
            botNumber,
            groupMetadata: m.isGroup ? m.groupMetadata : null
        });

        // --- Step 7: Update XP (if message is a command) ---
        const isCmd = messageText && /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\©^]/.test(messageText);
        let levelUp = false;

        if (isCmd) {
            // Add XP (auto-sync ke database.json di dalam addXP)
            const xpResult = addXP(user, XP_PER_COMMAND);
            levelUp = xpResult.leveledUp;

            // Increment command counter
            user.totalCommand = (user.totalCommand || 0) + 1;

            // Rebuild level info real-time
            recalculateLevelFromXP(user);
        }

        // Update last active
        user.lastActive = Date.now();

        // --- Step 8: Build context ---
        const ctx = buildContext({
            user,
            userId,
            botNumber,
            groupMetadata: m.isGroup ? m.groupMetadata : null,
            levelUp
        });

        // --- Step 9: Return allowed result ---
        return {
            blocked: false,
            ctx,
            levelUp,
            isNewLevel: levelUp,
            isFirstInteraction: isFirstTime
        };

    } catch (error) {
        console.error('[Middleware] Error in userMiddleware:', error);

        // On error, allow message through (fail-open for reliability)
        return {
            blocked: false,
            ctx: buildContext({ user: null, userId: m.sender, botNumber: '', groupMetadata: null }),
            error: error.message
        };
    }
}

// =========================================
// POST-COMMAND TRACKING
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
// UTILITY FUNCTIONS
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
// INIT FUNCTION (ENHANCED)
// =========================================

/**
 * Initialize middleware system
 * - Load database.json ke global.db (RESTART SAFETY)
 * - Ensure global.db.users exists
 * - Setup auto-sync
 */
function initMiddleware() {
    if (isInitialized) {
        console.log('[Middleware] Already initialized, skipping...');
        return;
    }

    console.log('[Middleware] Initializing middleware system...');

    // CRITICAL: Load database.json saat startup
    // Ini memastikan data tidak hilang saat restart
    syncGlobalDb();

    // Ensure users container exists
    if (!global.db) {
        global.db = {};
    }
    if (!global.db.users) {
        global.db.users = {};
    }

    isInitialized = true;

    const stats = getStats();
    console.log('[Middleware] Middleware system initialized');
    console.log(`[Middleware] Users in database: ${stats.totalUsers} (${stats.registeredUsers} registered, ${stats.unregisteredUsers} unregistered)`);
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Core middleware
    userMiddleware,
    initMiddleware,

    // User management
    ensureUserExists,
    getUser,

    // First interaction
    handleFirstInteraction,

    // Post-command
    postCommandUpdate,

    // Stats
    getStats,
    getRegisteredCount,
    getTotalUsersCount
};
