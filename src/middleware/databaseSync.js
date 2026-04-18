/**
 * =========================================
 * FILE: src/middleware/databaseSync.js
 * DESCRIPTION:
 * Database persistence utility.
 * Menyediakan fungsi read/write database.json
 * sebagai SINGLE SOURCE OF TRUTH untuk semua
 * data user (register, XP, level, dll).
 *
 * FLOW:
 * - Bot startup → loadDatabase() → global.db.users
 * - Setiap perubahan → saveDatabase() → database.json
 * - Bot restart → loadDatabase() → restore semua data
 *
 * RULE: TIDAK BOLEH ada perubahan user tanpa sync ke file.
 * =========================================
 */

const fs = require('fs');
const path = require('path');

// =========================================
// CONSTANTS
// =========================================
const DATABASE_DIR = path.join(process.cwd(), './data');
const DATABASE_PATH = path.join(DATABASE_DIR, './database.json');

// Debounce timer untuk batch write
let saveTimer = null;
const SAVE_DEBOUNCE_MS = 500; // Tunggu 500ms sebelum write

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Ensure database directory exists
 */
function ensureDatabaseDir() {
    if (!fs.existsSync(DATABASE_DIR)) {
        fs.mkdirSync(DATABASE_DIR, { recursive: true });
        console.log('[DatabaseSync] Created data directory:', DATABASE_DIR);
    }
}

/**
 * Create default database structure
 * @returns {Object} - Default database object
 */
function createDefaultDatabase() {
    return {
        users: {},
        sessions: {},
        settings: {
            botName: global.botname || 'NHE BOT',
            version: '1.2.0',
            lastUpdated: Date.now()
        },
        stats: {
            totalMessages: 0,
            totalCommands: 0,
            startTime: Date.now()
        }
    };
}

// =========================================
// CORE FUNCTIONS
// =========================================

/**
 * Load database from database.json
 * Dipanggil SAAT BOT STARTUP untuk restore data.
 *
 * @returns {Object} - Database object { users, sessions, settings, stats }
 */
function loadDatabase() {
    try {
        ensureDatabaseDir();

        if (!fs.existsSync(DATABASE_PATH)) {
            console.log('[DatabaseSync] database.json not found, creating new...');
            const defaultDb = createDefaultDatabase();
            fs.writeFileSync(DATABASE_PATH, JSON.stringify(defaultDb, null, 2));
            return defaultDb;
        }

        const raw = fs.readFileSync(DATABASE_PATH, 'utf8');
        if (!raw || raw.trim() === '') {
            console.warn('[DatabaseSync] database.json is empty, creating default...');
            const defaultDb = createDefaultDatabase();
            fs.writeFileSync(DATABASE_PATH, JSON.stringify(defaultDb, null, 2));
            return defaultDb;
        }

        const db = JSON.parse(raw);

        // Validate structure
        if (!db.users) db.users = {};
        if (!db.sessions) db.sessions = {};
        if (!db.settings) db.settings = createDefaultDatabase().settings;
        if (!db.stats) db.stats = createDefaultDatabase().stats;

        const userCount = Object.keys(db.users).length;
        console.log(`[DatabaseSync] Database loaded: ${userCount} users`);

        return db;

    } catch (error) {
        console.error('[DatabaseSync] Error loading database:', error.message);
        console.log('[DatabaseSync] Using in-memory fallback...');
        return createDefaultDatabase();
    }
}

/**
 * Save database to database.json
 * Dipanggil SETIAP KALI ada perubahan data user.
 * Menggunakan debounce untuk menghindari write berlebihan.
 *
 * @param {boolean} immediate - Jika true, langsung write tanpa debounce
 */
function saveDatabase(immediate = false) {
    // Clear existing timer
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }

    const doSave = () => {
        try {
            ensureDatabaseDir();

            const db = global.db || createDefaultDatabase();

            // Update metadata
            db.settings = db.settings || {};
            db.settings.lastUpdated = Date.now();

            // Update stats jika ada
            db.stats = db.stats || {};

            fs.writeFileSync(DATABASE_PATH, JSON.stringify(db, null, 2));

            const userCount = Object.keys(db.users || {}).length;
            console.log(`[DatabaseSync] Database saved: ${userCount} users`);

        } catch (error) {
            console.error('[DatabaseSync] Error saving database:', error.message);
        }
    };

    if (immediate) {
        doSave();
    } else {
        saveTimer = setTimeout(doSave, SAVE_DEBOUNCE_MS);
    }
}

/**
 * Force immediate save (untuk operasi kritis seperti register)
 */
function forceSave() {
    saveDatabase(true);
}

/**
 * Sync global.db dengan database.json
 * Dipanggil saat startup untuk mengisi global.db dari file.
 */
function syncGlobalDb() {
    const db = loadDatabase();

    if (!global.db) {
        global.db = db;
    } else {
        // Merge: file data sebagai truth, tapi jaga existing references
        global.db.users = db.users || {};
        global.db.sessions = db.sessions || {};
        global.db.settings = { ...db.settings, ...global.db.settings };
        global.db.stats = { ...db.stats, ...global.db.stats };
    }

    console.log('[DatabaseSync] global.db synced with database.json');
}

/**
 * Get user data dari database (direct read dari file)
 * @param {string} userId - User JID
 * @returns {Object|null} - User object atau null
 */
function getUserFromDb(userId) {
    try {
        const db = loadDatabase();
        return db.users[userId] || null;
    } catch {
        return global.db?.users?.[userId] || null;
    }
}

/**
 * Save single user ke database
 * @param {string} userId - User JID
 * @param {Object} userData - User data object
 */
function saveUser(userId, userData) {
    if (!global.db) global.db = {};
    if (!global.db.users) global.db.users = {};

    global.db.users[userId] = userData;
    saveDatabase();
}

/**
 * Reset database (HATI-HATI - untuk testing saja)
 */
function resetDatabase() {
    try {
        const defaultDb = createDefaultDatabase();
        global.db = defaultDb;
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(defaultDb, null, 2));
        console.log('[DatabaseSync] Database reset to default');
    } catch (error) {
        console.error('[DatabaseSync] Error resetting database:', error.message);
    }
}

// =========================================
// BACKUP & RECOVERY
// =========================================

/**
 * Create backup file
 */
function backupDatabase() {
    try {
        ensureDatabaseDir();
        if (!fs.existsSync(DATABASE_PATH)) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(DATABASE_DIR, `database-backup-${timestamp}.json`);

        fs.copyFileSync(DATABASE_PATH, backupPath);
        console.log(`[DatabaseSync] Backup created: ${backupPath}`);

        // Hapus backup lama (keep last 5)
        const backups = fs.readdirSync(DATABASE_DIR)
            .filter(f => f.startsWith('database-backup-'))
            .map(f => ({
                name: f,
                path: path.join(DATABASE_DIR, f),
                time: fs.statSync(path.join(DATABASE_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (backups.length > 5) {
            backups.slice(5).forEach(b => {
                fs.unlinkSync(b.path);
                console.log(`[DatabaseSync] Removed old backup: ${b.name}`);
            });
        }

    } catch (error) {
        console.error('[DatabaseSync] Backup error:', error.message);
    }
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Core
    loadDatabase,
    saveDatabase,
    forceSave,
    syncGlobalDb,

    // User operations
    getUserFromDb,
    saveUser,

    // Utility
    resetDatabase,
    backupDatabase,
    ensureDatabaseDir,
    createDefaultDatabase
};
