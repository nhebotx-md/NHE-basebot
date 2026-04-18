/**
 * =========================================
 * PLUGIN: fin-balance.js — Balance & Summary
 * =========================================
 * Command: .finbalance
 * Menampilkan saldo, ringkasan bulanan, status budget, dan progress goal
 *
 * INTEGRASI: Menggunakan ctx.user.number dari middleware
 * sebagai userId untuk sistem finance.
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // 🔧 INTEGRASI MIDDLEWARE: Gunakan ctx dari middleware
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = ctx.user.number;

        // Build local ctx untuk ReplyEngine
        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // Initialize dan get summary
        const { initFinanceDB, getQuickSummary, formatCurrency } = require('../src/domain/finance/engine');
        initFinanceDB();

        const summary = getQuickSummary(userId);
        const bal = summary.balance || 0;
        const monthly = summary.monthly || { income: 0, expense: 0, net: 0, summary: { income: 0, expense: 0, net: 0, transactionCount: 0 } };

        // Build budget status text
        let budgetText = '';
        if (summary.budgets && summary.budgets.length > 0) {
            for (const b of summary.budgets) {
                const bar = generateProgressBar(b.percentage, 10);
                const status = b.isOverBudget ? '🔴' : b.isNearLimit ? '🟡' : '🟢';
                budgetText += `│  ${status} ${b.budget.category}: ${formatCurrency(b.spent)}/${formatCurrency(b.budget.amount)} ${bar}\n`;
            }
        } else {
            budgetText = '│  (Belum ada budget)\n';
        }

        // Build goals text
        let goalsText = '';
        if (summary.goals && summary.goals.length > 0) {
            for (const g of summary.goals) {
                const bar = generateProgressBar(g.percentage, 8);
                const icon = g.isCompleted ? '✅' : g.status === 'near-completion' ? '🏁' : '🎯';
                goalsText += `│  ${icon} ${g.goal.name}: ${Math.round(g.percentage)}% ${bar}\n`;
            }
        } else {
            goalsText = '│  (Belum ada goal)\n';
        }

        // 🔥 LEVEL INFO dari middleware ctx
        const levelInfo = ctx ? `│  ⭐ Level: ${ctx.level} (${ctx.xp} XP)\n` : '';

        await engine.sendHybrid(m, {
            text: `
╭───〔 💰 FINANCE SUMMARY 〕───╮
│
│  👤 User: ${ctx_local.name}
│  📱 Nomor: ${userId}
${levelInfo}│  📅 Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
│
├───〔 SALDO 〕───
│  💵 Saldo Saat Ini: ${formatCurrency(bal)}
│  📥 Total Pemasukan: ${formatCurrency(summary.totalIncome)}
│  📤 Total Pengeluaran: ${formatCurrency(summary.totalExpense)}
│  📊 Net Flow: ${summary.netFlow >= 0 ? '+' : ''}${formatCurrency(summary.netFlow)}
│
├───〔 BULAN INI 〕───
│  📥 Income: ${formatCurrency(monthly.income)}
│  📤 Expense: ${formatCurrency(monthly.expense)}
│  📊 Net: ${monthly.net >= 0 ? '+' : ''}${formatCurrency(monthly.net)}
│  📋 Transaksi: ${monthly.summary.transactionCount}
│
├───〔 BUDGET STATUS 〕───
${budgetText}
├───〔 GOALS PROGRESS 〕───
${goalsText}│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            buttons: [
                { buttonId: '.finadd income ', buttonText: { displayText: '➕ INCOME' } },
                { buttonId: '.finadd expense ', buttonText: { displayText: '➖ EXPENSE' } },
                { buttonId: '.finreport', buttonText: { displayText: '📊 DETAIL REPORT' } }
            ],
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-balance error]', err);
        await reply('❌ Terjadi error saat mengambil data keuangan.');
    }
};

// =========================================
// Helper: Generate progress bar
// =========================================
const generateProgressBar = (percentage, length = 10) => {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(Math.min(filled, length)) + '░'.repeat(Math.max(0, empty));
};

handler.command = ['finbalance', 'fbal', 'saldo'];
handler.tags = ['finance'];
handler.help = ['finbalance — Lihat ringkasan keuangan'];

module.exports = handler;
