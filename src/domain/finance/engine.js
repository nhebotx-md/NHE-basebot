/**
 * =========================================
 * 📌 FILE: src/domain/finance/engine.js (MODIFIED)
 * 📌 DESCRIPTION:
 * Finance system engine dan DB initializer
 *
 * 🔧 MODIFICATION: Added global.db.users initialization
 * - Ensures global.db.users exists for middleware system
 * - Added usersCount tracking in stats
 *
 * 🔧 UPDATED: Restart-Safe Database Engine
 * - Reloads database.json without overwriting existing data
 * - Revalidates all user levels from XP on startup
 * - Anti data reset protection
 * - Graceful recovery from crash/restart
 *
 * 📁 INTEGRATION POINT: Database Layer
 * =========================================
 */

// =========================================
// 📌 IMPORTS
// =========================================
const fs = require('fs');
const path = require('path');
const events = require('./events');
const { EVENT_TYPES, emitFinanceEvent } = events;

// =========================================
// 📌 CONSTANTS
// =========================================
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'finance.json');
const USERS_DB_FILE = path.join(DB_DIR, 'database.json');  // Primary users DB
const MAX_LOG_ENTRIES = 1000;

// =========================================
// 📌 DATABASE INITIALIZATION (RESTART-SAFE)
// =========================================

/**
 * Initialize the global database
 * Creates data directory and sets up global.db
 * CRITICAL: Preserves existing data, never overwrites
 *
 * 🔧 MODIFIED: Added global.db.users initialization with reload
 */
function initFinanceDB() {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // ============================================
    // Load finance database (existing logic)
    // ============================================
    let existingData = {};
    if (fs.existsSync(DB_FILE)) {
        try {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            existingData = JSON.parse(raw);
            console.log('[FinanceEngine] Loaded existing finance database');
        } catch (e) {
            console.error('[FinanceEngine] Error loading finance DB:', e.message);
            existingData = {};
        }
    }

    // ============================================
    // Load users database (PRIMARY - database.json)
    // ============================================
    let usersData = {};
    let loadedFromUsersDB = false;

    // PRIMARY: Try to load from database.json first (users database)
    if (fs.existsSync(USERS_DB_FILE)) {
        try {
            const raw = fs.readFileSync(USERS_DB_FILE, 'utf8');
            const parsed = JSON.parse(raw);

            // Handle different database.json formats
            if (parsed.users && typeof parsed.users === 'object') {
                usersData = parsed.users;
                loadedFromUsersDB = true;
                console.log(`[FinanceEngine] Loaded ${Object.keys(usersData).length} users from database.json`);
            } else if (typeof parsed === 'object' && !parsed.finance) {
                // If it's a flat object of users (jid -> data)
                usersData = parsed;
                loadedFromUsersDB = true;
                console.log(`[FinanceEngine] Loaded ${Object.keys(usersData).length} users from database.json (flat format)`);
            }
        } catch (e) {
            console.error('[FinanceEngine] Error loading users DB:', e.message);
            usersData = {};
        }
    }

    // FALLBACK: If no users in database.json, try finance.json users field
    if (!loadedFromUsersDB && existingData.users && typeof existingData.users === 'object') {
        usersData = existingData.users;
        console.log(`[FinanceEngine] Loaded ${Object.keys(usersData).length} users from finance.json fallback`);
    }

    // ============================================
    // CRITICAL: Revalidate all user levels from XP
    // This fixes any desync after restart/crash
    // ============================================
    let fixedLevels = 0;
    for (const [userId, user] of Object.entries(usersData)) {
        if (!user || typeof user !== 'object') continue;

        // Ensure required fields exist
        if (typeof user.xp !== 'number') user.xp = 0;
        if (typeof user.level !== 'number') user.level = 1;
        if (typeof user.registered !== 'boolean') user.registered = false;
        if (typeof user.totalCommand !== 'number') user.totalCommand = 0;

        // Recalculate level from XP (CRITICAL: no cache)
        const correctLevel = Math.floor((user.xp || 0) / 100) + 1;
        if (user.level !== correctLevel) {
            console.log(`[FinanceEngine] Level revalidated for ${userId}: ${user.level} → ${correctLevel}`);
            user.level = correctLevel;
            fixedLevels++;
        }
    }

    if (fixedLevels > 0) {
        console.log(`[FinanceEngine] Revalidated ${fixedLevels} user level(s)`);
    }

    // ============================================
    // Initialize global.db
    // ============================================
    global.db = {
        // Finance data (existing)
        data: existingData.data || {},
        finance: existingData.finance || {
            transactions: [],
            categories: {
                income: ['Gaji', 'Bonus', 'Investasi', 'Lainnya'],
                expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Lainnya']
            },
            budgets: {},
            goals: [],
            recurring: [],
            logs: []
        },

        // 🔧 ADDED: Users database for middleware system
        // Single Source of Truth for user data
        users: usersData,

        _meta: {
            version: '1.0.0',
            lastBackup: null,
            initializedAt: Date.now(),
            usersLoadedFrom: loadedFromUsersDB ? 'database.json' : (existingData.users ? 'finance.json' : 'new'),
            levelsRevalidated: fixedLevels
        },
        _modified: false
    };

    console.log('[FinanceEngine] Database initialized');
    console.log(`[FinanceEngine] Users in database: ${Object.keys(global.db.users).length}`);

    // Set up auto-save
    setupAutoSave();

    // Emit initialization event
    emitFinanceEvent(EVENT_TYPES.INITIALIZED, {
        timestamp: Date.now(),
        hasExistingData: Object.keys(existingData).length > 0,
        usersCount: Object.keys(global.db.users).length,
        levelsFixed: fixedLevels
    });
}

/**
 * Save database to disk (USERS + FINANCE)
 * Saves to both finance.json and database.json for redundancy
 */
function saveDB() {
    try {
        // ============================================
        // Save finance data to finance.json
        // ============================================
        const financeDataToSave = {
            data: global.db.data,
            finance: global.db.finance,
            users: global.db.users,  // Include users for fallback
            _meta: {
                ...global.db._meta,
                lastSaved: Date.now()
            }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(financeDataToSave, null, 2));

        // ============================================
        // CRITICAL: Also save users to database.json
        // This is the primary users database file
        // ============================================
        const usersDataToSave = {
            users: global.db.users,
            _meta: {
                version: '1.0.0',
                lastSaved: Date.now(),
                userCount: Object.keys(global.db.users).length
            }
        };
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(usersDataToSave, null, 2));

    } catch (e) {
        console.error('[FinanceEngine] Save error:', e.message);
    }
}

/**
 * Setup auto-save interval
 * Saves every 30 seconds if data has been modified
 */
function setupAutoSave() {
    setInterval(() => {
        if (global.db && global.db._modified) {
            saveDB();
            global.db._modified = false;
        }
    }, 30000); // Auto-save every 30 seconds
}

// =========================================
// 📌 TRANSACTION MANAGEMENT
// =========================================

/**
 * Add income transaction
 * @param {string} userId - User ID
 * @param {Object} data - Transaction data
 */
function addIncome(userId, data) {
    const tx = {
        id: `TX${Date.now()}`,
        type: 'income',
        userId,
        amount: Math.abs(data.amount),
        category: data.category || 'Lainnya',
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        createdAt: Date.now()
    };

    global.db.finance.transactions.push(tx);
    global.db._modified = true;

    emitFinanceEvent(EVENT_TYPES.INCOME_ADDED, tx);
    return tx;
}

/**
 * Add expense transaction
 * @param {string} userId - User ID
 * @param {Object} data - Transaction data
 */
function addExpense(userId, data) {
    const tx = {
        id: `TX${Date.now()}`,
        type: 'expense',
        userId,
        amount: Math.abs(data.amount),
        category: data.category || 'Lainnya',
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        createdAt: Date.now()
    };

    global.db.finance.transactions.push(tx);
    global.db._modified = true;

    emitFinanceEvent(EVENT_TYPES.EXPENSE_ADDED, tx);
    return tx;
}

// =========================================
// 📌 BUDGET MANAGEMENT
// =========================================

/**
 * Set budget for a category
 * @param {string} userId - User ID
 * @param {string} category - Budget category
 * @param {number} amount - Budget amount
 */
function setBudget(userId, category, amount) {
    if (!global.db.finance.budgets[userId]) {
        global.db.finance.budgets[userId] = {};
    }

    global.db.finance.budgets[userId][category] = {
        amount: Math.abs(amount),
        spent: 0,
        period: 'monthly',
        createdAt: Date.now()
    };

    global.db._modified = true;
    return global.db.finance.budgets[userId][category];
}

// =========================================
// 📌 GOAL MANAGEMENT
// =========================================

/**
 * Add savings goal
 * @param {string} userId - User ID
 * @param {Object} goal - Goal data
 */
function addGoal(userId, goal) {
    const newGoal = {
        id: `GOAL${Date.now()}`,
        userId,
        name: goal.name,
        target: Math.abs(goal.target),
        current: 0,
        deadline: goal.deadline || null,
        createdAt: Date.now()
    };

    global.db.finance.goals.push(newGoal);
    global.db._modified = true;

    return newGoal;
}

/**
 * Contribute to a goal
 * @param {string} goalId - Goal ID
 * @param {number} amount - Amount to contribute
 */
function contributeGoal(goalId, amount) {
    const goal = global.db.finance.goals.find(g => g.id === goalId);
    if (!goal) return null;

    goal.current += Math.abs(amount);
    global.db._modified = true;

    if (goal.current >= goal.target) {
        emitFinanceEvent(EVENT_TYPES.GOAL_REACHED, goal);
    }

    return goal;
}

// =========================================
// 📌 ANALYTICS
// =========================================

/**
 * Get financial summary for user
 * @param {string} userId - User ID
 * @returns {Object} - Summary data
 */
function getQuickSummary(userId) {
    const txs = global.db.finance.transactions.filter(t => t.userId === userId);
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        transactionCount: txs.length,
        // 🔧 ADDED: Include users count in summary
        usersCount: Object.keys(global.db.users || {}).length
    };
}

/**
 * Format currency to Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
function formatCurrency(amount) {
    return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
}

// =========================================
// 📌 UTILITY EXPORTS
// =========================================

module.exports = {
    // DB Management
    initFinanceDB,
    saveDB,

    // Transactions
    addIncome,
    addExpense,

    // Budget
    setBudget,

    // Goals
    addGoal,
    contributeGoal,

    // Analytics
    getQuickSummary,
    formatCurrency,

    // Direct access
    get ledger() { return global.db?.finance?.transactions || []; },
    get budget() { return global.db?.finance?.budgets || {}; },
    get goals() { return global.db?.finance?.goals || []; },
    get analytics() { return { getQuickSummary }; }
};
