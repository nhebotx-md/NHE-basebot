/**
 * =========================================
 * PLUGIN: fin-budget.js — Budget Management
 * =========================================
 * Command:
 *  .finbudget set <kategori> <jumlah> [period]
 *  .finbudget list
 *  .finbudget check
 *  .finbudget delete <budget-id>
 *
 * INTEGRASI: Menggunakan ctx.user.number dari middleware
 */

const handler = async (m, Obj) => {
    const { text, args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // 🔧 INTEGRASI MIDDLEWARE
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = ctx.user.number;
        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // Initialize
        const { initFinanceDB, formatCurrency } = require('../src/domain/finance/engine');
        const { budget } = require('../src/domain/finance/engine');
        initFinanceDB();

        // Default: list
        if (args.length === 0) {
            args[0] = 'list';
        }

        const sub = args[0].toLowerCase();

        // ═══════════════════════════════════
        // SET BUDGET
        // ═══════════════════════════════════
        if (sub === 'set' || sub === 'add' || sub === 'buat') {
            if (args.length < 3) {
                await engine.send(m, {
                    text: `
╭───〔 FINANCE BUDGET — SET 〕───╮
│
│  Format: .finbudget set <kategori> <jumlah> [period]
│
│  Period: monthly (default), weekly, yearly
│
│  Contoh:
│  .finbudget set makanan 2000000 monthly
│  .finbudget set transport 500000 weekly
│
╰────────────────────╯`,
                    ctx: ctx_local
                });
                return;
            }

            const category = args[1].toLowerCase();
            const amount = parseFloat(args[2].replace(/[^0-9]/g, ''));
            const period = args[3] || 'monthly';

            if (isNaN(amount) || amount <= 0) {
                await engine.send(m, { text: '❌ Jumlah harus angka positif', ctx: ctx_local });
                return;
            }

            const validPeriods = ['monthly', 'weekly', 'yearly'];
            if (!validPeriods.includes(period)) {
                await engine.send(m, { text: `❌ Period harus: ${validPeriods.join(', ')}`, ctx: ctx_local });
                return;
            }

            const validation = budget.validateBudget({ userId, category, amount, period });
            if (!validation.valid) {
                await engine.send(m, { text: `❌ ${validation.errors.join(', ')}`, ctx: ctx_local });
                return;
            }

            const newBudget = budget.createBudget({ userId, category, amount, period });

            await engine.sendHybrid(m, {
                text: `
╭───〔 BUDGET SET 〕───╮
│
│  ✅ Budget berhasil dibuat!
│
│  📂 Kategori: ${newBudget.category}
│  💵 Limit: ${formatCurrency(newBudget.amount)}
│  📅 Period: ${newBudget.period}
│  🆔 ID: ${newBudget.id}
│
│  Budget aktif segera setelah dibuat.
│  Budget lama untuk kategori yang sama
│  akan dinonaktifkan otomatis.
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    { buttonId: '.finbudget check', buttonText: { displayText: '🔍 CHECK BUDGET' } },
                    { buttonId: '.finbudget list', buttonText: { displayText: '📋 LIST BUDGET' } }
                ],
                ctx: ctx_local
            });
        }

        // ═══════════════════════════════════
        // LIST BUDGET
        // ═══════════════════════════════════
        else if (sub === 'list' || sub === 'daftar') {
            const budgets = budget.getUserBudgets(userId, { activeOnly: false });

            if (budgets.length === 0) {
                await engine.sendHybrid(m, {
                    text: `
╭───〔 FINANCE BUDGETS 〕───╮
│
│  Belum ada budget.
│
│  Buat budget dengan:
│  .finbudget set <kategori> <jumlah>
│
╰────────────────────╯`,
                    footer: global?.botname || 'Finance System',
                    buttons: [
                        { buttonId: '.finbudget set ', buttonText: { displayText: '➕ BUAT BUDGET' } }
                    ],
                    ctx: ctx_local
                });
                return;
            }

            let listText = '';
            for (const b of budgets) {
                const status = b.isActive ? '🟢' : '⚪';
                listText += `│  ${status} ${b.category}: ${formatCurrency(b.amount)}/${b.period}\n│     🆔 ${b.id.substring(0, 8)}...\n│\n`;
            }

            await engine.send(m, {
                text: `
╭───〔 📋 BUDGET LIST 〕───╮
│  ${budgets.filter(b => b.isActive).length} Aktif / ${budgets.length} Total
│
${listText}╰────────────────────╯`,
                ctx: ctx_local
            });
        }

        // ═══════════════════════════════════
        // CHECK BUDGET STATUS
        // ═══════════════════════════════════
        else if (sub === 'check' || sub === 'status') {
            const checks = budget.checkAllBudgets(userId);

            if (checks.length === 0) {
                await engine.send(m, {
                    text: `Belum ada budget aktif. Buat dengan .finbudget set <kategori> <jumlah>`,
                    ctx: ctx_local
                });
                return;
            }

            let statusText = '';
            for (const c of checks) {
                const bar = generateProgressBar(c.percentage, 10);
                const emoji = c.isOverBudget ? '🔴 OVER' : c.isNearLimit ? '🟡 NEAR' : '🟢 OK';
                statusText += `│\n│  ${emoji} ${c.budget.category}\n│  ${bar} ${Math.round(c.percentage)}%\n│  💵 ${formatCurrency(c.spent)} / ${formatCurrency(c.budget.amount)}\n│  📊 Sisa: ${formatCurrency(c.remaining)} | 📋 ${c.transactions} transaksi\n`;
            }

            await engine.send(m, {
                text: `
╭───〔 📊 BUDGET STATUS 〕───╮
${statusText}│
╰────────────────────╯`,
                ctx: ctx_local
            });
        }

        // ═══════════════════════════════════
        // DELETE BUDGET
        // ═══════════════════════════════════
        else if (sub === 'delete' || sub === 'del' || sub === 'remove') {
            if (args.length < 2) {
                await engine.send(m, {
                    text: `Format: .finbudget delete <budget-id>\n\nCek ID dengan .finbudget list`,
                    ctx: ctx_local
                });
                return;
            }

            const budgetId = args[1];
            const target = budget.getBudget(budgetId);

            if (!target || target.userId !== userId) {
                await engine.send(m, { text: '❌ Budget tidak ditemukan', ctx: ctx_local });
                return;
            }

            budget.deactivateBudget(budgetId);
            await engine.send(m, {
                text: `✅ Budget *${target.category}* (${formatCurrency(target.amount)}) dinonaktifkan.`,
                ctx: ctx_local
            });
        }

        // ═══════════════════════════════════
        // HELP
        // ═══════════════════════════════════
        else {
            await engine.send(m, {
                text: `
╭───〔 FINANCE BUDGET 〕───╮
│
│  .finbudget set <kategori> <jumlah> [period]
│  .finbudget list
│  .finbudget check
│  .finbudget delete <budget-id>
│
╰────────────────────╯`,
                ctx: ctx_local
            });
        }

    } catch (err) {
        console.error('[fin-budget error]', err);
        await reply('❌ Terjadi error. Cek format dengan .finbudget');
    }
};

const generateProgressBar = (percentage, length = 10) => {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(Math.min(filled, length)) + '░'.repeat(Math.max(0, empty));
};

handler.command = ['finbudget', 'fbudget', 'budget'];
handler.tags = ['finance'];
handler.help = [
    'finbudget set <kategori> <jumlah> [period] — Set budget',
    'finbudget list — Lihat semua budget',
    'finbudget check — Cek status budget',
    'finbudget delete <id> — Hapus budget'
];

module.exports = handler;
