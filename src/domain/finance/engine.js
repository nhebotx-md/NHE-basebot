/**
 * =========================================
 * ENGINE MODULE — Finance System Orchestrator
 * =========================================
 * Orchestrator utama sistem finance.
 * Menyatukan semua modul finance dan menyediakan API terpadu.
 *
 * ⚠️ CRITICAL RULES:
 * - JANGAN mengakses global.db.users (itu tugas middleware/databaseSync)
 * - JANGAN menyimpan ke database.json (itu tugas databaseSync.js)
 * - Hanya mengelola data finance (ledger, budgets, goals)
 * - Semua balance adalah derived calculation (dari wallet.js)
 *
 * 🔧 REFACTORED: v2.0.0 - Isolated from global.db
 * =========================================
 */

// =========================================
// IMPORTS
// =========================================
const {
    initStorage,
    getFinanceMeta,
    getLedger,
    getBudgets,
    getGoals,
    setLedger,
    setBudgets,
    setGoals,
    saveAll,
    markModified
} = require('./storage');

const {
    calculateBalance,
    getTotalIncome,
    getTotalExpense,
    getNetFlow,
    getWalletSummary,
    formatRupiah
} = require('./wallet');

const ledger = require('./ledger');
const budget = require('./budget');
const goals = require('./goals');
const analytics = require('./analytics');
const events = require('./events');

// =========================================
// INITIALIZATION
// =========================================

/**
 * Initialize finance system
 * - Sets up isolated storage (tidak menyentuh global.db)
 * - Memastikan file finance tersedia
 * - SAFE to call multiple times (idempotent)
 */
function initFinanceDB() {
    // Inisialisasi storage terpisah (tidak menyentuh global.db)
    initStorage();
    console.log('[FinanceEngine] Finance system initialized (isolated mode v2.0.0)');
}

// =========================================
// TRANSACTION MANAGEMENT
// =========================================

/**
 * Add income transaction
 * @param {string} userId - User ID (ctx.user.number)
 * @param {Object} data - Transaction data { amount, category, description, date }
 * @returns {Object} Transaction result
 */
function addIncome(userId, data) {
    const entry = {
        userId,
        type: 'income',
        amount: data.amount || data,
        category: data.category || 'Lainnya',
        description: data.description || '',
        currency: data.currency || 'IDR',
        date: data.date || new Date().toISOString(),
        source: data.source || 'whatsapp'
    };

    // Validate
    const validation = ledger.validateEntry(entry);
    if (!validation.valid) {
        return { success: false, errors: validation.errors };
    }

    // Add to ledger (append-only)
    const tx = ledger.addTransaction(entry);

    // Emit event
    events.emitFinanceEvent(events.EVENT_TYPES.INCOME_RECEIVED, {
        userId,
        amount: tx.amount,
        category: tx.category,
        transaction: tx
    });

    // Calculate new balance
    const newBalance = calculateBalance(userId);

    // Check auto-allocation for goals
    const allocationResults = goals.processAutoAllocation(userId, tx.amount);
    if (allocationResults.length > 0) {
        // Recalculate balance after auto-allocation
        const finalBalance = calculateBalance(userId);
        return {
            success: true,
            transaction: tx,
            newBalance: finalBalance,
            autoAllocations: allocationResults
        };
    }

    return {
        success: true,
        transaction: tx,
        newBalance
    };
}

/**
 * Add expense transaction
 * @param {string} userId - User ID (ctx.user.number)
 * @param {Object} data - Transaction data { amount, category, description, date }
 * @returns {Object} Transaction result
 */
function addExpense(userId, data) {
    const entry = {
        userId,
        type: 'expense',
        amount: data.amount || data,
        category: data.category || 'Lainnya',
        description: data.description || '',
        currency: data.currency || 'IDR',
        date: data.date || new Date().toISOString(),
        source: data.source || 'whatsapp'
    };

    // Validate
    const validation = ledger.validateEntry(entry);
    if (!validation.valid) {
        return { success: false, errors: validation.errors };
    }

    // Add to ledger (append-only)
    const tx = ledger.addTransaction(entry);

    // Check budget alerts
    const budgetAlerts = checkBudgetAlerts(userId, tx.category, tx.amount);

    // Emit event
    events.emitFinanceEvent(events.EVENT_TYPES.EXPENSE_RECORDED, {
        userId,
        amount: tx.amount,
        category: tx.category,
        transaction: tx
    });

    // Calculate new balance
    const newBalance = calculateBalance(userId);

    return {
        success: true,
        transaction: tx,
        newBalance,
        budgetAlerts: budgetAlerts.length > 0 ? budgetAlerts : null
    };
}

// =========================================
// BUDGET ALERTS
// =========================================

/**
 * Check budget status after expense
 * @private
 */
function checkBudgetAlerts(userId, category, amount) {
    const alerts = [];
    const userBudgets = budget.getUserBudgets(userId, { activeOnly: true, category });

    for (const b of userBudgets) {
        const progress = budget.getBudgetProgress(b.id);
        if (!progress) continue;

        if (progress.isOverBudget) {
            alerts.push({
                type: 'over_budget',
                message: `Budget ${b.category} melebihi limit! (${formatRupiah(progress.spent)}/${formatRupiah(b.amount)})`,
                budget: b,
                progress
            });
            events.emitFinanceEvent(events.EVENT_TYPES.BUDGET_EXCEEDED, {
                userId,
                budget: b,
                progress
            });
        } else if (progress.isNearLimit) {
            alerts.push({
                type: 'near_limit',
                message: `Budget ${b.category} sudah ${Math.round(progress.percentage)}%`,
                budget: b,
                progress
            });
            events.emitFinanceEvent(events.EVENT_TYPES.BUDGET_NEAR_LIMIT, {
                userId,
                budget: b,
                progress
            });
        }
    }

    return alerts;
}

// =========================================
// BUDGET MANAGEMENT (delegasi ke budget.js)
// =========================================

function setBudget(userId, category, amount, options = {}) {
    return budget.createBudget({
        userId,
        category,
        amount,
        period: options.period || 'monthly',
        alertThreshold: options.alertThreshold || 80,
        notes: options.notes || ''
    });
}

// =========================================
// GOAL MANAGEMENT (delegasi ke goals.js)
// =========================================

function addGoal(userId, goalData) {
    return goals.createGoal({
        userId,
        ...goalData
    });
}

function contributeGoal(goalId, amount) {
    const result = goals.contributeToGoal(goalId, amount);

    if (result.success && result.goal.isCompleted) {
        events.emitFinanceEvent(events.EVENT_TYPES.GOAL_COMPLETED, {
            goal: result.goal,
            message: `Goal "${result.goal.name}" tercapai!`
        });
    }

    return result;
}

// =========================================
// ANALYTICS (delegasi ke analytics.js)
// =========================================

function getQuickSummary(userId) {
    const wallet = getWalletSummary(userId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // Get budget status
    const userBudgets = budget.getUserBudgets(userId);
    const budgetProgress = userBudgets.map(b => budget.getBudgetProgress(b.id));

    // Get goals progress
    const userGoals = goals.getUserGoals(userId);
    const goalsProgress = userGoals.map(g => goals.getGoalProgress(g.id));

    return {
        balance: wallet.balance,
        totalIncome: wallet.totalIncome,
        totalExpense: wallet.totalExpense,
        netFlow: wallet.netFlow,
        transactionCount: ledger.getUserTransactions(userId).length,
        monthly: {
            income: wallet.monthly.income,
            expense: wallet.monthly.expense,
            net: wallet.monthly.net,
            summary: {
                income: wallet.monthly.income,
                expense: wallet.monthly.expense,
                net: wallet.monthly.net,
                transactionCount: ledger.getUserTransactions(userId, { startDate: monthStart, endDate: monthEnd }).length
            }
        },
        budgets: budgetProgress,
        goals: goalsProgress,
        // Backward compatibility
        usersCount: null // Tidak lagi mengakses user data
    };
}

// =========================================
// UTILITY EXPORTS
// =========================================

module.exports = {
    // Initialization
    initFinanceDB,

    // Transactions
    addIncome,
    addExpense,

    // Budget
    setBudget,

    // Goals
    addGoal,
    contributeGoal,

    // Analytics / Summary
    getQuickSummary,

    // Formatting
    formatCurrency: formatRupiah,

    // Direct module access (for advanced usage)
    get ledger() { return ledger; },
    get budget() { return budget; },
    get goals() { return goals; },
    get analytics() { return analytics; },
    get events() { return events; },
    get wallet() { return { calculateBalance, getWalletSummary, formatRupiah }; }
};
