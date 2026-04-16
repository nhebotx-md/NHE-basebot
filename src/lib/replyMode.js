/**
 * =========================================
 * 📌 FILE: src/lib/replyMode.js (RECONSTRUCTED)
 * 📌 DESCRIPTION:
 * Reply Mode Manager - Mengelola preferensi reply mode user
 * - button: Menggunakan interactive buttons
 * - text: Menggunakan text biasa
 *
 * 📁 MAPPING: Library/replyMode.js (original) → src/lib/replyMode.js
 * =========================================
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), './data/replyMode.json');

// ============================================================
// INITIALIZE - Buat file jika belum ada
// ============================================================
const initReplyMode = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            const dir = path.dirname(DATA_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2));
            console.log('✅ replyMode.json created successfully');
        }
    } catch (err) {
        console.error('❌ Error initializing replyMode.json:', err);
    }
};

// ============================================================
// GET ALL DATA - Ambil semua data reply mode
// ============================================================
const getAllReplyMode = () => {
    try {
        initReplyMode();
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('❌ Error reading replyMode.json:', err);
        return {};
    }
};

// ============================================================
// GET USER REPLY MODE - Ambil mode reply user
// ============================================================
const getUserReplyMode = (userId) => {
    try {
        const data = getAllReplyMode();
        return data[userId] || null;
    } catch (err) {
        console.error('❌ Error getting user reply mode:', err);
        return null;
    }
};

// ============================================================
// SET USER REPLY MODE - Set mode reply user
// ============================================================
const setUserReplyMode = (userId, mode) => {
    try {
        const data = getAllReplyMode();
        data[userId] = {
            mode: mode,
            firstInteraction: data[userId]?.firstInteraction || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('❌ Error setting user reply mode:', err);
        return false;
    }
};

// ============================================================
// CHECK IF USER EXISTS - Cek apakah user sudah pernah interact
// ============================================================
const isUserExists = (userId) => {
    try {
        const data = getAllReplyMode();
        return !!data[userId];
    } catch (err) {
        console.error('❌ Error checking user existence:', err);
        return false;
    }
};

// ============================================================
// DELETE USER - Hapus data user (untuk reset)
// ============================================================
const deleteUserReplyMode = (userId) => {
    try {
        const data = getAllReplyMode();
        if (data[userId]) {
            delete data[userId];
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
            return true;
        }
        return false;
    } catch (err) {
        console.error('❌ Error deleting user reply mode:', err);
        return false;
    }
};

// ============================================================
// GET STATISTICS - Statistik penggunaan
// ============================================================
const getReplyModeStats = () => {
    try {
        const data = getAllReplyMode();
        const users = Object.keys(data);
        const buttonUsers = users.filter(u => data[u].mode === 'button').length;
        const textUsers = users.filter(u => data[u].mode === 'text').length;
        
        return {
            total: users.length,
            button: buttonUsers,
            text: textUsers
        };
    } catch (err) {
        console.error('❌ Error getting stats:', err);
        return { total: 0, button: 0, text: 0 };
    }
};

// ============================================================
// EXPORT MODULE
// ============================================================
module.exports = {
    initReplyMode,
    getAllReplyMode,
    getUserReplyMode,
    setUserReplyMode,
    isUserExists,
    deleteUserReplyMode,
    getReplyModeStats,
    DATA_PATH
};
