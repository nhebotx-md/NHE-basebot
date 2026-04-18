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
 * INTEGRASI:
 * - Menggunakan ctx (middleware)
 * - Hardened userId resolver (ANTI ERROR ENGINE)
 * =========================================
 */

const handler = async (m, Obj) => {
    const { args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // =========================================
        // VALIDASI CONTEXT
        // =========================================
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        // 🔥 HARDENED USER ID (INI KUNCI FIX ERROR)
        const userId =
            ctx.user?.number ||
            ctx.number ||
            ctx.userId ||
            (typeof m.sender === 'string' ? m.sender.split('@')[0] : null);

        if (!userId) {
            console.error('[fin-budget] Invalid userId:', ctx);
            await reply('❌ Gagal mengidentifikasi user.');
            return;
        }

        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // =========================================
        // INIT ENGINE
        // =========================================
        const finance = require('../src/domain/finance/engine');
        const { initFinanceDB, formatCurrency, budget } = finance;

        initFinanceDB();

        // DEFAULT COMMAND
        if (args.length === 0) args[0] = 'list';

        const sub = args[0].toLowerCase();

        // =========================================
        // SET BUDGET
        // =========================================
        if (['set', 'add', 'buat'].includes(sub)) {

            if (args.length < 3) {
                await engine.send(m, {
                    text: `
╭───〔 FINANCE BUDGET — SET 〕───╮
│
│  Format:
│  .finbudget set <kategori> <jumlah> [period]
│
│  Period:
│  monthly (default), weekly, yearly
│
╰────────────────────╯`,
                    ctx: ctx_local
                });
                return;
            }

            const category = args[1].toLowerCase();
            const amount = parseFloat(args[2].replace(/[^0-9]/g, ''));
            const period = (args[3] || 'monthly').toLowerCase();

            if (!amount || amount <= 0) {
                await engine.send(m, {
                    text: '❌ Jumlah harus angka positif',
                    ctx: ctx_local
                });
                return;
            }

            const validPeriods = ['monthly', 'weekly', 'yearly'];

            if (!validPeriods.includes(period)) {
                await engine.send(m, {
                    text: `❌ Period harus: ${validPeriods.join(', ')}`,
                    ctx: ctx_local
                });
                return;
            }

            const validation = budget.validateBudget({
                userId,
                category,
                amount,
                period
            });

            if (!validation.valid) {
                await engine.send(m, {
                    text: `❌ ${validation.errors.join(', ')}`,
                    ctx: ctx_local
                });
                return;
            }

            const newBudget = budget.createBudget({
                userId,
                category,
                amount,
                period
            });

            await engine.sendHybrid(m, {
                text: `
╭───〔 BUDGET SET 〕───╮
│
│  📂 ${newBudget.category}
│  💵 ${formatCurrency(newBudget.amount)}
│  📅 ${newBudget.period}
│  🆔 ${newBudget.id}
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    {
                        buttonId: '.finbudget check',
                        buttonText: { displayText: '🔍 CHECK' }
                    },
                    {
                        buttonId: '.finbudget list',
                        buttonText: { displayText: '📋 LIST' }
                    }
                ],
                ctx: ctx_local
            });
        }

        // =========================================
        // LIST
        // =========================================
        else if (['list', 'daftar'].includes(sub)) {

            const budgets = budget.getUserBudgets(userId, { activeOnly: false });

            if (!budgets.length) {
                await engine.send(m, {
                    text: `Belum ada budget.`,
                    ctx: ctx_local
                });
                return;
            }

            let txt = '';

            for (const b of budgets) {
                const status = b.isActive ? '🟢' : '⚪';
                txt += `│ ${status} ${b.category} (${b.period})\n│ ${formatCurrency(b.amount)}\n│\n`;
            }

            await engine.send(m, {
                text: `
╭───〔 BUDGET LIST 〕───╮
${txt}╰────────────╯`,
                ctx: ctx_local
            });
        }

        // =========================================
        // CHECK
        // =========================================
        else if (['check', 'status'].includes(sub)) {

            const checks = budget.checkAllBudgets(userId);

            if (!checks.length) {
                await engine.send(m, {
                    text: `Belum ada budget aktif.`,
                    ctx: ctx_local
                });
                return;
            }

            let txt = '';

            for (const c of checks) {
                const bar = generateProgressBar(c.percentage, 10);
                const emoji = c.isOverBudget
                    ? '🔴'
                    : c.isNearLimit
                    ? '🟡'
                    : '🟢';

                txt += `│ ${emoji} ${c.budget.category}\n│ ${bar} ${Math.round(c.percentage)}%\n│\n`;
            }

            await engine.send(m, {
                text: `
╭───〔 STATUS 〕───╮
${txt}╰──────────╯`,
                ctx: ctx_local
            });
        }

        // =========================================
        // DELETE
        // =========================================
        else if (['delete', 'del', 'remove'].includes(sub)) {

            if (args.length < 2) {
                await engine.send(m, {
                    text: `Format: .finbudget delete <id>`,
                    ctx: ctx_local
                });
                return;
            }

            const budgetId = args[1];
            const target = budget.getBudget(budgetId);

            if (!target || target.userId !== userId) {
                await engine.send(m, {
                    text: '❌ Budget tidak ditemukan',
                    ctx: ctx_local
                });
                return;
            }

            budget.deactivateBudget(budgetId);

            await engine.send(m, {
                text: `✅ Budget ${target.category} dinonaktifkan`,
                ctx: ctx_local
            });
        }

        // =========================================
        // HELP
        // =========================================
        else {
            await engine.send(m, {
                text: `
╭───〔 FINANCE BUDGET 〕───╮
│ set | list | check | delete
╰────────────────────────╯`,
                ctx: ctx_local
            });
        }

    } catch (err) {
        console.error('[fin-budget error]', err);
        await reply('❌ Terjadi error.');
    }
};

// =========================================
// PROGRESS BAR
// =========================================
const generateProgressBar = (percentage, length = 10) => {
    const filled = Math.round((percentage / 100) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
};

handler.command = ['finbudget', 'fbudget', 'budget'];
handler.tags = ['finance'];
handler.help = [
    'finbudget set <kategori> <jumlah> [period]',
    'finbudget list',
    'finbudget check',
    'finbudget delete <id>'
];

module.exports = handler;