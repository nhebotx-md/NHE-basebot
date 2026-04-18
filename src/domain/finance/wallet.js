/**
 * =========================================
 * WALLET MODULE — Derived Balance Calculation
 * =========================================
 * Sistem wallet yang SELALU menghitung saldo dari ledger.
 * TIDAK ADA penyimpanan balance manual.
 *
 * RULES:
 * - Balance = derived dari ledger (running calculation)
 * - Tidak boleh ada field 'balance' yang disimpan di file
 * - Semua perhitungan real-time dari transaction history
 * - User identity menggunakan userId (dari ctx.user.number)
 */

const { getLedger } = require('./storage');

// =========================================
// CORE: Balance Calculation
// =========================================

/**
 * Calculate current balance for a user from ledger
 * Semua transaksi user dijumlahkan: income (+), expense (-)
 *
 * @param {string} userId - User ID (phone number dari ctx.user.number)
 * @returns {number} Current balance
 */
const calculateBalance = (userId) => {
    const ledger = getLedger();
    const userTxs = ledger.filter(tx => tx.userId === userId);

    if (userTxs.length === 0) return 0;

    // Use running balance from the last transaction (most accurate)
    const lastTx = userTxs[userTxs.length - 1];
    return lastTx.runningBalance || 0;
};

/**
 * Calculate balance at a specific point in time
 * @param {string} userId - User ID
 * @param {string} timestamp - ISO timestamp
 * @returns {number} Balance at that time
 */
const calculateBalanceAt = (userId, timestamp) => {
    const ledger = getLedger();
    const userTxs = ledger.filter(tx =>
        tx.userId === userId &&
        tx.timestamp <= timestamp
    );

    if (userTxs.length === 0) return 0;
    return userTxs[userTxs.length - 1].runningBalance || 0;
};

// =========================================
// CORE: Income & Expense Summary
// =========================================

/**
 * Get total income for user
 * @param {string} userId - User ID
 * @param {Object} options - Filter options (startDate, endDate)
 * @returns {number} Total income
 */
const getTotalIncome = (userId, options = {}) => {
    const ledger = getLedger();
    let txs = ledger.filter(tx => tx.userId === userId && tx.type === 'income');

    if (options.startDate) {
        txs = txs.filter(tx => tx.timestamp >= options.startDate);
    }
    if (options.endDate) {
        txs = txs.filter(tx => tx.timestamp <= options.endDate);
    }

    return txs.reduce((sum, tx) => sum + tx.amount, 0);
};

/**
 * Get total expense for user
 * @param {string} userId - User ID
 * @param {Object} options - Filter options (startDate, endDate)
 * @returns {number} Total expense
 */
const getTotalExpense = (userId, options = {}) => {
    const ledger = getLedger();
    let txs = ledger.filter(tx => tx.userId === userId && tx.type === 'expense');

    if (options.startDate) {
        txs = txs.filter(tx => tx.timestamp >= options.startDate);
    }
    if (options.endDate) {
        txs = txs.filter(tx => tx.timestamp <= options.endDate);
    }

    return txs.reduce((sum, tx) => sum + tx.amount, 0);
};

/**
 * Get net flow (income - expense)
 * @param {string} userId - User ID
 * @param {Object} options - Filter options
 * @returns {number} Net flow (positive = surplus, negative = deficit)
 */
const getNetFlow = (userId, options = {}) => {
    return getTotalIncome(userId, options) - getTotalExpense(userId, options);
};

// =========================================
// CORE: Wallet Summary
// =========================================

/**
 * Get complete wallet summary for a user
 * @param {string} userId - User ID
 * @returns {Object} Wallet summary
 */
const getWalletSummary = (userId) => {
    const balance = calculateBalance(userId);
    const totalIncome = getTotalIncome(userId);
    const totalExpense = getTotalExpense(userId);
    const netFlow = totalIncome - totalExpense;

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const monthlyIncome = getTotalIncome(userId, { startDate: monthStart, endDate: monthEnd });
    const monthlyExpense = getTotalExpense(userId, { startDate: monthStart, endDate: monthEnd });

    return {
        userId,
        balance,
        totalIncome,
        totalExpense,
        netFlow,
        monthly: {
            income: monthlyIncome,
            expense: monthlyExpense,
            net: monthlyIncome - monthlyExpense
        },
        currency: 'IDR'
    };
};

// =========================================
// CORE: Format Utilities
// =========================================

/**
 * Format number to Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
const formatRupiah = (amount) => {
    const abs = Math.abs(Math.round(amount));
    const formatted = abs.toLocaleString('id-ID');
    return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
};

/**
 * Format with sign
 * @param {number} amount - Amount to format
 * @returns {string} Formatted with + or - sign
 */
const formatSigned = (amount) => {
    const formatted = formatRupiah(Math.abs(amount));
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
};

// =========================================
// CORE: Transaction Counting
// =========================================

/**
 * Get transaction count for user
 * @param {string} userId - User ID
 * @param {Object} options - Filter options
 * @returns {number} Transaction count
 */
const getTransactionCount = (userId, options = {}) => {
    const ledger = getLedger();
    let txs = ledger.filter(tx => tx.userId === userId);

    if (options.type) {
        txs = txs.filter(tx => tx.type === options.type);
    }
    if (options.startDate) {
        txs = txs.filter(tx => tx.timestamp >= options.startDate);
    }
    if (options.endDate) {
        txs = txs.filter(tx => tx.timestamp <= options.endDate);
    }

    return txs.length;
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Balance calculation (derived - no manual storage)
    calculateBalance,
    calculateBalanceAt,

    // Income/Expense
    getTotalIncome,
    getTotalExpense,
    getNetFlow,

    // Summary
    getWalletSummary,

    // Counting
    getTransactionCount,

    // Formatting
    formatRupiah,
    formatSigned
};
