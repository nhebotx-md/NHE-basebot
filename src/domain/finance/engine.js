/**
 * =========================================
 * FINANCE ENGINE — Main Controller
 * =========================================
 * Pengatur utama seluruh logic finance.
 * Mengintegrasikan ledger, budget, goals, dan analytics.
 * Tidak ada logic berat — hanya orkestrasi.
 */

const ledger = require('./ledger');
const budget = require('./budget');
const goals = require('./goals');
const analytics = require('./analytics');

// =========================================
// Initialize global.db.finance
// =========================================
const initFinanceDB = () => {
    if (!global.db) global.db = {};
    if (!global.db.finance) {
        global.db.finance = {
            initialized: true,
            initializedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        console.log('[FinanceEngine] global.db.finance initialized');
    }
    return global.db.finance;
};

// =========================================
// LEDGER OPERATIONS
// =========================================
const addIncome = (userId, amount, category, description, metadata = {}) => {
    const validation = ledger.validateEntry({ userId, type: 'income', amount, category });
    if (!validation.valid) return { success: false, errors: validation.errors };

    const tx = ledger.addTransaction({
        userId,
        type: 'income',
        category,
        amount,
        description,
        metadata,
        source: 'whatsapp'
    });

    // Process auto-allocation to goals
    const allocations = goals.processAutoAllocation(userId, amount);

    return {
        success: true,
        transaction: tx,
        newBalance: tx.runningBalance,
        allocations
    };
};

const addExpense = (userId, amount, category, description, metadata = {}) => {
    const validation = ledger.validateEntry({ userId, type: 'expense', amount, category });
    if (!validation.valid) return { success: false, errors: validation.errors };

    // Check budget before recording
    const budgetAlerts = checkBudgetAlerts(userId, category, parseFloat(amount));

    const tx = ledger.addTransaction({
        userId,
        type: 'expense',
        category,
        amount,
        description,
        metadata,
        source: 'whatsapp'
    });

    return {
        success: true,
        transaction: tx,
        newBalance: tx.runningBalance,
        budgetAlerts
    };
};

// =========================================
// BUDGET OPERATIONS
// =========================================
const checkBudgetAlerts = (userId, category, newSpend = 0) => {
    const userBudgets = budget.getUserBudgets(userId, { activeOnly: true, category });
    const alerts = [];

    for (const b of userBudgets) {
        const progress = budget.getBudgetProgress(b.id);
        if (!progress) continue;

        // Simulate with new spend
        const simulatedSpent = progress.spent + newSpend;
        const simulatedPercentage = (simulatedSpent / b.amount) * 100;

        if (simulatedSpent > b.amount) {
            alerts.push({
                type: 'over-budget',
                budget: b,
                spent: simulatedSpent,
                remaining: 0,
                message: `⚠️ Over budget for ${b.category}! Limit: ${formatCurrency(b.amount)}, Spent: ${formatCurrency(simulatedSpent)}`
            });
        } else if (simulatedPercentage >= b.alertThreshold) {
            alerts.push({
                type: 'near-limit',
                budget: b,
                percentage: Math.round(simulatedPercentage),
                remaining: b.amount - simulatedSpent,
                message: `📢 ${Math.round(simulatedPercentage)}% of ${b.category} budget used (${formatCurrency(simulatedSpent)}/${formatCurrency(b.amount)})`
            });
        }
    }

    return alerts;
};

// =========================================
// GOAL OPERATIONS
// =========================================
const contributeGoal = (goalId, amount, note = '') => {
    return goals.contributeToGoal(goalId, amount, note);
};

// =========================================
// REPORTING
// =========================================
const getQuickSummary = (userId) => {
    const balance = analytics.getBalanceSummary(userId);
    const monthly = analytics.getPeriodReport(userId, 'month');
    const goalsProgress = goals.getAllGoalsProgress(userId);
    const budgetStatus = budget.checkAllBudgets(userId);

    return {
        balance,
        monthly,
        goals: goalsProgress,
        budgets: budgetStatus,
        timestamp: new Date().toISOString()
    };
};

// =========================================
// UTILITY: Format currency
// =========================================
const formatCurrency = (amount, currency = 'IDR') => {
    if (currency === 'IDR') {
        return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
    }
    return amount.toLocaleString('en-US', { style: 'currency', currency });
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // Initialization
    initFinanceDB,

    // Ledger operations
    addIncome,
    addExpense,

    // Goal operations
    contributeGoal,

    // Reporting
    getQuickSummary,

    // Utility
    formatCurrency,

    // Direct module access (for advanced use)
    ledger,
    budget,
    goals,
    analytics
};
