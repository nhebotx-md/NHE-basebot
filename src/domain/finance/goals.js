/**
 * =========================================
 * GOALS MODULE — Financial Target System
 * =========================================
 * Sistem target keuangan untuk tracking progress
 * tabungan, dana darurat, investasi, dll.
 */

const fs = require('fs');
const path = require('path');
const { calculateBalance, addTransaction } = require('./ledger');

const DATA_DIR = path.join(process.cwd(), 'data');
const GOALS_FILE = path.join(DATA_DIR, 'finance-goals.json');

// =========================================
// UTILITY: Load goals from file
// =========================================
const loadGoals = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(GOALS_FILE)) {
        return [];
    }
    try {
        const raw = fs.readFileSync(GOALS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('[FinanceGoals] Error loading goals:', err.message);
        return [];
    }
};

// =========================================
// UTILITY: Save goals to file
// =========================================
const saveGoals = (goals) => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(GOALS_FILE, JSON.stringify(goals, null, 2));
};

// =========================================
// UTILITY: Generate goal ID
// =========================================
const generateGoalId = () => {
    return 'GL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
};

// =========================================
// CORE: Create financial goal
// =========================================
const createGoal = (data) => {
    const goals = loadGoals();

    const goal = {
        id: generateGoalId(),
        userId: data.userId,
        name: data.name,
        description: data.description || '',
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: 0,
        deadline: data.deadline || null, // ISO date string
        category: data.category || 'savings', // savings | emergency | investment | debt | other
        priority: data.priority || 'medium', // low | medium | high
        isActive: true,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        autoAllocate: data.autoAllocate || false, // auto allocate from income
        allocatePercentage: data.allocatePercentage || 0
    };

    goals.push(goal);
    saveGoals(goals);

    return goal;
};

// =========================================
// CORE: Get user goals
// =========================================
const getUserGoals = (userId, options = {}) => {
    const goals = loadGoals();
    let result = goals.filter(g => g.userId === userId);

    if (options.activeOnly !== false) {
        result = result.filter(g => g.isActive);
    }
    if (options.category) {
        result = result.filter(g => g.category === options.category);
    }
    if (options.priority) {
        result = result.filter(g => g.priority === options.priority);
    }

    return result;
};

// =========================================
// CORE: Get single goal
// =========================================
const getGoal = (goalId) => {
    const goals = loadGoals();
    return goals.find(g => g.id === goalId) || null;
};

// =========================================
// CORE: Update goal
// =========================================
const updateGoal = (goalId, updates) => {
    const goals = loadGoals();
    const idx = goals.findIndex(g => g.id === goalId);
    if (idx === -1) return null;

    const allowedFields = ['name', 'description', 'targetAmount', 'deadline', 'category', 'priority', 'isActive', 'autoAllocate', 'allocatePercentage'];
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            goals[idx][field] = updates[field];
        }
    }

    saveGoals(goals);
    return goals[idx];
};

// =========================================
// CORE: Contribute to goal
// =========================================
const contributeToGoal = (goalId, amount, description = '') => {
    const goals = loadGoals();
    const idx = goals.findIndex(g => g.id === goalId);
    if (idx === -1) return { success: false, error: 'Goal not found' };

    const goal = goals[idx];
    if (!goal.isActive || goal.isCompleted) {
        return { success: false, error: 'Goal is not active' };
    }

    const contribAmount = parseFloat(amount);
    if (isNaN(contribAmount) || contribAmount <= 0) {
        return { success: false, error: 'Invalid amount' };
    }

    goal.currentAmount += contribAmount;

    // Check if goal reached
    if (goal.currentAmount >= goal.targetAmount) {
        goal.isCompleted = true;
        goal.completedAt = new Date().toISOString();
    }

    saveGoals(goals);

    // Record in ledger as expense (money set aside)
    if (description !== 'skip-ledger') {
        addTransaction({
            userId: goal.userId,
            type: 'expense',
            category: `goal-${goal.category}`,
            amount: contribAmount,
            description: `Goal contribution: ${goal.name}${description ? ' - ' + description : ''}`,
            tags: ['goal', goal.category]
        });
    }

    return {
        success: true,
        goal: goals[idx],
        contributed: contribAmount,
        remaining: Math.max(0, goal.targetAmount - goal.currentAmount)
    };
};

// =========================================
// CORE: Delete goal (soft delete)
// =========================================
const deleteGoal = (goalId) => {
    return updateGoal(goalId, { isActive: false });
};

// =========================================
// CORE: Get goal progress
// =========================================
const getGoalProgress = (goalId) => {
    const goal = getGoal(goalId);
    if (!goal) return null;

    const percentage = goal.targetAmount > 0
        ? (goal.currentAmount / goal.targetAmount) * 100
        : 0;

    let daysRemaining = null;
    let dailyRequired = null;

    if (goal.deadline && !goal.isCompleted) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        const remaining = goal.targetAmount - goal.currentAmount;
        if (daysRemaining > 0 && remaining > 0) {
            dailyRequired = remaining / daysRemaining;
        }
    }

    return {
        goal,
        percentage: Math.min(100, percentage),
        isCompleted: goal.isCompleted,
        remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
        daysRemaining,
        dailyRequired: dailyRequired ? Math.ceil(dailyRequired) : null,
        status: goal.isCompleted ? 'completed'
            : percentage >= 75 ? 'near-completion'
            : percentage >= 50 ? 'halfway'
            : percentage > 0 ? 'in-progress'
            : 'not-started'
    };
};

// =========================================
// CORE: Get all goals progress for user
// =========================================
const getAllGoalsProgress = (userId) => {
    const goals = getUserGoals(userId);
    return goals.map(g => getGoalProgress(g.id));
};

// =========================================
// CORE: Auto-allocate from income
// =========================================
const processAutoAllocation = (userId, incomeAmount) => {
    const goals = getUserGoals(userId, { activeOnly: true });
    const results = [];

    for (const goal of goals) {
        if (goal.autoAllocate && goal.allocatePercentage > 0 && !goal.isCompleted) {
            const allocAmount = (incomeAmount * goal.allocatePercentage) / 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const actualAlloc = Math.min(allocAmount, remaining);

            if (actualAlloc > 0) {
                const result = contributeToGoal(goal.id, actualAlloc, 'Auto-allocation');
                results.push({
                    goalName: goal.name,
                    allocated: actualAlloc,
                    success: result.success
                });
            }
        }
    }

    return results;
};

// =========================================
// VALIDATION
// =========================================
const validateGoal = (data) => {
    const errors = [];

    if (!data.userId) errors.push('userId is required');
    if (!data.name) errors.push('name is required');
    if (!data.targetAmount || isNaN(data.targetAmount) || parseFloat(data.targetAmount) <= 0) {
        errors.push('targetAmount must be a positive number');
    }
    if (data.category && !['savings', 'emergency', 'investment', 'debt', 'other'].includes(data.category)) {
        errors.push('category must be savings, emergency, investment, debt, or other');
    }
    if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
        errors.push('priority must be low, medium, or high');
    }
    if (data.allocatePercentage && (data.allocatePercentage < 0 || data.allocatePercentage > 100)) {
        errors.push('allocatePercentage must be between 0 and 100');
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
    createGoal,
    getUserGoals,
    getGoal,
    updateGoal,
    deleteGoal,

    // Contributions
    contributeToGoal,

    // Progress
    getGoalProgress,
    getAllGoalsProgress,

    // Auto-allocation
    processAutoAllocation,

    // Validation
    validateGoal
};
