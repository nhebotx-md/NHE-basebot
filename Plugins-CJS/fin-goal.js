/**
 * =========================================
 * PLUGIN: fin-goal.js — Financial Goals
 * =========================================
 * Command:
 *  .fingoal create <nama> <target> <kategori> [deadline]
 *  .fingoal list
 *  .fingoal contribute <goal-id> <jumlah>
 *  .fingoal progress
 *
 * INTEGRASI:
 * - Menggunakan ctx.user.number dari middleware
 * - Fallback ke ctx.number / ctx.userId
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

        // HARDENED USER ID (ANTI ERROR ENGINE)
        const userId =
            ctx.user?.number ||
            ctx.number ||
            ctx.userId ||
            (typeof m.sender === 'string' ? m.sender.split('@')[0] : null);

        if (!userId) {
            console.error('[fin-goal] Invalid userId:', ctx);
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
        const { initFinanceDB, formatCurrency, goals } = finance;
        const { emitFinanceEvent, EVENT_TYPES, setupDefaultListeners } = require('../src/domain/finance/events');

        initFinanceDB();
        setupDefaultListeners();

        // DEFAULT COMMAND
        if (args.length === 0) args[0] = 'list';

        const subCommand = args[0].toLowerCase();

        // =========================================
        // CREATE
        // =========================================
        if (['create', 'baru', 'add'].includes(subCommand)) {

            if (args.length < 4) {
                await engine.send(m, {
                    text: `
╭───〔 FINANCE GOAL — CREATE 〕───╮
│
│  Format:
│  .fingoal create <nama> <target> <kategori> [deadline]
│
│  Kategori:
│  savings, emergency, investment, debt, other
│
╰────────────────────╯`,
                    ctx: ctx_local
                });
                return;
            }

            const name = args[1].replace(/"/g, '');
            const target = parseFloat(args[2].replace(/[^0-9]/g, ''));
            const category = args[3].toLowerCase();
            const deadline = args[4] || null;

            const validCategories = ['savings', 'emergency', 'investment', 'debt', 'other'];

            if (!validCategories.includes(category)) {
                await engine.send(m, {
                    text: `❌ Kategori tidak valid`,
                    ctx: ctx_local
                });
                return;
            }

            const validation = goals.validateGoal({
                userId,
                name,
                targetAmount: target,
                category,
                deadline
            });

            if (!validation.valid) {
                await engine.send(m, {
                    text: `❌ ${validation.errors.join(', ')}`,
                    ctx: ctx_local
                });
                return;
            }

            const goal = goals.createGoal({
                userId,
                name,
                targetAmount: target,
                category,
                deadline
            });

            emitFinanceEvent(EVENT_TYPES.GOAL_CREATED, { userId, goal });

            const deadlineText = goal.deadline
                ? new Date(goal.deadline).toLocaleDateString('id-ID')
                : 'Tidak ditentukan';

            await engine.sendHybrid(m, {
                text: `
╭───〔 GOAL CREATED 〕───╮
│
│  🎯 ${goal.name}
│  💵 ${formatCurrency(goal.targetAmount)}
│  📂 ${goal.category}
│  📅 ${deadlineText}
│  🆔 ${goal.id}
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    {
                        buttonId: `.fingoal contribute ${goal.id}`,
                        buttonText: { displayText: '💰 CONTRIBUTE' }
                    },
                    {
                        buttonId: '.fingoal list',
                        buttonText: { displayText: '📋 LIST' }
                    }
                ],
                ctx: ctx_local
            });
        }

        // =========================================
        // LIST
        // =========================================
        else if (['list', 'daftar'].includes(subCommand)) {

            const userGoals = goals.getUserGoals(userId);

            if (!userGoals.length) {
                await engine.send(m, {
                    text: `Belum ada goal.`,
                    ctx: ctx_local
                });
                return;
            }

            let txt = '';

            for (const g of userGoals) {
                const progress = goals.getGoalProgress(g.id);
                const bar = generateProgressBar(progress.percentage, 8);

                txt += `│ ${g.name}\n│ ${bar} ${Math.round(progress.percentage)}%\n│\n`;
            }

            await engine.send(m, {
                text: `
╭───〔 GOALS 〕───╮
${txt}╰────────────╯`,
                ctx: ctx_local
            });
        }

        // =========================================
        // CONTRIBUTE
        // =========================================
        else if (['contribute', 'contrib'].includes(subCommand)) {

            if (args.length < 3) {
                await engine.send(m, {
                    text: `Format: .fingoal contribute <id> <jumlah>`,
                    ctx: ctx_local
                });
                return;
            }

            const goalId = args[1];
            const amount = parseFloat(args[2].replace(/[^0-9]/g, ''));

            if (!amount || amount <= 0) {
                await engine.send(m, {
                    text: `❌ Jumlah tidak valid`,
                    ctx: ctx_local
                });
                return;
            }

            const goal = goals.getGoal(goalId);

            if (!goal || goal.userId !== userId) {
                await engine.send(m, {
                    text: `❌ Goal tidak ditemukan`,
                    ctx: ctx_local
                });
                return;
            }

            const result = goals.contributeToGoal(goalId, amount);

            if (!result.success) {
                await engine.send(m, {
                    text: `❌ ${result.error}`,
                    ctx: ctx_local
                });
                return;
            }

            const progress = goals.getGoalProgress(goalId);
            const bar = generateProgressBar(progress.percentage, 10);

            await engine.send(m, {
                text: `
╭───〔 CONTRIBUTION 〕───╮
│
│  ${goal.name}
│  ${bar} ${Math.round(progress.percentage)}%
│
╰────────────────────╯`,
                ctx: ctx_local
            });
        }

        // =========================================
        // PROGRESS
        // =========================================
        else if (['progress', 'status'].includes(subCommand)) {

            const all = goals.getAllGoalsProgress(userId);

            if (!all.length) {
                await engine.send(m, {
                    text: `Belum ada goal.`,
                    ctx: ctx_local
                });
                return;
            }

            let txt = '';

            for (const p of all) {
                const bar = generateProgressBar(p.percentage, 10);
                txt += `│ ${p.goal.name}\n│ ${bar} ${Math.round(p.percentage)}%\n│\n`;
            }

            await engine.send(m, {
                text: `
╭───〔 PROGRESS 〕───╮
${txt}╰────────────╯`,
                ctx: ctx_local
            });
        }

        // =========================================
        // UNKNOWN
        // =========================================
        else {
            await engine.send(m, {
                text: `Gunakan: create | list | contribute | progress`,
                ctx: ctx_local
            });
        }

    } catch (err) {
        console.error('[fin-goal error]', err);
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

handler.command = ['fingoal', 'goal'];
handler.tags = ['finance'];
handler.help = [
    'fingoal create',
    'fingoal list',
    'fingoal contribute',
    'fingoal progress'
];

module.exports = handler;