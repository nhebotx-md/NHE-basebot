/**
 * =========================================
 * LEDGER.JS — Ledger Operations (MongoDB/Mongoose)
 * =========================================
 * Helper operations untuk FinanceLedger collection.
 * - Semua operasi query (read-only helpers)
 * - Tidak ada edit/delete (ledger immutable)
 * - Menggunakan FinanceLedger Mongoose model
 */

const FinanceLedger = require('../../models/FinanceLedger');
const { connectMongo } = require('../../lib/mongo');

// =========================================
// QUERY: Get Transactions
// =========================================

/**
 * Get transaksi user dengan optional filters
 * @param {string} userId — ctx.user.number
 * @param {Object} options — { type, category, startDate, endDate, limit }
 * @returns {Promise<Array>} Array of transactions
 */
async function getUserTransactions(userId, options = {}) {
    await connectMongo();
    return FinanceLedger.getByUser(userId, options);
}

/**
 * Get single transaction by ID
 * @param {string} txId — Transaction _id
 * @returns {Promise<Object|null>}
 */
async function getTransaction(txId) {
    await connectMongo();
    return FinanceLedger.findById(txId).lean().exec();
}

// =========================================
// QUERY: Summary & Analytics
// =========================================

/**
 * Get category summary untuk user
 * @param {string} userId — ctx.user.number
 * @param {Object} options — { startDate, endDate }
 * @returns {Promise<Array>} Summary per category
 */
async function getCategorySummary(userId, options = {}) {
    await connectMongo();
    return FinanceLedger.getCategorySummary(userId, options);
}

/**
 * Get total transaction count untuk user
 * @param {string} userId — ctx.user.number
 * @returns {Promise<number>}
 */
async function getTransactionCount(userId) {
    await connectMongo();
    return FinanceLedger.countDocuments({ userId }).exec();
}

// =========================================
// VALIDATION
// =========================================

/**
 * Validasi entry transaksi
 * @param {Object} entry
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateEntry(entry) {
    const errors = [];

    if (!entry.userId) errors.push('userId is required');
    if (!entry.type) errors.push('type is required (income/expense)');
    if (!['income', 'expense'].includes(entry.type)) {
        errors.push('type must be income or expense');
    }
    if (!entry.amount || isNaN(entry.amount) || parseFloat(entry.amount) <= 0) {
        errors.push('amount must be a positive number');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Queries
    getUserTransactions,
    getTransaction,
    getCategorySummary,
    getTransactionCount,

    // Validation
    validateEntry
};
