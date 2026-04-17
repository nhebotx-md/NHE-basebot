/**
 * =========================================
 * LEDGER MODULE — Immutable Transaction Record
 * =========================================
 * Sistem pencatatan transaksi yang bersifat append-only.
 * Tidak ada edit/hapus. Semua perubahan dicatat sebagai transaksi baru.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const LEDGER_FILE = path.join(DATA_DIR, 'finance-ledger.json');

// =========================================
// UTILITY: Ensure data directory exists
// =========================================
const ensureDataDir = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
};

// =========================================
// UTILITY: Load ledger from file
// =========================================
const loadLedger = () => {
    ensureDataDir();
    if (!fs.existsSync(LEDGER_FILE)) {
        return [];
    }
    try {
        const raw = fs.readFileSync(LEDGER_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('[FinanceLedger] Error loading ledger:', err.message);
        return [];
    }
};

// =========================================
// UTILITY: Save ledger to file
// =========================================
const saveLedger = (ledger) => {
    ensureDataDir();
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
};

// =========================================
// UTILITY: Generate unique transaction ID
// =========================================
const generateTxId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TX${timestamp}${random}`;
};

// =========================================
// UTILITY: Get current timestamp ISO
// =========================================
const nowISO = () => new Date().toISOString();

// =========================================
// CORE: Add transaction (APPEND ONLY)
// =========================================
const addTransaction = (entry) => {
    const ledger = loadLedger();

    const tx = {
        id: generateTxId(),
        timestamp: nowISO(),
        userId: entry.userId,
        type: entry.type,         // 'income' | 'expense' | 'transfer' | 'adjustment'
        category: entry.category, // e.g. 'food', 'salary', 'transport'
        amount: Math.abs(parseFloat(entry.amount)),
        currency: entry.currency || 'IDR',
        description: entry.description || '',
        metadata: {
            source: entry.source || 'whatsapp',
            tags: entry.tags || [],
            ...((entry.metadata) || {})
        },
        // Immutable snapshot of balance AFTER this transaction
        runningBalance: 0
    };

    // Calculate running balance
    const userTxs = ledger.filter(l => l.userId === tx.userId);
    const lastBalance = userTxs.length > 0
        ? userTxs[userTxs.length - 1].runningBalance
        : 0;

    if (tx.type === 'income') {
        tx.runningBalance = lastBalance + tx.amount;
    } else if (tx.type === 'expense') {
        tx.runningBalance = lastBalance - tx.amount;
    } else if (tx.type === 'adjustment') {
        tx.runningBalance = tx.amount; // Direct balance set
    } else {
        tx.runningBalance = lastBalance;
    }

    ledger.push(tx);
    saveLedger(ledger);

    return tx;
};

// =========================================
// CORE: Get transactions for user
// =========================================
const getUserTransactions = (userId, options = {}) => {
    const ledger = loadLedger();
    let txs = ledger.filter(l => l.userId === userId);

    if (options.type) {
        txs = txs.filter(t => t.type === options.type);
    }
    if (options.category) {
        txs = txs.filter(t => t.category === options.category);
    }
    if (options.startDate) {
        txs = txs.filter(t => t.timestamp >= options.startDate);
    }
    if (options.endDate) {
        txs = txs.filter(t => t.timestamp <= options.endDate);
    }
    if (options.limit) {
        txs = txs.slice(-options.limit);
    }

    return txs;
};

// =========================================
// CORE: Get single transaction by ID
// =========================================
const getTransaction = (txId) => {
    const ledger = loadLedger();
    return ledger.find(l => l.id === txId) || null;
};

// =========================================
// CORE: Calculate current balance from ledger
// =========================================
const calculateBalance = (userId) => {
    const txs = getUserTransactions(userId);
    if (txs.length === 0) return 0;
    return txs[txs.length - 1].runningBalance;
};

// =========================================
// CORE: Get summary by category
// =========================================
const getCategorySummary = (userId, options = {}) => {
    const txs = getUserTransactions(userId, options);
    const summary = {};

    for (const tx of txs) {
        if (!summary[tx.category]) {
            summary[tx.category] = { income: 0, expense: 0, count: 0 };
        }
        if (tx.type === 'income') {
            summary[tx.category].income += tx.amount;
        } else if (tx.type === 'expense') {
            summary[tx.category].expense += tx.amount;
        }
        summary[tx.category].count += 1;
    }

    return summary;
};

// =========================================
// CORE: Get monthly summary
// =========================================
const getMonthlySummary = (userId, year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`;

    const txs = getUserTransactions(userId, { startDate, endDate });

    let income = 0, expense = 0;
    for (const tx of txs) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
    }

    return {
        year,
        month,
        income,
        expense,
        net: income - expense,
        transactionCount: txs.length,
        categories: getCategorySummary(userId, { startDate, endDate })
    };
};

// =========================================
// CORE: Validate transaction entry
// =========================================
const validateEntry = (entry) => {
    const errors = [];

    if (!entry.userId) errors.push('userId is required');
    if (!entry.type) errors.push('type is required (income/expense/transfer/adjustment)');
    if (!['income', 'expense', 'transfer', 'adjustment'].includes(entry.type)) {
        errors.push('type must be income, expense, transfer, or adjustment');
    }
    if (!entry.amount || isNaN(entry.amount) || parseFloat(entry.amount) <= 0) {
        errors.push('amount must be a positive number');
    }
    if (!entry.category) errors.push('category is required');

    return {
        valid: errors.length === 0,
        errors
    };
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Core operations
    addTransaction,
    getUserTransactions,
    getTransaction,
    calculateBalance,

    // Analysis
    getCategorySummary,
    getMonthlySummary,

    // Validation
    validateEntry,

    // Utility (for engine access)
    loadLedger,
    generateTxId
};
