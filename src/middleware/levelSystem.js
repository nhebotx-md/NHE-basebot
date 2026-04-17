/**
 * =========================================
 * 📌 FILE: src/middleware/levelSystem.js
 * 📌 DESCRIPTION:
 * Global leveling system berbasis XP.
 * 100 XP = naik 1 level.
 * Setiap command valid = +XP (default 5)
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================

 */

// =========================================
// 📌 CONSTANTS
// =========================================

const XP_PER_LEVEL = 100;        // XP needed to level up
const DEFAULT_XP_GAIN = 5;       // XP gained per valid command
const MAX_LEVEL = 999;           // Maximum level cap

// =========================================
// 📌 XP & LEVEL CALCULATION
// =========================================

/**
 * Calculate level from total XP
 * Formula: level = floor(xp / 100) + 1
 * @param {number} xp - Total XP
 * @returns {number} - Current level (min 1)
 */
function calculateLevel(xp) {
    if (!xp || xp < 0) return 1;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    return Math.min(level, MAX_LEVEL);
}

/**
 * Calculate XP needed for specific level
 * @param {number} level - Target level
 * @returns {number} - XP required
 */
function xpForLevel(level) {
    if (level <= 1) return 0;
    return (level - 1) * XP_PER_LEVEL;
}

/**
 * Calculate XP progress in current level
 * @param {number} xp - Total XP
 * @returns {Object} - Progress info
 */
function getLevelProgress(xp) {
    const currentLevel = calculateLevel(xp);
    const xpForCurrent = xpForLevel(currentLevel);
    const xpForNext = xpForLevel(currentLevel + 1);
    const currentLevelXp = xp - xpForCurrent;
    const xpNeeded = xpForNext - xpForCurrent;
    const percentage = Math.min(100, Math.floor((currentLevelXp / xpNeeded) * 100));

    return {
        level: currentLevel,
        currentXp: currentLevelXp,
        neededXp: xpNeeded,
        percentage,
        totalXp: xp
    };
}

// =========================================
// 📌 USER XP OPERATIONS
// =========================================

/**
 * Add XP to user and check for level up
 * @param {Object} user - User object from global.db.users
 * @param {number} amount - XP amount to add (default 5)
 * @returns {Object} - Result with levelUp status and info
 */
function addXP(user, amount = DEFAULT_XP_GAIN) {
    if (!user) {
        return {
            success: false,
            leveledUp: false,
            error: 'User not found'
        };
    }

    // Initialize XP if not exists
    if (typeof user.xp !== 'number') user.xp = 0;
    if (typeof user.level !== 'number') user.level = 1;

    const oldLevel = user.level;
    const oldXp = user.xp;

    // Add XP
    user.xp += amount;

    // Calculate new level
    const newLevel = calculateLevel(user.xp);
    user.level = newLevel;

    const leveledUp = newLevel > oldLevel;

    return {
        success: true,
        leveledUp,
        oldLevel,
        newLevel,
        oldXp,
        newXp: user.xp,
        xpGained: amount,
        message: leveledUp
            ? `🎉 Level Up! ${oldLevel} → ${newLevel}`
            : `✨ +${amount} XP`
    };
}

/**
 * Set specific XP for user (admin/owner utility)
 * @param {Object} user - User object
 * @param {number} xp - XP to set
 * @returns {Object} - Result
 */
function setXP(user, xp) {
    if (!user) return { success: false, error: 'User not found' };

    user.xp = Math.max(0, xp);
    user.level = calculateLevel(user.xp);

    return {
        success: true,
        level: user.level,
        xp: user.xp
    };
}

/**
 * Set specific level for user
 * @param {Object} user - User object
 * @param {number} level - Level to set
 * @returns {Object} - Result
 */
function setLevel(user, level) {
    if (!user) return { success: false, error: 'User not found' };

    const targetLevel = Math.max(1, Math.min(level, MAX_LEVEL));
    user.level = targetLevel;
    user.xp = xpForLevel(targetLevel);

    return {
        success: true,
        level: targetLevel,
        xp: user.xp
    };
}

/**
 * Get leaderboard data sorted by XP
 * @param {Object} usersDb - global.db.users object
 * @param {number} limit - Number of top users to return
 * @returns {Array} - Sorted leaderboard
 */
function getLeaderboard(usersDb, limit = 10) {
    if (!usersDb) return [];

    return Object.entries(usersDb)
        .map(([userId, data]) => ({
            userId,
            ...data,
            level: calculateLevel(data.xp || 0)
        }))
        .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        .slice(0, limit);
}

// =========================================
// 📌 FORMATTING
// =========================================

/**
 * Format level display with progress bar
 * @param {Object} user - User object
 * @returns {string} - Formatted level info
 */
function formatLevelInfo(user) {
    if (!user) return 'Level: 1 | XP: 0/100';

    const progress = getLevelProgress(user.xp || 0);
    const bar = '█'.repeat(Math.floor(progress.percentage / 10)) +
                '░'.repeat(10 - Math.floor(progress.percentage / 10));

    return `Level ${progress.level} [${bar}] ${progress.percentage}%\n` +
           `XP: ${progress.currentXp}/${progress.neededXp} (Total: ${progress.totalXp})`;
}

// =========================================
// 📌 EXPORT
// =========================================
module.exports = {
    // Core functions
    addXP,
    calculateLevel,
    xpForLevel,
    getLevelProgress,
    setXP,
    setLevel,
    getLeaderboard,
    formatLevelInfo,

    // Constants
    XP_PER_LEVEL,
    DEFAULT_XP_GAIN,
    MAX_LEVEL
};
