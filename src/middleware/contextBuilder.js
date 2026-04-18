/**
 * =========================================
 * FILE: src/middleware/contextBuilder.js
 * DESCRIPTION:
 * Context builder untuk menyusun context object
 * yang akan di-inject ke semua plugin dan case handlers.
 *
 * MODIFICATION (Refactoring):
 * - Added levelProgress & nextLevelXP ke context
 * - Added percentage & progress bar
 * - Added registration date formatting
 * - Ensures real-time level calculation
 *
 * Semua plugin WAJIB mengakses data user melalui ctx.
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================
 */

const { calculateLevel, getLevelProgress, formatLevelInfo, getCompactLevelData, recalculateLevelFromXP } = require('./levelSystem');
const { resolveRoles, formatRole } = require('./roleResolver');

// =========================================
// CONTEXT BUILDER
// =========================================

/**
 * Build context object for plugin execution
 * This context is injected to ALL plugins and case handlers
 *
 * CONTEXT STRUCTURE (WAJIB tersedia di semua plugin):
 * {
 *   user, isOwner, isAdmin, isPremium,
 *   level, xp, levelProgress, nextLevelXP, levelUp
 * }
 *
 * @param {Object} params - Build parameters
 * @param {Object} params.user - User object from global.db.users
 * @param {string} params.userId - User JID
 * @param {string} params.botNumber - Bot JID
 * @param {Object} params.groupMetadata - Group metadata (optional)
 * @param {boolean} params.levelUp - Whether user just leveled up
 * @returns {Object} - Context object for plugins
 */
function buildContext({ user, userId, botNumber, groupMetadata, levelUp = false }) {
    if (!user) {
        // Return minimal context for unregistered users
        // (should be blocked by register gate before reaching here)
        return {
            user: null,
            userId,
            isOwner: false,
            isAdmin: false,
            isPremium: false,
            isUser: true,
            role: 'unregistered',
            roleDisplay: '❌ Unregistered',
            level: 0,
            xp: 0,
            levelProgress: 0,
            nextLevelXP: 100,
            neededXp: 100,
            percentage: 0,
            progressBar: '░░░░░░░░░░',
            levelUp: false,
            totalCommand: 0,
            lastActive: 0,
            createdAt: 0,
            isRegistered: false,
            regCode: null
        };
    }

    // Pastikan level selalu dihitung real-time dari XP
    recalculateLevelFromXP(user);

    // Resolve roles
    const roles = resolveRoles({ userId, botNumber, groupMetadata });

    // Calculate level info (real-time dari XP)
    const levelInfo = getLevelProgress(user.xp || 0);
    const compactLevel = getCompactLevelData(user.xp || 0);

    // Format registration date
    const regDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'Belum terdaftar';
// Extract number dari JID (WAJIB ADA)
let number = 'unknown';

if (typeof userId === 'string' && userId.includes('@')) {
    number = userId.split('@')[0];
} else {
    console.warn('[ContextBuilder] Invalid userId:', userId);
}
    // Build comprehensive context
    const ctx = {
        // Core user data
        user,
        number,
        jid: userId,
        userId,

        // Role flags (convenient access)
        isOwner: roles.isOwner,
        isAdmin: roles.isAdmin,
        isPremium: roles.isPremium,
        isUser: roles.isUser,

        // Role info
        role: roles.highestRole,
        roleDisplay: formatRole(roles.highestRole),
        rolePriority: roles.priority,

        // Level & XP (REAL-TIME dari XP)
        level: levelInfo.level,
        xp: user.xp || 0,

        // Level progress data (WAJIB ada untuk plugin myinfo)
        levelProgress: levelInfo.currentXp,      // XP di level saat ini
        nextLevelXP: levelInfo.nextLevelXP,      // Sisa XP menuju level berikutnya
        neededXp: levelInfo.neededXp,            // Total XP needed for current level
        percentage: levelInfo.percentage,        // Progress percentage
        progressBar: compactLevel.progressBar,   // Text progress bar

        // Level up notification flag
        levelUp,

        // Stats
        totalCommand: user.totalCommand || 0,
        lastActive: user.lastActive || 0,
        createdAt: user.createdAt || 0,
        regDate,                                 // Formatted registration date
        alias: user.alias || 'User',

        // Registration info
        isRegistered: user.registered === true,
        regCode: user.regCode || null,

        // Helper methods
        hasRole: (requiredRole) => roles.priority >= (getRolePriority(requiredRole) || 1),
        getLevelInfo: () => formatLevelInfo(user)
    };

    return ctx;
}

/**
 * Get role priority number
 * @param {string} role - Role name
 * @returns {number} - Priority value
 */
function getRolePriority(role) {
    const priorities = {
        owner: 4,
        admin: 3,
        premium: 2,
        user: 1
    };
    return priorities[role] || 1;
}

/**
 * Update context after command execution
 * Increments total command, updates last active
 *
 * @param {Object} user - User object from DB
 * @param {Object} ctx - Existing context
 * @returns {Object} - Updated context
 */
function updateContextAfterCommand(user, ctx) {
    if (!user || !ctx) return ctx;

    // Update stats
    user.totalCommand = (user.totalCommand || 0) + 1;
    user.lastActive = Date.now();

    // Rebuild level info (real-time)
    const levelInfo = getLevelProgress(user.xp || 0);

    // Update context
    ctx.totalCommand = user.totalCommand;
    ctx.lastActive = user.lastActive;
    ctx.levelProgress = levelInfo.currentXp;
    ctx.nextLevelXP = levelInfo.nextLevelXP;
    ctx.percentage = levelInfo.percentage;

    return ctx;
}

/**
 * Merge context with existing message object
 * This is called in the main handler to inject ctx
 *
 * @param {Object} m - Message object (from smsg)
 * @param {Object} ctx - Context object from buildContext
 * @returns {Object} - Message object with ctx attached
 */
function injectContext(m, ctx) {
    if (!m) return m;
    m.ctx = ctx;
    return m;
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    buildContext,
    updateContextAfterCommand,
    injectContext,
    getRolePriority
};
