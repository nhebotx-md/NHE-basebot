/**
 * =========================================
 * FINANCE DOMAIN — Entry Point
 * =========================================
 * Entry point untuk modul finance.
 * Export semua modul dan fungsi inisialisasi.
 */

const engine = require('./engine');
const events = require('./events');

// =========================================
// Auto-initialize when loaded
// =========================================
const initialize = () => {
    engine.initFinanceDB();
    events.setupDefaultListeners();
    console.log('[FinanceDomain] Finance system initialized and ready');
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Initialization
    initialize,

    // Main engine
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
        analytics: engine.analytics
    },

    // Events
    events: {
        financeEventEmitter: events.financeEventEmitter,
        EVENT_TYPES: events.EVENT_TYPES,
        emitFinanceEvent: events.emitFinanceEvent,
        onFinanceEvent: events.onFinanceEvent,
        setupDefaultListeners: events.setupDefaultListeners
    }
};
