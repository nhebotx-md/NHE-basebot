/**
 * =========================================
 * 📌 FILE: src/middleware/roleResolver.js
 * 📌 DESCRIPTION:
 * Role resolver module untuk sistem hak akses.
 * Mengimplementasikan priority role system:
 * OWNER > ADMIN > PREMIUM > USER
 *
 * 📁 RULE: FOLDER ISOLATION SYSTEM
 * =========================================
 */

const fs = require('fs');
const path = require('path');

// =========================================
// 📌 CONSTANTS
// =========================================
const OWNER_PATH = path.join(process.cwd(), './data/owner.json');
const PREMIUM_PATH = path.join(process.cwd(), './data/premium.json');

// Priority: higher number = higher priority
const ROLE_PRIORITY = {
    owner: 4,
    admin: 3,
    premium: 2,
    user: 1
};

// =========================================
// 📌 HELPER FUNCTIONS
// =========================================

/**
 * Load and parse JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Array} - Parsed JSON or empty array
 */
function loadJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error(`[RoleResolver] Error loading ${filePath}:`, error.message);
        return [];
    }
}

/**
 * Normalize JID to bare number format
 * @param {string} jid - WhatsApp JID
 * @returns {string} - Normalized JID
 */
function normalizeJid(jid) {
    if (!jid) return '';
    return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

// =========================================
// 📌 CORE FUNCTIONS
// =========================================

/**
 * Check if user is OWNER
 * @param {string} userId - User JID
 * @param {string} botNumber - Bot JID
 * @returns {boolean}
 */
function isOwner(userId, botNumber) {
    const owners = loadJsonFile(OWNER_PATH);
    const globalOwners = Array.isArray(global.owner) ? global.owner : [global.owner].filter(Boolean);

    const allOwners = [
        ...owners,
        ...globalOwners,
        botNumber
    ].map(normalizeJid);

    return allOwners.includes(normalizeJid(userId));
}

/**
 * Check if user is PREMIUM
 * @param {string} userId - User JID
 * @returns {boolean}
 */
function isPremium(userId) {
    const premium = loadJsonFile(PREMIUM_PATH);
    return premium.map(normalizeJid).includes(normalizeJid(userId));
}

/**
 * Check if user is GROUP ADMIN
 * @param {string} userId - User JID
 * @param {Object} groupMetadata - Group metadata from Baileys
 * @returns {boolean}
 */
function isGroupAdmin(userId, groupMetadata) {
    if (!groupMetadata || !groupMetadata.participants) return false;

    const participant = groupMetadata.participants.find(
        p => normalizeJid(p.id) === normalizeJid(userId)
    );

    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
}

/**
 * Resolve all roles for a user
 * @param {Object} params - Parameters object
 * @param {string} params.userId - User JID
 * @param {string} params.botNumber - Bot JID
 * @param {Object} params.groupMetadata - Group metadata (optional)
 * @returns {Object} - Resolved roles
 */
function resolveRoles({ userId, botNumber, groupMetadata }) {
    const owner = isOwner(userId, botNumber);
    const premium = isPremium(userId);
    const admin = groupMetadata ? isGroupAdmin(userId, groupMetadata) : false;

    // Determine highest role
    let highestRole = 'user';
    if (owner) highestRole = 'owner';
    else if (admin) highestRole = 'admin';
    else if (premium) highestRole = 'premium';

    return {
        isOwner: owner,
        isAdmin: admin,
        isPremium: premium,
        isUser: !owner && !admin && !premium,
        highestRole,
        priority: ROLE_PRIORITY[highestRole] || 1
    };
}

/**
 * Check if user has required role (respecting priority)
 * @param {Object} userRoles - Roles object from resolveRoles
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
function hasRole(userRoles, requiredRole) {
    const requiredPriority = ROLE_PRIORITY[requiredRole] || 1;
    return userRoles.priority >= requiredPriority;
}

/**
 * Format role display name
 * @param {string} role - Role key
 * @returns {string}
 */
function formatRole(role) {
    const formats = {
        owner: '👑 Owner',
        admin: '👮 Admin',
        premium: '💎 Premium',
        user: '👤 User'
    };
    return formats[role] || '👤 User';
}

// =========================================
// 📌 EXPORT
// =========================================
module.exports = {
    // Core functions
    resolveRoles,
    isOwner,
    isPremium,
    isGroupAdmin,
    hasRole,
    formatRole,

    // Constants
    ROLE_PRIORITY
};
