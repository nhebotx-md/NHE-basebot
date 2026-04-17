/**
 * =========================================
 * PLUGIN: fin-goal.js — Financial Goals
 * =========================================
 * Command:
 *  .fingoal create <nama> <target> <kategori> [deadline]
 *  .fingoal list
 *  .fingoal contribute <goal-id> <jumlah>
 *  .fingoal progress
 */

const handler = async (m, Obj) => {
    const { text, args, reply, conn, createReplyEngine, global } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);
        const sender = m.sender || "0@s.whatsapp.net";
        const userId = sender.split('@')[0];

        const ctx = {
            name: m.pushName || "User",
            number: userId,
            thumb: global?.thumb
        };

        // Initialize
        const { initFinanceDB, formatCurrency } = require('../src/domain/finance/engine');
        const { goals } = require('../src/domain/finance/engine');
        const { emitFinanceEvent, EVENT_TYPES, setupDefaultListeners } = require('../src/domain/finance/events');
        initFinanceDB();
        setupDefaultListeners();

        // Default action: show help if no args
        if (args.length === 0) {
            args[0] = 'list';
        }

        const subCommand = args[0].toLowerCase();

        // ═══════════════════════════════════
        // SUBCOMMAND: CREATE
        // ═══════════════════════════════════
        if (subCommand === 'create' || subCommand === 'baru' || subCommand === 'add') {
            if (args.length < 4) {
                await engine.send(m, {
                    text: `
╭───〔 FINANCE GOAL — CREATE 〕───╮
│
│  Format: .fingoal create <nama> <target> <kategori> [deadline]
│
│  Kategori: savings, emergency, investment, debt, other
│  Deadline: YYYY-MM-DD (opsional)
│
│  Contoh:
│  .fingoal create "Dana Darurat" 10000000 emergency
│  .fingoal create "iPhone 16" 25000000 savings 2025-12-31
│
╰────────────────────╯`,
                    ctx
                });
                return;
            }

            // Parse: goal create "Nama Goal" 10000000 savings 2025-12-31
            // Handle quoted name
            let name, target, category, deadline;

            // Simple parsing: args[1] = name, args[2] = target, args[3] = category, args[4] = deadline
            name = args[1].replace(/"/g, '');
            target = parseFloat(args[2].replace(/[^0-9]/g, ''));
            category = args[3].toLowerCase();
            deadline = args[4] || null;

            const validCategories = ['savings', 'emergency', 'investment', 'debt', 'other'];
            if (!validCategories.includes(category)) {
                await engine.send(m, {
                    text: `❌ Kategori tidak valid. Pilihan: ${validCategories.join(', ')}`,
                    ctx
                });
                return;
            }

            const validation = goals.validateGoal({ userId, name, targetAmount: target, category, deadline });
            if (!validation.valid) {
                await engine.send(m, { text: `❌ Error: ${validation.errors.join(', ')}`, ctx });
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
│  ✅ Goal berhasil dibuat!
│
│  🎯 ${goal.name}
│  💵 Target: ${formatCurrency(goal.targetAmount)}
│  📂 Kategori: ${goal.category}
│  📅 Deadline: ${deadlineText}
│  🆔 ID: ${goal.id}
│
│  Gunakan .fingoal contribute ${goal.id} <jumlah>
│  untuk mulai menabung ke goal ini.
│
╰────────────────────╯`,
                footer: global?.botname || "Finance System",
                buttons: [
                    { buttonId: `.fingoal contribute ${goal.id} `, buttonText: { displayText: "💰 CONTRIBUTE" } },
                    { buttonId: ".fingoal progress", buttonText: { displayText: "📊 PROGRESS" } },
                    { buttonId: ".fingoal list", buttonText: { displayText: "📋 LIST GOAL" } }
                ],
                ctx
            });
        }

        // ═══════════════════════════════════
        // SUBCOMMAND: LIST
        // ═══════════════════════════════════
        else if (subCommand === 'list' || subCommand === 'daftar') {
            const userGoals = goals.getUserGoals(userId);

            if (userGoals.length === 0) {
                await engine.sendHybrid(m, {
                    text: `
╭───〔 FINANCE GOALS 〕───╮
│
│  Belum ada goal keuangan.
│
│  Buat goal pertama dengan:
│  .fingoal create <nama> <target> <kategori>
│
╰────────────────────╯`,
                    footer: global?.botname || "Finance System",
                    buttons: [
                        { buttonId: ".fingoal create ", buttonText: { displayText: "➕ BUAT GOAL" } }
                    ],
                    ctx
                });
                return;
            }

            let goalsText = '';
            for (const g of userGoals) {
                const progress = goals.getGoalProgress(g.id);
                const bar = generateProgressBar(progress.percentage, 8);
                const status = g.isCompleted ? '✅ DONE'
                    : g.isActive ? `${Math.round(progress.percentage)}%`
                    : '⏹️ INACTIVE';
                const deadline = g.deadline
                    ? new Date(g.deadline).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
                    : 'no deadline';

                goalsText += `│\n│  ${status} ${g.name}\n│  ${bar} ${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)}\n│  📅 ${deadline} | 🆔 ${g.id.substring(0, 8)}...\n`;
            }

            await engine.sendHybrid(m, {
                text: `
╭───〔 🎯 FINANCE GOALS 〕───╮
│  ${userGoals.length} Goal Aktif
${goalsText}│
╰────────────────────╯`,
                footer: global?.botname || "Finance System",
                buttons: [
                    { buttonId: ".fingoal create ", buttonText: { displayText: "➕ GOAL BARU" } },
                    { buttonId: ".fingoal progress", buttonText: { displayText: "📊 PROGRESS" } }
                ],
                ctx
            });
        }

        // ═══════════════════════════════════
        // SUBCOMMAND: CONTRIBUTE
        // ═══════════════════════════════════
        else if (subCommand === 'contribute' || subCommand === 'contrib' || subCommand === 'add') {
            if (args.length < 3) {
                await engine.send(m, {
                    text: `
╭───〔 FINANCE GOAL — CONTRIBUTE 〕───╮
│
│  Format: .fingoal contribute <goal-id> <jumlah>
│
│  Contoh: .fingoal contribute GLxxxxxx 500000
│
│  Tips: Goal ID bisa dilihat di .fingoal list
│
╰────────────────────╯`,
                    ctx
                });
                return;
            }

            const goalId = args[1];
            const amount = parseFloat(args[2].replace(/[^0-9]/g, ''));

            if (isNaN(amount) || amount <= 0) {
                await engine.send(m, { text: `❌ Jumlah tidak valid`, ctx });
                return;
            }

            const goal = goals.getGoal(goalId);
            if (!goal || goal.userId !== userId) {
                await engine.send(m, { text: `❌ Goal tidak ditemukan. Cek dengan .fingoal list`, ctx });
                return;
            }

            const result = goals.contributeToGoal(goalId, amount);

            if (!result.success) {
                await engine.send(m, { text: `❌ Gagal: ${result.error}`, ctx });
                return;
            }

            emitFinanceEvent(EVENT_TYPES.GOAL_CONTRIBUTED, {
                userId,
                goal: result.goal,
                contributed: result.contributed,
                remaining: result.remaining
            });

            const progress = goals.getGoalProgress(goalId);
            const bar = generateProgressBar(progress.percentage, 10);

            await engine.sendHybrid(m, {
                text: `
╭───〔 GOAL CONTRIBUTION 〕───╮
│
│  ✅ Kontribusi berhasil!
│
│  🎯 ${result.goal.name}
│  💵 Dikontribusi: ${formatCurrency(result.contributed)}
│  📊 Progress: ${Math.round(progress.percentage)}%
│  ${bar}
│  💰 Terkumpul: ${formatCurrency(result.goal.currentAmount)}
│  🎯 Target: ${formatCurrency(result.goal.targetAmount)}
│  ${progress.isCompleted ? '\n│  🎉 GOAL TERCAPAI! SELAMAT!\n│' : `│  📌 Sisa: ${formatCurrency(result.remaining)}\n│`}
╰────────────────────╯`,
                footer: global?.botname || "Finance System",
                buttons: [
                    { buttonId: `.fingoal contribute ${goalId} `, buttonText: { displayText: "💰 CONTRIBUTE LAGI" } },
                    { buttonId: ".fingoal progress", buttonText: { displayText: "📊 SEMUA PROGRESS" } }
                ],
                ctx
            });
        }

        // ═══════════════════════════════════
        // SUBCOMMAND: PROGRESS
        // ═══════════════════════════════════
        else if (subCommand === 'progress' || subCommand === 'status') {
            const allProgress = goals.getAllGoalsProgress(userId);

            if (allProgress.length === 0) {
                await engine.send(m, {
                    text: `Belum ada goal. Buat dengan .fingoal create`,
                    ctx
                });
                return;
            }

            let progressText = '';
            for (const p of allProgress) {
                const bar = generateProgressBar(p.percentage, 10);
                const emoji = p.isCompleted ? '✅' : p.status === 'near-completion' ? '🏁' : p.status === 'halfway' ? '⚡' : '🌱';

                progressText += `│\n│  ${emoji} ${p.goal.name}\n│  ${bar} ${Math.round(p.percentage)}%\n│  💵 ${formatCurrency(p.goal.currentAmount)} / ${formatCurrency(p.goal.targetAmount)}\n`;

                if (p.dailyRequired && !p.isCompleted) {
                    progressText += `│  📅 Perlu ${formatCurrency(p.dailyRequired)}/hari untuk tercapai\n`;
                }
                if (p.isCompleted) {
                    progressText += `│  🎉 SELESAI!\n`;
                }
            }

            await engine.send(m, {
                text: `
╭───〔 📊 GOALS PROGRESS 〕───╮
${progressText}│
╰────────────────────╯`,
                ctx
            });
        }

        // ═══════════════════════════════════
        // UNKNOWN SUBCOMMAND
        // ═══════════════════════════════════
        else {
            await engine.send(m, {
                text: `
╭───〔 FINANCE GOAL 〕───╮
│
│  Perintah tersedia:
│
│  .fingoal create <nama> <target> <kategori>
│  .fingoal list
│  .fingoal contribute <goal-id> <jumlah>
│  .fingoal progress
│
╰────────────────────╯`,
                ctx
            });
        }

    } catch (err) {
        console.error('[fin-goal error]', err);
        await reply('❌ Terjadi error. Cek format perintah dengan .fingoal');
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

handler.command = ['fingoal', 'fgoal', 'goal'];
handler.tags = ['finance'];
handler.help = [
    'fingoal create <nama> <target> <kategori> — Buat goal baru',
    'fingoal list — Lihat semua goal',
    'fingoal contribute <id> <jumlah> — Kontribusi ke goal',
    'fingoal progress — Lihat progress semua goal'
];

module.exports = handler;
