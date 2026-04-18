/**
 * =========================================
 * FINANCE DOMAIN — Entry Point (v2.0.0)
 * =========================================
 * Entry point untuk modul finance terisolasi.
 * Semua finance data tersimpan terpisah dari global.db.
 *
 * ARCHITECTURE:
 * - storage.js    → Isolated persistence layer
 * - wallet.js     → Derived balance calculation
 * - ledger.js     → Append-only transaction record
 * - budget.js     → Budget management
 * - goals.js      → Financial goals
 * - analytics.js  → Reports & insights
 * - engine.js     → Orchestrator & unified API
 * - events.js     → Event-driven architecture
 *
 * INTEGRASI MIDDLEWARE:
 * - Gunakan ctx.user.number sebagai userId
 * - Jangan akses global.db langsung dari finance
 * =========================================
 */

const engine = require('./engine');
const storage = require('./storage');
const wallet = require('./wallet');
const ledger = require('./ledger');
const budget = require('./budget');
const goals = require('./goals');
const analytics = require('./analytics');
const events = require('./events');

// =========================================
// Auto-initialize when loaded
// =========================================
const initialize = () => {
    engine.initFinanceDB();
    events.setupDefaultListeners();
    console.log('[FinanceDomain] Finance domain initialized (isolated v2.0.0)');
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Initialization
    initialize,

    // Main engine (unified API)
    engine: {
        initFinanceDB: engine.initFinanceDB,
        addIncome: engine.addIncome,
        addExpense: engine.addExpense,
        contributeGoal: engine.contributeGoal,
        getQuickSummary: engine.getQuickSummary,
        formatCurrency: engine.formatCurrency,
        ledger: engine.ledger,
        budget: engine.budget,
        goals: engine.goals,
        analytics: engine.analytics,
        wallet: engine.wallet,
        events: engine.events
    },

    // Storage (isolated persistence)
    storage: {
        init: storage.initStorage,
        saveAll: storage.saveAll,
        getFinanceMeta: storage.getFinanceMeta,
        getLedger: storage.getLedger,
        getBudgets: storage.getBudgets,
        getGoals: storage.getGoals
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

    // Events
    events: {
        EVENT_TYPES: events.EVENT_TYPES,
        emit: events.emitFinanceEvent,
        on: events.onFinanceEvent,
        once: events.onceFinanceEvent,
        setupDefaultListeners: events.setupDefaultListeners
    },

    // Direct module access (untuk advanced usage)
    ledgerModule: ledger,
    budgetModule: budget,
    goalsModule: goals,
    analyticsModule: analytics
};
