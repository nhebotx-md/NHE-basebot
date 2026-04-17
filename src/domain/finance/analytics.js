/**
 * =========================================
 * ANALYTICS MODULE — Financial Reports & Analysis
 * =========================================
 * Laporan dan analisis data keuangan.
 * Semua perhitungan berbasis ledger (tidak ada nilai manual).
 */

const { getUserTransactions, calculateBalance, getCategorySummary, getMonthlySummary } = require('./ledger');

// =========================================
// UTILITY: Get date ranges
// =========================================
const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(now.setDate(diff)).toISOString();
            endDate = new Date(now.setDate(diff + 7)).toISOString();
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            endDate = new Date(now.getFullYear() + 1, 0, 1).toISOString();
            break;
        default:
            // last 30 days
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            endDate = now.toISOString();
    }

    return { startDate, endDate };
};

// =========================================
// CORE: Get balance summary
// =========================================
const getBalanceSummary = (userId) => {
    const currentBalance = calculateBalance(userId);
    const allTxs = getUserTransactions(userId);

    const totalIncome = allTxs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allTxs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalTransactions = allTxs.length;
    const avgTransaction = totalTransactions > 0
        ? (totalIncome + totalExpense) / totalTransactions
        : 0;

    return {
        currentBalance,
        totalIncome,
        totalExpense,
        netFlow: totalIncome - totalExpense,
        totalTransactions,
        avgTransactionSize: Math.round(avgTransaction),
        currency: allTxs.length > 0 ? allTxs[0].currency : 'IDR'
    };
};

// =========================================
// CORE: Get period report
// =========================================
const getPeriodReport = (userId, period = 'month') => {
    const { startDate, endDate } = getDateRange(period);
    const txs = getUserTransactions(userId, { startDate, endDate });

    let income = 0, expense = 0;
    const categoryBreakdown = {};
    const dailyData = {};

    for (const tx of txs) {
        // Income/Expense totals
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;

        // Category breakdown
        if (!categoryBreakdown[tx.category]) {
            categoryBreakdown[tx.category] = { income: 0, expense: 0, count: 0 };
        }
        if (tx.type === 'income') {
            categoryBreakdown[tx.category].income += tx.amount;
        } else if (tx.type === 'expense') {
            categoryBreakdown[tx.category].expense += tx.amount;
        }
        categoryBreakdown[tx.category].count += 1;

        // Daily aggregation
        const day = tx.timestamp.substring(0, 10);
        if (!dailyData[day]) {
            dailyData[day] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') dailyData[day].income += tx.amount;
        if (tx.type === 'expense') dailyData[day].expense += tx.amount;
    }

    // Find highest spending category
    let highestSpending = { category: null, amount: 0 };
    for (const [cat, data] of Object.entries(categoryBreakdown)) {
        if (data.expense > highestSpending.amount) {
            highestSpending = { category: cat, amount: data.expense };
        }
    }

    return {
        period,
        startDate,
        endDate,
        summary: {
            income,
            expense,
            net: income - expense,
            transactionCount: txs.length
        },
        categoryBreakdown,
        highestSpending,
        dailyTrend: dailyData,
        averageDailySpend: Object.keys(dailyData).length > 0
            ? Math.round(expense / Object.keys(dailyData).length)
            : 0
    };
};

// =========================================
// CORE: Get monthly comparison (last N months)
// =========================================
const getMonthlyComparison = (userId, months = 6) => {
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const summary = getMonthlySummary(userId, d.getFullYear(), d.getMonth() + 1);
        results.push(summary);
    }

    return results;
};

// =========================================
// CORE: Detect spending patterns / anomalies
// =========================================
const detectAnomalies = (userId, options = {}) => {
    const { startDate, endDate } = getDateRange(options.period || 'month');
    const txs = getUserTransactions(userId, { type: 'expense', startDate, endDate });

    if (txs.length < 3) return { anomalies: [], message: 'Not enough data' };

    // Calculate average and standard deviation
    const amounts = txs.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const threshold = options.threshold || 2.5; // Z-score threshold
    const anomalies = [];

    for (const tx of txs) {
        const zScore = (tx.amount - avg) / stdDev;
        if (zScore > threshold) {
            anomalies.push({
                transaction: tx,
                zScore: Math.round(zScore * 100) / 100,
                severity: zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low'
            });
        }
    }

    // Sort by severity
    anomalies.sort((a, b) => b.zScore - a.zScore);

    return {
        anomalies: anomalies.slice(0, 5),
        averageExpense: Math.round(avg),
        totalAnomalies: anomalies.length,
        period: options.period || 'month'
    };
};

// =========================================
// CORE: Generate full financial report
// =========================================
const generateFullReport = (userId, options = {}) => {
    const period = options.period || 'month';

    const balanceSummary = getBalanceSummary(userId);
    const periodReport = getPeriodReport(userId, period);
    const monthlyComparison = getMonthlyComparison(userId, 3);
    const anomalies = detectAnomalies(userId, { period });

    // Calculate savings rate
    const savingsRate = periodReport.summary.income > 0
        ? ((periodReport.summary.income - periodReport.summary.expense) / periodReport.summary.income * 100)
        : 0;

    // Top spending categories
    const topSpending = Object.entries(periodReport.categoryBreakdown)
        .filter(([_, data]) => data.expense > 0)
        .sort((a, b) => b[1].expense - a[1].expense)
        .slice(0, 5)
        .map(([category, data]) => ({
            category,
            amount: data.expense,
            percentage: periodReport.summary.expense > 0
                ? Math.round((data.expense / periodReport.summary.expense) * 100)
                : 0
        }));

    return {
        generatedAt: new Date().toISOString(),
        period,
        balanceSummary,
        periodReport,
        monthlyComparison,
        anomalies,
        savingsRate: Math.round(savingsRate * 100) / 100,
        topSpending,
        financialHealth: {
            score: calculateHealthScore(balanceSummary, savingsRate, anomalies),
            status: getHealthStatus(savingsRate, balanceSummary.currentBalance)
        }
    };
};

// =========================================
// HELPER: Calculate health score (0-100)
// =========================================
const calculateHealthScore = (balance, savingsRate, anomalies) => {
    let score = 50; // Base score

    // Positive balance bonus
    if (balance.currentBalance > 0) score += 15;
    if (balance.currentBalance > 1000000) score += 10;

    // Savings rate bonus
    if (savingsRate > 10) score += 10;
    if (savingsRate > 20) score += 10;
    if (savingsRate < 0) score -= 20;

    // Anomaly penalty
    score -= Math.min(anomalies.totalAnomalies * 3, 15);

    return Math.max(0, Math.min(100, Math.round(score)));
};

// =========================================
// HELPER: Get health status label
// =========================================
const getHealthStatus = (savingsRate, balance) => {
    if (balance < 0) return 'critical';
    if (savingsRate < 0) return 'warning';
    if (savingsRate >= 20 && balance > 0) return 'excellent';
    if (savingsRate >= 10 && balance > 0) return 'good';
    return 'fair';
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
    getBalanceSummary,
    getPeriodReport,
    getMonthlyComparison,
    detectAnomalies,
    generateFullReport,
    getDateRange
};
