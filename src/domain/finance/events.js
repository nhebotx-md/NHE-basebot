/**
 * =========================================
 * FINANCE EVENT SYSTEM — Event-Driven Architecture
 * =========================================
 * Sistem event untuk finance module.
 * Setiap transaksi bisa memicu event.
 * Event bisa didengarkan oleh modul lain.
 */

const EventEmitter = require('events');

// =========================================
// Create dedicated finance event emitter
// =========================================
const financeEventEmitter = new EventEmitter();

// Set max listeners to avoid warnings
financeEventEmitter.setMaxListeners(50);

// =========================================
// EVENT TYPES (constants)
// =========================================
const EVENT_TYPES = {
    // Transaction events
    TRANSACTION_CREATED: 'transaction:created',
    INCOME_RECEIVED: 'income:received',
    EXPENSE_RECORDED: 'expense:recorded',

    // Budget events
    BUDGET_NEAR_LIMIT: 'budget:near-limit',
    BUDGET_EXCEEDED: 'budget:exceeded',
    BUDGET_CREATED: 'budget:created',

    // Goal events
    GOAL_CONTRIBUTED: 'goal:contributed',
    GOAL_COMPLETED: 'goal:completed',
    GOAL_NEAR_DEADLINE: 'goal:near-deadline',

    // Anomaly events
    ANOMALY_DETECTED: 'anomaly:detected',
    HIGH_EXPENSE_DETECTED: 'expense:high-detected',

    // System events
    FINANCE_INITIALIZED: 'finance:initialized',
    REPORT_GENERATED: 'report:generated'
};

// =========================================
// Emit event with data
// =========================================
const emitFinanceEvent = (eventType, data) => {
    try {
        financeEventEmitter.emit(eventType, data);
        financeEventEmitter.emit('*', { type: eventType, ...data }); // Wildcard listener
    } catch (err) {
        console.error(`[FinanceEvent] Error emitting ${eventType}:`, err.message);
    }
};

// =========================================
// Subscribe to event
// =========================================
const onFinanceEvent = (eventType, listener) => {
    financeEventEmitter.on(eventType, listener);
    return () => financeEventEmitter.off(eventType, listener); // Return unsubscribe function
};

// =========================================
// Subscribe once
// =========================================
const onceFinanceEvent = (eventType, listener) => {
    financeEventEmitter.once(eventType, listener);
};

// =========================================
// Setup default listeners
// =========================================
const setupDefaultListeners = () => {
    // Budget alert listener
    onFinanceEvent(EVENT_TYPES.EXPENSE_RECORDED, (data) => {
        const { userId, category, amount } = data;

        // Check budget status after expense
        const budgetEngine = require('./budget');
        const budgets = budgetEngine.getUserBudgets(userId, { activeOnly: true, category });

        for (const b of budgets) {
            const progress = budgetEngine.getBudgetProgress(b.id);
            if (!progress) continue;

            if (progress.isOverBudget) {
                emitFinanceEvent(EVENT_TYPES.BUDGET_EXCEEDED, {
                    userId,
                    budget: b,
                    progress,
                    message: `Budget ${b.category} exceeded! Spent ${progress.spent}/${b.amount}`
                });
            } else if (progress.isNearLimit) {
                emitFinanceEvent(EVENT_TYPES.BUDGET_NEAR_LIMIT, {
                    userId,
                    budget: b,
                    progress,
                    message: `Budget ${b.category} at ${Math.round(progress.percentage)}%`
                });
            }
        }
    });

    // Goal completion listener
    onFinanceEvent(EVENT_TYPES.GOAL_CONTRIBUTED, (data) => {
        const { userId, goal, contributed, remaining } = data;

        if (goal.isCompleted) {
            emitFinanceEvent(EVENT_TYPES.GOAL_COMPLETED, {
                userId,
                goal,
                message: `Goal "${goal.name}" completed! Target: ${goal.targetAmount}`
            });
        } else if (remaining > 0 && goal.deadline) {
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7 && daysLeft > 0) {
                emitFinanceEvent(EVENT_TYPES.GOAL_NEAR_DEADLINE, {
                    userId,
                    goal,
                    daysLeft,
                    remaining,
                    message: `Goal "${goal.name}" deadline in ${daysLeft} days. Still need ${remaining}`
                });
            }
        }
    });

    console.log('[FinanceEvent] Default listeners registered');
};

// =========================================
// Get event stats
// =========================================
const getEventStats = () => {
    const events = Object.values(EVENT_TYPES);
    const stats = {};
    for (const event of events) {
        stats[event] = financeEventEmitter.listenerCount(event);
    }
    return {
        events: stats,
        totalListeners: financeEventEmitter.listenerCount('*') +
            events.reduce((sum, e) => sum + financeEventEmitter.listenerCount(e), 0)
    };
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    financeEventEmitter,
    EVENT_TYPES,
    emitFinanceEvent,
    onFinanceEvent,
    onceFinanceEvent,
    setupDefaultListeners,
    getEventStats
};
