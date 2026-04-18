/**
 * =========================================
 * ENGINE.JS — Finance Engine (MongoDB/Mongoose)
 * =========================================
 * Core engine sistem finance berbasis MongoDB.
 * Semua operasi menggunakan Mongoose models.
 *
 * WAJIB memiliki:
 * 1. ensureUser(userId) — auto-create user jika tidak ada
 * 2. addTransaction(userId, data) — tambah transaksi
 * 3. getBalance(userId) — hitung balance dari aggregation
 *
 * FLOW addTransaction:
 *   ensureUser(userId) → insert FinanceLedger → return result
 *
 * FLOW getBalance:
 *   ensureUser(userId) → aggregate income - expense → return balance
 *
 * ⚠️ RULES:
 * - Tidak mengakses global.db.users (itu tugas middleware)
 * - Tidak menggunakan JSON storage
 * - Auto-init user di setiap operasi
 * - Ledger append-only (immutable)
 * =========================================
 */

// =========================================
// IMPORTS
// =========================================
const { connectMongo } = require('../../lib/mongo');
const FinanceUser = require('../../models/FinanceUser');
const FinanceLedger = require('../../models/FinanceLedger');

// =========================================
// INTERNAL STATE
// =========================================
let isEngineInitialized = false;

// =========================================
// INITIALIZATION
// =========================================

/**
 * Initialize finance engine
 * - Connect ke MongoDB (singleton)
 * - Idempotent — safe to call multiple times
 */
async function initFinanceEngine() {
    if (isEngineInitialized) {
        return;
    }

    await connectMongo();
    isEngineInitialized = true;
    console.log('[FinanceEngine] Finance engine initialized (MongoDB/Mongoose)');
}

// =========================================
// CORE: Ensure User (AUTO-INIT)
// =========================================

/**
 * Ensure user exists di FinanceUser collection.
 * Jika tidak ada → create otomatis dengan default data.
 *
 * DATA DEFAULT:
 *   { userId, createdAt, updatedAt }
 *
 * @param {string} userId — ctx.user.number
 * @returns {Promise<Object>} FinanceUser document
 */
async function ensureUser(userId) {
    if (!userId) {
        throw new Error('[FinanceEngine] userId is required');
    }

    await initFinanceEngine();

    // Cari user
    let user = await FinanceUser.findOne({ userId }).lean();

    if (!user) {
        // Auto-create user baru
        user = await FinanceUser.create({ userId });
        console.log(`[FinanceEngine] Auto-created finance user: ${userId}`);
    }

    return user;
}

// =========================================
// CORE: Add Transaction
// =========================================

/**
 * Tambah transaksi ke ledger.
 * FLOW: ensureUser(userId) → insert FinanceLedger → return result
 *
 * @param {string} userId — ctx.user.number
 * @param {Object} data — { type, amount, note, category }
 * @returns {Promise<Object>} Transaction result
 */
async function addTransaction(userId, data) {
    // Validasi input
    if (!data || typeof data !== 'object') {
        return { success: false, error: 'Transaction data is required' };
    }

    const { type, amount, note, category } = data;

    // Validasi type
    if (!type || !['income', 'expense'].includes(type)) {
        return { success: false, error: 'type must be "income" or "expense"' };
    }

    // Validasi amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return { success: false, error: 'amount must be a positive number' };
    }

    try {
        // Step 1: Ensure user exists (auto-create jika belum ada)
        await ensureUser(userId);

        // Step 2: Insert ke FinanceLedger
        const ledgerEntry = await FinanceLedger.create({
            userId,
            type,
            amount: parsedAmount,
            note: note || '',
            category: category || 'Lainnya'
        });

        // Step 3: Hitung balance baru
        const balanceData = await getBalance(userId);

        return {
            success: true,
            transaction: {
                id: ledgerEntry._id.toString(),
                userId: ledgerEntry.userId,
                type: ledgerEntry.type,
                amount: ledgerEntry.amount,
                note: ledgerEntry.note,
                category: ledgerEntry.category,
                createdAt: ledgerEntry.createdAt
            },
            balance: balanceData.balance
        };

    } catch (error) {
        console.error('[FinanceEngine] addTransaction error:', error.message);
        return { success: false, error: error.message };
    }
}

// =========================================
// CORE: Get Balance
// =========================================

/**
 * Hitung balance user dari aggregation ledger.
 * FLOW: ensureUser(userId) → aggregate income - expense
 *
 * @param {string} userId — ctx.user.number
 * @returns {Promise<Object>} { balance, totalIncome, totalExpense }
 */
async function getBalance(userId) {
    try {
        // Ensure user exists
        await ensureUser(userId);

        // Aggregate dari FinanceLedger
        const balanceData = await FinanceLedger.getBalance(userId);

        return balanceData;

    } catch (error) {
        console.error('[FinanceEngine] getBalance error:', error.message);
        return { balance: 0, totalIncome: 0, totalExpense: 0 };
    }
}

// =========================================
// UTILITY: Format Currency
// =========================================

/**
 * Format angka ke Rupiah
 * @param {number} amount
 * @returns {string} Rp xxx.xxx
 */
function formatRupiah(amount) {
    const abs = Math.abs(Math.round(amount));
    const formatted = abs.toLocaleString('id-ID');
    return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

// =========================================
// EXPORT
// =========================================
module.exports = {
    // Initialization
    initFinanceEngine,

    // Core API (WAJIB ada)
    ensureUser,
    addTransaction,
    getBalance,

    // Formatting
    formatRupiah
};
