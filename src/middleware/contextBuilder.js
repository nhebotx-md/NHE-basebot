/**
 * =========================================
 * 📌 FILE: src/middleware/contextBuilder.js
 * 📌 DESCRIPTION:
 * Context builder untuk menyusun context object
 * yang akan di-inject ke semua plugin dan case handlers.
 *
 * Semua plugin WAJIB mengakses data user melalui ctx.
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================
 */

const { calculateLevel, getLevelProgress, formatLevelInfo } = require('./levelSystem');
const { resolveRoles, formatRole } = require('./roleResolver');

// =========================================
// 📌 CONTEXT BUILDER
// =========================================

/**
 * Build context object for plugin execution
 * This context is injected to ALL plugins and case handlers
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
            levelUp: false,
            totalCommand: 0,
            lastActive: 0,
            createdAt: 0
        };
    }

    // Resolve roles
    const roles = resolveRoles({ userId, botNumber, groupMetadata });

    // Calculate level info
    const levelInfo = getLevelProgress(user.xp || 0);

    // Build comprehensive context
    const ctx = {
        // Core user data
        user,
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

        // Level & XP
        level: user.level || levelInfo.level,
        xp: user.xp || 0,
        levelProgress: levelInfo,
        levelUp,

        // Stats
        totalCommand: user.totalCommand || 0,
        lastActive: user.lastActive || 0,
        createdAt: user.createdAt || 0,
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

    // Update context
    ctx.totalCommand = user.totalCommand;
    ctx.lastActive = user.lastActive;

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
// 📌 EXPORT
// =========================================
module.exports = {
    buildContext,
    updateContextAfterCommand,
    injectContext,
    getRolePriority
};
