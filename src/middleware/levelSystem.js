/**
 * =========================================
 * FILE: src/middleware/levelSystem.js
 * DESCRIPTION:
 * Global leveling system berbasis XP.
 * 100 XP = naik 1 level.
 * Setiap command valid = +XP (default 5)
 *
 * MODIFICATION (Refactoring):
 * - Level SELALU dihitung real-time dari XP (no stale cache)
 * - Added levelProgress & nextLevelXP untuk context
 * - Added force level recalculation function
 * - Sync ke database.json setiap perubahan
 *
 * FORMULA:
 * - level = Math.floor(xp / 100) + 1
 * - levelProgress = xp % 100
 * - nextLevelXP = 100 - (xp % 100)
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

const XP_PER_LEVEL = 100;        // XP needed to level up
const DEFAULT_XP_GAIN = 5;       // XP gained per valid command
const MAX_LEVEL = 999;           // Maximum level cap

// =========================================
// XP & LEVEL CALCULATION (REAL-TIME)
// =========================================

/**
 * Calculate level from total XP
 * FORMULA: level = floor(xp / 100) + 1
 * SELALU hitung dari XP, tidak pernah dari cache.
 *
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
        nextLevelXP: Math.max(0, (xpNeeded || 0) - (currentLevelXp || 0)),  // Sisa XP menuju level berikutnya
        levelProgress: currentLevelXp,             // XP progress di level saat ini
        percentage,
        totalXp: xp
    };
}

/**
 * Recalculate level from XP and update user object
 * FUNGSI KRUSIAL: Dipanggil setiap request untuk memastikan
 * level selalu sinkron dengan XP (real-time calculation).
 *
 * @param {Object} user - User object from global.db.users
 * @returns {boolean} - True if level was corrected
 */
function recalculateLevelFromXP(user) {
    if (!user) return false;

    // Normalize XP
    if (typeof user.xp !== 'number') user.xp = 0;

    // Calculate what level SHOULD be based on XP
    const correctLevel = calculateLevel(user.xp);

    // If level doesn't match, correct it
    if (user.level !== correctLevel) {
        const oldLevel = user.level;
        user.level = correctLevel;
        console.log(`[LevelSystem] Level corrected: ${oldLevel} → ${correctLevel} (XP: ${user.xp})`);
        return true;
    }

    return false;
}

// =========================================
// USER XP OPERATIONS
// =========================================

/**
 * Add XP to user and check for level up
 * Setelah operasi ini, level SELALU dihitung ulang dari XP.
 *
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

    // ALWAYS recalculate level from XP (real-time, no cache)
    const newLevel = calculateLevel(user.xp);
    user.level = newLevel;

    const leveledUp = newLevel > oldLevel;

    // Sync to database.json
    forceSave();

    return {
        success: true,
        leveledUp,
        oldLevel,
        newLevel,
        oldXp,
        newXp: user.xp,
        xpGained: amount,
        progress: getLevelProgress(user.xp),
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

    // Sync to database
    forceSave();

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

    // Sync to database
    forceSave();

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
        .filter(([_, data]) => data.registered) // Hanya yang sudah register
        .map(([userId, data]) => ({
            userId,
            ...data,
            level: calculateLevel(data.xp || 0)
        }))
        .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        .slice(0, limit);
}

// =========================================
// FORMATTING
// =========================================

/**
 * Generate text-based progress bar
 * @param {number} percentage - Progress percentage (0-100)
 * @param {number} length - Bar length
 * @returns {string} - Progress bar string
 */
function generateProgressBar(percentage, length = 10) {
    const filled = Math.floor((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format level display with progress bar
 * @param {Object} user - User object
 * @returns {string} - Formatted level info
 */
function formatLevelInfo(user) {
    if (!user) return 'Level: 1 | XP: 0/100';

    const progress = getLevelProgress(user.xp || 0);
    const bar = generateProgressBar(progress.percentage);

    return `Level ${progress.level} [${bar}] ${progress.percentage}%\n` +
           `XP: ${progress.levelProgress}/${progress.neededXp} (Total: ${progress.totalXp})\n` +
           `Menuju Level ${progress.level + 1}: ${progress.nextLevelXP} XP lagi`;
}

/**
 * Format compact level info untuk context
 * @param {number} xp - Total XP
 * @returns {Object} - Compact level data
 */
function getCompactLevelData(xp) {
    const progress = getLevelProgress(xp || 0);
    return {
        level: progress.level,
        xp: progress.totalXp,
        levelProgress: progress.levelProgress,
        nextLevelXP: progress.nextLevelXP,
        neededXp: progress.neededXp,
        percentage: progress.percentage,
        progressBar: generateProgressBar(progress.percentage)
    };
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Core functions
    addXP,
    calculateLevel,
    xpForLevel,
    getLevelProgress,
    recalculateLevelFromXP,
    setXP,
    setLevel,
    getLeaderboard,
    formatLevelInfo,

    // Formatting
    generateProgressBar,
    getCompactLevelData,

    // Constants
    XP_PER_LEVEL,
    DEFAULT_XP_GAIN,
    MAX_LEVEL
};
