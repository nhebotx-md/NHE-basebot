/**
 * =========================================
 * PLUGIN: fin-balance.js — Balance & Summary
 * =========================================
 * Command: .finbalance
 * Menampilkan saldo, ringkasan bulanan, status budget, dan progress goal
 *
 * FIX:
 * - remove initFinanceDB (NOT EXIST)
 * - remove getQuickSummary (NOT EXIST)
 * - replace with ensureUser + getBalance
 * - replace formatCurrency -> formatRupiah
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // ================================
        // VALIDASI CONTEXT (WAJIB)
        // ================================
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        if (!ctx.userId) {
            console.error('[fin-balance] ctx.userId missing:', ctx);
            await reply('❌ Sistem gagal membaca identitas user');
            return;
        }

        const userId = ctx.userId;
        const number = ctx.number;

        // ================================
        // LOCAL CONTEXT UNTUK UI
        // ================================
        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number,
            thumb: global?.thumb
        };

        // ================================
        // ENGINE IMPORT (FIXED)
        // ================================
        const {
            ensureUser,
            getBalance,
            formatRupiah
        } = require('../src/domain/finance/engine');

        // ================================
        // INIT USER SAFE (REPLACEMENT initFinanceDB)
        // ================================
        await ensureUser(userId);

        // ================================
        // FETCH BALANCE (REPLACEMENT getQuickSummary)
        // ================================
        const summary = await getBalance(userId);

        const balance = Number(summary?.balance || 0);
        const totalIncome = Number(summary?.totalIncome || 0);
        const totalExpense = Number(summary?.totalExpense || 0);
        const netFlow = totalIncome - totalExpense;

        // ================================
        // SAFE DEFAULT (karena engine belum support monthly/budget/goals)
        // ================================
        const monthly = {};
        const budgets = [];
        const goals = [];

        const monthlyIncome = 0;
        const monthlyExpense = 0;
        const monthlyNet = 0;
        const monthlyTxCount = 0;

        // ================================
        // BUDGET TEXT
        // ================================
        let budgetText = '│  (Belum ada budget)\n';

        // ================================
        // GOALS TEXT
        // ================================
        let goalsText = '│  (Belum ada goal)\n';

        // ================================
        // LEVEL INFO SAFE
        // ================================
        const levelInfo =
            typeof ctx?.level !== 'undefined'
                ? `│  ⭐ Level: ${ctx.level || 0} (${ctx.xp || 0} XP)\n`
                : '';

        // ================================
        // SEND OUTPUT
        // ================================
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
│  💵 Saldo Saat Ini: ${formatRupiah(balance)}
│  📥 Total Pemasukan: ${formatRupiah(totalIncome)}
│  📤 Total Pengeluaran: ${formatRupiah(totalExpense)}
│  📊 Net Flow: ${netFlow >= 0 ? '+' : ''}${formatRupiah(netFlow)}
│
├───〔 BULAN INI 〕───
│  📥 Income: ${formatRupiah(monthlyIncome)}
│  📤 Expense: ${formatRupiah(monthlyExpense)}
│  📊 Net: ${monthlyNet >= 0 ? '+' : ''}${formatRupiah(monthlyNet)}
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