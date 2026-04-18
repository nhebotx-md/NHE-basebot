/**
 * =========================================
 * STORAGE MODULE — Isolated Finance Storage
 * =========================================
 * Layer penyimpanan terisolasi untuk sistem finance.
 * TOTALLY SEPARATED dari global.db dan database.json.
 *
 * RULES:
 * - JANGAN mengakses global.db
 * - JANGAN menyimpan user data
 * - Hanya menyimpan data finance (transactions, budgets, goals, categories)
 * - File: data/finance.json (metadata, categories, config)
 * - File: data/finance-ledger.json (transactions - append only)
 * - File: data/finance-budgets.json (budgets)
 * - File: data/finance-goals.json (goals)
 */

const fs = require('fs');
const path = require('path');

// =========================================
// CONSTANTS
// =========================================
const DATA_DIR = path.join(process.cwd(), 'data');
const FINANCE_FILE = path.join(DATA_DIR, 'database.json');
const LEDGER_FILE = path.join(DATA_DIR, 'database.json');
const BUDGET_FILE = path.join(DATA_DIR, 'finance-budgets.json');
const GOALS_FILE = path.join(DATA_DIR, 'finance-goals.json');

// In-memory cache (hanya untuk finance data)
let financeCache = null;
let ledgerCache = null;
let budgetsCache = null;
let goalsCache = null;
let modifiedFlags = {
    finance: false,
    ledger: false,
    budgets: false,
    goals: false
};

// =========================================
// UTILITY: Ensure directory exists
// =========================================
const ensureDir = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
};

// =========================================
// DEFAULT DATA STRUCTURES
// =========================================
const getDefaultFinanceMeta = () => ({
    categories: {
        income: ['Gaji', 'Bonus', 'Investasi', 'Lainnya'],
        expense: ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Lainnya']
    },
    settings: {
        currency: 'IDR',
        dateFormat: 'id-ID',
        autoBackup: true
    },
    _meta: {
        version: '2.0.0',
        initializedAt: Date.now(),
        lastSaved: null
    }
});

const getDefaultLedger = () => [];
const getDefaultBudgets = () => [];
const getDefaultGoals = () => [];

// =========================================
// CORE: Load Functions (with cache)
// =========================================

/**
 * Load finance metadata
 * @returns {Object} Finance metadata
 */
const loadFinanceMeta = () => {
    if (financeCache) return financeCache;

    ensureDir();
    if (!fs.existsSync(FINANCE_FILE)) {
        financeCache = getDefaultFinanceMeta();
        return financeCache;
    }

    try {
        const raw = fs.readFileSync(FINANCE_FILE, 'utf8');
        const parsed = raw.trim() ? JSON.parse(raw) : getDefaultFinanceMeta();
        financeCache = { ...getDefaultFinanceMeta(), ...parsed };
        return financeCache;
    } catch (err) {
        console.error('[FinanceStorage] Error loading finance meta:', err.message);
        financeCache = getDefaultFinanceMeta();
        return financeCache;
    }
};

/**
 * Load ledger (transactions)
 * @returns {Array} Transaction ledger
 */
const loadLedger = () => {
    if (ledgerCache) return ledgerCache;

    ensureDir();
    if (!fs.existsSync(LEDGER_FILE)) {
        ledgerCache = getDefaultLedger();
        return ledgerCache;
    }

    try {
        const raw = fs.readFileSync(LEDGER_FILE, 'utf8');
        ledgerCache = raw.trim() ? JSON.parse(raw) : getDefaultLedger();
        return ledgerCache;
    } catch (err) {
        console.error('[FinanceStorage] Error loading ledger:', err.message);
        ledgerCache = getDefaultLedger();
        return ledgerCache;
    }
};

/**
 * Load budgets
 * @returns {Array} Budgets array
 */
const loadBudgets = () => {
    if (budgetsCache) return budgetsCache;

    ensureDir();
    if (!fs.existsSync(BUDGET_FILE)) {
        budgetsCache = getDefaultBudgets();
        return budgetsCache;
    }

    try {
        const raw = fs.readFileSync(BUDGET_FILE, 'utf8');
        budgetsCache = raw.trim() ? JSON.parse(raw) : getDefaultBudgets();
        return budgetsCache;
    } catch (err) {
        console.error('[FinanceStorage] Error loading budgets:', err.message);
        budgetsCache = getDefaultBudgets();
        return budgetsCache;
    }
};

/**
 * Load goals
 * @returns {Array} Goals array
 */
const loadGoals = () => {
    if (goalsCache) return goalsCache;

    ensureDir();
    if (!fs.existsSync(GOALS_FILE)) {
        goalsCache = getDefaultGoals();
        return goalsCache;
    }

    try {
        const raw = fs.readFileSync(GOALS_FILE, 'utf8');
        goalsCache = raw.trim() ? JSON.parse(raw) : getDefaultGoals();
        return goalsCache;
    } catch (err) {
        console.error('[FinanceStorage] Error loading goals:', err.message);
        goalsCache = getDefaultGoals();
        return goalsCache;
    }
};

// =========================================
// CORE: Save Functions
// =========================================

/**
 * Save finance metadata to disk
 */
const saveFinanceMeta = () => {
    if (!financeCache) return;

    ensureDir();
    financeCache._meta = financeCache._meta || {};
    financeCache._meta.lastSaved = Date.now();

    try {
        fs.writeFileSync(FINANCE_FILE, JSON.stringify(financeCache, null, 2));
        modifiedFlags.finance = false;
    } catch (err) {
        console.error('[FinanceStorage] Error saving finance meta:', err.message);
    }
};

/**
 * Save ledger to disk
 */
const saveLedger = () => {
    if (!ledgerCache) return;

    ensureDir();
    try {
        fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledgerCache, null, 2));
        modifiedFlags.ledger = false;
    } catch (err) {
        console.error('[FinanceStorage] Error saving ledger:', err.message);
    }
};

/**
 * Save budgets to disk
 */
const saveBudgets = () => {
    if (!budgetsCache) return;

    ensureDir();
    try {
        fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgetsCache, null, 2));
        modifiedFlags.budgets = false;
    } catch (err) {
        console.error('[FinanceStorage] Error saving budgets:', err.message);
    }
};

/**
 * Save goals to disk
 */
const saveGoals = () => {
    if (!goalsCache) return;

    ensureDir();
    try {
        fs.writeFileSync(GOALS_FILE, JSON.stringify(goalsCache, null, 2));
        modifiedFlags.goals = false;
    } catch (err) {
        console.error('[FinanceStorage] Error saving goals:', err.message);
    }
};

// =========================================
// CORE: Mark Modified
// =========================================

const markModified = (type) => {
    if (modifiedFlags.hasOwnProperty(type)) {
        modifiedFlags[type] = true;
    }
};

// =========================================
// CORE: Force Save All
// =========================================

/**
 * Save all finance data to disk immediately
 */
const saveAll = () => {
    saveFinanceMeta();
    saveLedger();
    saveBudgets();
    saveGoals();
    console.log('[FinanceStorage] All finance data saved');
};

/**
 * Auto-save modified data only
 */
const autoSave = () => {
    if (modifiedFlags.finance) saveFinanceMeta();
    if (modifiedFlags.ledger) saveLedger();
    if (modifiedFlags.budgets) saveBudgets();
    if (modifiedFlags.goals) saveGoals();
};

// =========================================
// CORE: Data Access (with cache management)
// =========================================

/**
 * Get finance data (with auto-load)
 * @returns {Object} Finance metadata
 */
const getFinanceMeta = () => loadFinanceMeta();

/**
 * Get ledger data (with auto-load)
 * @returns {Array} Ledger array
 */
const getLedger = () => loadLedger();

/**
 * Get budgets data (with auto-load)
 * @returns {Array} Budgets array
 */
const getBudgets = () => loadBudgets();

/**
 * Get goals data (with auto-load)
 * @returns {Array} Goals array
 */
const getGoals = () => loadGoals();

// =========================================
// CORE: Data Mutation (with cache + mark modified)
// =========================================

/**
 * Set finance metadata
 * @param {Object} data - New metadata
 */
const setFinanceMeta = (data) => {
    financeCache = { ...financeCache, ...data };
    markModified('finance');
};

/**
 * Set ledger data
 * @param {Array} data - New ledger array
 */
const setLedger = (data) => {
    ledgerCache = data;
    markModified('ledger');
};

/**
 * Set budgets data
 * @param {Array} data - New budgets array
 */
const setBudgets = (data) => {
    budgetsCache = data;
    markModified('budgets');
};

/**
 * Set goals data
 * @param {Array} data - New goals array
 */
const setGoals = (data) => {
    goalsCache = data;
    markModified('goals');
};

// =========================================
// INITIALIZATION
// =========================================

/**
 * Initialize finance storage
 * - Creates files if not exist
 * - Loads all data into cache
 * - Sets up auto-save interval
 *
 * SAFE to call multiple times (idempotent)
 */
const initStorage = () => {
    ensureDir();

    // Load all data into cache
    loadFinanceMeta();
    loadLedger();
    loadBudgets();
    loadGoals();

    // Setup auto-save (every 30 seconds)
    if (!global.__financeAutoSaveStarted) {
        setInterval(autoSave, 30000);
        global.__financeAutoSaveStarted = true;
        console.log('[FinanceStorage] Auto-save initialized (30s interval)');
    }

    console.log('[FinanceStorage] Finance storage initialized');
};

/**
 * Reset storage cache (for testing)
 */
const resetCache = () => {
    financeCache = null;
    ledgerCache = null;
    budgetsCache = null;
    goalsCache = null;
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Initialization
    initStorage,
    resetCache,

    // Load
    loadFinanceMeta,
    loadLedger,
    loadBudgets,
    loadGoals,

    // Save
    saveFinanceMeta,
    saveLedger,
    saveBudgets,
    saveGoals,
    saveAll,
    autoSave,

    // Mark modified
    markModified,

    // Get (cached)
    getFinanceMeta,
    getLedger,
    getBudgets,
    getGoals,

    // Set (cached + mark modified)
    setFinanceMeta,
    setLedger,
    setBudgets,
    setGoals
};
