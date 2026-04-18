/**
 * =========================================
 * PLUGIN: fin-balance.js — Balance & Summary
 * =========================================
 * Command: .finbalance
 * Menampilkan saldo, ringkasan bulanan, status budget, dan progress goal
 *
 * INTEGRASI:
 * - Menggunakan ctx.user.number dari middleware
 * - Aman terhadap missing summary field
 * - Tidak merusak logika engine utama
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // =========================================
        // VALIDASI CTX
        // =========================================
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = String(ctx?.user?.number || '').trim();

        if (!userId) {
            await reply('❌ User identity tidak valid. Silakan login ulang.');
            return;
        }

        // =========================================
        // LOCAL CONTEXT
        // =========================================
        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb || null
        };

        // =========================================
        // ENGINE INIT
        // =========================================
        const {
            initFinanceDB,
            getQuickSummary,
            formatCurrency
        } = require('../src/domain/finance/engine');

        initFinanceDB();

        // =========================================
        // SUMMARY SAFE FETCH
        // =========================================
        const summaryRaw = await getQuickSummary(userId);

        const summary = summaryRaw || {};

        const balance = Number(summary.balance || 0);
        const totalIncome = Number(summary.totalIncome || 0);
        const totalExpense = Number(summary.totalExpense || 0);
        const netFlow = Number(summary.netFlow || 0);

        const monthly = summary.monthly || {};
        const monthlyIncome = Number(monthly.income || 0);
        const monthlyExpense = Number(monthly.expense || 0);
        const monthlyNet = Number(monthly.net || 0);
        const monthlyTxCount = Number(monthly?.summary?.transactionCount || 0);

        const budgets = Array.isArray(summary.budgets)
            ? summary.budgets
            : [];

        const goals = Array.isArray(summary.goals)
            ? summary.goals
            : [];

        // =========================================
        // BUDGET TEXT
        // =========================================
        let budgetText = '';

        if (budgets.length > 0) {
            for (const b of budgets) {
                const percentage = Number(b?.percentage || 0);
                const spent = Number(b?.spent || 0);
                const limit = Number(b?.budget?.amount || 0);
                const category = b?.budget?.category || 'unknown';

                const bar = generateProgressBar(percentage, 10);

                const status = b?.isOverBudget
                    ? '🔴'
                    : b?.isNearLimit
                        ? '🟡'
                        : '🟢';

                budgetText +=
                    `│  ${status} ${category}: ${formatCurrency(spent)}/${formatCurrency(limit)} ${bar}\n`;
            }
        } else {
            budgetText = '│  (Belum ada budget)\n';
        }

        // =========================================
        // GOALS TEXT
        // =========================================
        let goalsText = '';

        if (goals.length > 0) {
            for (const g of goals) {
                const percentage = Number(g?.percentage || 0);
                const goalName = g?.goal?.name || 'Unnamed Goal';

                const bar = generateProgressBar(percentage, 8);

                const icon = g?.isCompleted
                    ? '✅'
                    : g?.status === 'near-completion'
                        ? '🏁'
                        : '🎯';

                goalsText +=
                    `│  ${icon} ${goalName}: ${Math.round(percentage)}% ${bar}\n`;
            }
        } else {
            goalsText = '│  (Belum ada goal)\n';
        }

        // =========================================
        // LEVEL INFO SAFE
        // =========================================
        const levelInfo =
            typeof ctx?.level !== 'undefined'
                ? `│  ⭐ Level: ${ctx.level || 0} (${ctx.xp || 0} XP)\n`
                : '';

        // =========================================
        // SEND OUTPUT
        // =========================================
        await engine.sendHybrid(m, {
            text: `
╭───〔 💰 FINANCE SUMMARY 〕───╮
│
│  👤 User: ${ctx_local.name}
│  📱 Nomor: ${userId}
${levelInfo}│  📅 Periode: ${new Date().toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric'
            })}
│
├───〔 SALDO 〕───
│  💵 Saldo Saat Ini: ${formatCurrency(balance)}
│  📥 Total Pemasukan: ${formatCurrency(totalIncome)}
│  📤 Total Pengeluaran: ${formatCurrency(totalExpense)}
│  📊 Net Flow: ${netFlow >= 0 ? '+' : ''}${formatCurrency(netFlow)}
│
├───〔 BULAN INI 〕───
│  📥 Income: ${formatCurrency(monthlyIncome)}
│  📤 Expense: ${formatCurrency(monthlyExpense)}
│  📊 Net: ${monthlyNet >= 0 ? '+' : ''}${formatCurrency(monthlyNet)}
│  📋 Transaksi: ${monthlyTxCount}
│
├───〔 BUDGET STATUS 〕───
${budgetText}
├───〔 GOALS PROGRESS 〕───
${goalsText}│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            buttons: [
                {
                    buttonId: '.finadd income ',
                    buttonText: { displayText: '➕ INCOME' }
                },
                {
                    buttonId: '.finadd expense ',
                    buttonText: { displayText: '➖ EXPENSE' }
                },
                {
                    buttonId: '.finreport',
                    buttonText: { displayText: '📊 DETAIL REPORT' }
                }
            ],
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-balance error]', err);
        await reply('❌ Terjadi error saat mengambil data keuangan.');
    }
};

// =========================================
// HELPER: SAFE PROGRESS BAR
// =========================================
const generateProgressBar = (percentage, length = 10) => {
    const safePercentage = Math.max(0, Math.min(100, Number(percentage || 0)));
    const filled = Math.round((safePercentage / 100) * length);
    const empty = Math.max(0, length - filled);

    return '█'.repeat(filled) + '░'.repeat(empty);
};

handler.command = ['finbalance', 'fbal', 'saldo'];
handler.tags = ['finance'];
handler.help = ['finbalance — Lihat ringkasan keuangan'];

module.exports = handler;