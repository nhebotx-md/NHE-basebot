/**
 * =========================================
 * WALLET.JS — Balance & Wallet Operations (MongoDB/Mongoose)
 * =========================================
 * Sistem wallet yang SELALU menghitung saldo dari MongoDB aggregation.
 * TIDAK ADA penyimpanan balance manual — semua derived calculation.
 *
 * RULES:
 * - Balance = derived dari FinanceLedger aggregation
 * - Tidak boleh ada field 'balance' yang disimpan di database
 * - Semua perhitungan real-time dari transaction history
 * - User identity menggunakan userId (dari ctx.user.number)
 */

const FinanceLedger = require('../../models/FinanceLedger');
const { connectMongo } = require('../../lib/mongo');

// =========================================
// CORE: Balance Calculation
// =========================================

/**
 * Calculate current balance untuk user dari aggregation
 * @param {string} userId — ctx.user.number
 * @returns {Promise<number>} Current balance
 */
async function calculateBalance(userId) {
    await connectMongo();
    const result = await FinanceLedger.getBalance(userId);
    return result.balance;
}

// =========================================
// CORE: Income & Expense Summary
// =========================================

/**
 * Get total income untuk user
 * @param {string} userId — ctx.user.number
 * @param {Object} options — { startDate, endDate }
 * @returns {Promise<number>} Total income
 */
async function getTotalIncome(userId, options = {}) {
    await connectMongo();

    const matchStage = { userId, type: 'income' };

    if (options.startDate || options.endDate) {
        matchStage.createdAt = {};
        if (options.startDate) matchStage.createdAt.$gte = new Date(options.startDate);
        if (options.endDate) matchStage.createdAt.$lte = new Date(options.endDate);
    }

    const result = await FinanceLedger.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
}

/**
 * Get total expense untuk user
 * @param {string} userId — ctx.user.number
 * @param {Object} options — { startDate, endDate }
 * @returns {Promise<number>} Total expense
 */
async function getTotalExpense(userId, options = {}) {
    await connectMongo();

    const matchStage = { userId, type: 'expense' };

    if (options.startDate || options.endDate) {
        matchStage.createdAt = {};
        if (options.startDate) matchStage.createdAt.$gte = new Date(options.startDate);
        if (options.endDate) matchStage.createdAt.$lte = new Date(options.endDate);
    }

    const result = await FinanceLedger.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
}

/**
 * Get net flow (income - expense)
 * @param {string} userId — ctx.user.number
 * @param {Object} options — { startDate, endDate }
 * @returns {Promise<number>}
 */
async function getNetFlow(userId, options = {}) {
    const [income, expense] = await Promise.all([
        getTotalIncome(userId, options),
        getTotalExpense(userId, options)
    ]);
    return income - expense;
}

// =========================================
// CORE: Wallet Summary
// =========================================

/**
 * Get complete wallet summary untuk user
 * @param {string} userId — ctx.user.number
 * @returns {Promise<Object>} Wallet summary
 */
async function getWalletSummary(userId) {
    const balanceData = await FinanceLedger.getBalance(userId);

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const [monthlyIncome, monthlyExpense] = await Promise.all([
        getTotalIncome(userId, { startDate: monthStart, endDate: monthEnd }),
        getTotalExpense(userId, { startDate: monthStart, endDate: monthEnd })
    ]);

    return {
        userId,
        balance: balanceData.balance,
        totalIncome: balanceData.totalIncome,
        totalExpense: balanceData.totalExpense,
        netFlow: balanceData.totalIncome - balanceData.totalExpense,
        monthly: {
            income: monthlyIncome,
            expense: monthlyExpense,
            net: monthlyIncome - monthlyExpense
        },
        currency: 'IDR'
    };
}

// =========================================
// CORE: Format Utilities
// =========================================

/**
 * Format number ke Rupiah
 * @param {number} amount
 * @returns {string} Rp xxx.xxx
 */
function formatRupiah(amount) {
    const abs = Math.abs(Math.round(amount));
    const formatted = abs.toLocaleString('id-ID');
    return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format dengan sign (+/-)
 * @param {number} amount
 * @returns {string}
 */
function formatSigned(amount) {
    const formatted = formatRupiah(Math.abs(amount));
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Balance calculation (derived — no manual storage)
    calculateBalance,

    // Income/Expense
    getTotalIncome,
    getTotalExpense,
    getNetFlow,

    // Summary
    getWalletSummary,

    // Formatting
    formatRupiah,
    formatSigned
};
