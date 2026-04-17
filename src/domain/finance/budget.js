/**
 * =========================================
 * BUDGET MODULE — Budget & Spending Control
 * =========================================
 * Logika anggaran dan kontrol pengeluaran per user.
 * Setiap budget terkait dengan kategori pengeluaran.
 */

const fs = require('fs');
const path = require('path');
const { getUserTransactions, calculateBalance } = require('./ledger');

const DATA_DIR = path.join(process.cwd(), 'data');
const BUDGET_FILE = path.join(DATA_DIR, 'finance-budgets.json');

// =========================================
// UTILITY: Load budgets from file
// =========================================
const loadBudgets = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BUDGET_FILE)) {
        return [];
    }
    try {
        const raw = fs.readFileSync(BUDGET_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('[FinanceBudget] Error loading budgets:', err.message);
        return [];
    }
};

// =========================================
// UTILITY: Save budgets to file
// =========================================
const saveBudgets = (budgets) => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgets, null, 2));
};

// =========================================
// UTILITY: Generate budget ID
// =========================================
const generateBudgetId = () => {
    return 'BGT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
};

// =========================================
// CORE: Create budget
// =========================================
const createBudget = (data) => {
    const budgets = loadBudgets();

    const budget = {
        id: generateBudgetId(),
        userId: data.userId,
        category: data.category,
        amount: parseFloat(data.amount),
        period: data.period || 'monthly', // monthly | weekly | yearly
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate || null,
        alertThreshold: data.alertThreshold || 80, // percentage (alert at 80%)
        isActive: true,
        createdAt: new Date().toISOString(),
        notes: data.notes || ''
    };

    // Deactivate any existing active budget for same category
    const existing = budgets.find(
        b => b.userId === budget.userId && b.category === budget.category && b.isActive
    );
    if (existing) {
        existing.isActive = false;
        existing.endDate = new Date().toISOString();
    }

    budgets.push(budget);
    saveBudgets(budgets);

    return budget;
};

// =========================================
// CORE: Get user budgets
// =========================================
const getUserBudgets = (userId, options = {}) => {
    const budgets = loadBudgets();
    let result = budgets.filter(b => b.userId === userId);

    if (options.activeOnly !== false) {
        result = result.filter(b => b.isActive);
    }
    if (options.category) {
        result = result.filter(b => b.category === options.category);
    }

    return result;
};

// =========================================
// CORE: Get single budget
// =========================================
const getBudget = (budgetId) => {
    const budgets = loadBudgets();
    return budgets.find(b => b.id === budgetId) || null;
};

// =========================================
// CORE: Update budget
// =========================================
const updateBudget = (budgetId, updates) => {
    const budgets = loadBudgets();
    const idx = budgets.findIndex(b => b.id === budgetId);
    if (idx === -1) return null;

    const allowedFields = ['amount', 'period', 'alertThreshold', 'isActive', 'endDate', 'notes'];
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            budgets[idx][field] = updates[field];
        }
    }

    saveBudgets(budgets);
    return budgets[idx];
};

// =========================================
// CORE: Deactivate budget
// =========================================
const deactivateBudget = (budgetId) => {
    return updateBudget(budgetId, { isActive: false, endDate: new Date().toISOString() });
};

// =========================================
// CORE: Get spending progress for budget
// =========================================
const getBudgetProgress = (budgetId) => {
    const budget = getBudget(budgetId);
    if (!budget) return null;

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    } else if (budget.period === 'weekly') {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff)).toISOString();
        endDate = new Date(now.setDate(diff + 7)).toISOString();
    } else {
        startDate = budget.startDate;
        endDate = budget.endDate || new Date().toISOString();
    }

    // Get actual spending from ledger
    const txs = getUserTransactions(budget.userId, {
        type: 'expense',
        category: budget.category,
        startDate,
        endDate
    });

    const spent = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;

    return {
        budget,
        spent,
        remaining: Math.max(0, remaining),
        percentage: Math.min(100, percentage),
        isOverBudget: spent > budget.amount,
        isNearLimit: percentage >= budget.alertThreshold,
        transactions: txs.length,
        periodStart: startDate,
        periodEnd: endDate
    };
};

// =========================================
// CORE: Check all budgets status
// =========================================
const checkAllBudgets = (userId) => {
    const budgets = getUserBudgets(userId, { activeOnly: true });
    const results = [];

    for (const budget of budgets) {
        results.push(getBudgetProgress(budget.id));
    }

    return results;
};

// =========================================
// CORE: Validate budget data
// =========================================
const validateBudget = (data) => {
    const errors = [];

    if (!data.userId) errors.push('userId is required');
    if (!data.category) errors.push('category is required');
    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
        errors.push('amount must be a positive number');
    }
    if (data.period && !['monthly', 'weekly', 'yearly'].includes(data.period)) {
        errors.push('period must be monthly, weekly, or yearly');
    }
    if (data.alertThreshold && (data.alertThreshold < 0 || data.alertThreshold > 100)) {
        errors.push('alertThreshold must be between 0 and 100');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    // CRUD
    createBudget,
    getUserBudgets,
    getBudget,
    updateBudget,
    deactivateBudget,

    // Analysis
    getBudgetProgress,
    checkAllBudgets,

    // Validation
    validateBudget
};
