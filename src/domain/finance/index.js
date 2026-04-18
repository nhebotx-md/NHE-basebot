/**
 * =========================================
 * FINANCE DOMAIN — Entry Point (MongoDB/Mongoose v3.0.0)
 * =========================================
 * Entry point untuk modul finance berbasis MongoDB.
 * Semua finance data tersimpan di MongoDB (mongoose).
 *
 * ARCHITECTURE:
 * - mongo.js      → Singleton MongoDB connection
 * - models/       → Mongoose schemas (FinanceUser, FinanceLedger)
 * - engine.js     → Core API (ensureUser, addTransaction, getBalance)
 * - ledger.js     → Ledger query helpers
 * - wallet.js     → Balance calculation helpers
 *
 * INTEGRASI MIDDLEWARE:
 * - Gunakan ctx.user.number sebagai userId
 * - Auto-init user di setiap operasi finance
 * - Tidak mengakses global.db langsung
 * =========================================
 */

const engine = require('./engine');
const ledger = require('./ledger');
const wallet = require('./wallet');

// =========================================
// Auto-initialize when loaded
// =========================================
const initialize = async () => {
    await engine.initFinanceEngine();
    console.log('[FinanceDomain] Finance domain initialized (MongoDB/Mongoose v3.0.0)');
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Initialization
    initialize,

    // Main engine (unified API)
    engine: {
        initFinanceEngine: engine.initFinanceEngine,
        ensureUser: engine.ensureUser,
        addTransaction: engine.addTransaction,
        getBalance: engine.getBalance,
        formatRupiah: engine.formatRupiah
    },

    // Wallet (derived balance)
    wallet: {
        calculateBalance: wallet.calculateBalance,
        getWalletSummary: wallet.getWalletSummary,
        getTotalIncome: wallet.getTotalIncome,
        getTotalExpense: wallet.getTotalExpense,
        getNetFlow: wallet.getNetFlow,
        formatRupiah: wallet.formatRupiah,
        formatSigned: wallet.formatSigned
    },

    // Ledger (query helpers)
    ledger: {
        getUserTransactions: ledger.getUserTransactions,
        getTransaction: ledger.getTransaction,
        getCategorySummary: ledger.getCategorySummary,
        getTransactionCount: ledger.getTransactionCount,
        validateEntry: ledger.validateEntry
    }
};
