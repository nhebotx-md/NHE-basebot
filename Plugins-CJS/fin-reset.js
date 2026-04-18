/**
 * =========================================
 * PLUGIN: fin-reset.js — Reset Finance Data
 * =========================================
 * Command: .finreset [confirm]
 * Menghapus semua data finance user
 *
 * ⚠️ OWNER ONLY: Plugin ini memerlukan akses owner
 * karena bersifat destructive.
 *
 * INTEGRASI:
 * - Menggunakan ctx.user.number dari middleware
 - Mengecek ctx.isOwner untuk otorisasi
 */

const handler = async (m, Obj) => {
    const { text, args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // 🔧 INTEGRASI MIDDLEWARE: Cek ctx
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = ctx.user.number;
        const isOwner = ctx.isOwner === true;

        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // OWNER CHECK
        if (!isOwner) {
            await engine.send(m, {
                text: `
╭───〔 ❌ ACCESS DENIED 〕───╮
│
│  Perintah ini hanya untuk OWNER.
│
│  Jika kamu ingin reset data sendiri,
│  hubungi owner bot.
│
╰────────────────────╯`,
                ctx: ctx_local
            });
            return;
        }

        // Initialize
        const { initFinanceDB, formatCurrency } = require('../src/domain/finance/engine');
        const { ledger, budget, goals, storage } = require('../src/domain/finance/engine');
        initFinanceDB();

        // Parse: .finreset @user atau .finreset me
        let targetId = userId;
        let targetName = ctx.alias || 'User';

        if (args.length > 0) {
            if (args[0].toLowerCase() !== 'me' && args[0].toLowerCase() !== 'confirm') {
                // Mentioned user
                const mentioned = args[0].replace(/[^0-9]/g, '');
                if (mentioned) {
                    targetId = mentioned;
                    targetName = mentioned;
                }
            }
        }

        // Require confirmation
        if (args[0]?.toLowerCase() !== 'confirm') {
            await engine.sendHybrid(m, {
                text: `
╭───〔 ⚠️ FINANCE RESET 〕───╮
│
│  ⚠️ PERINGATAN DESTRUKTIF
│
│  Target: ${targetName} (${targetId})
│
│  Aksi ini akan menghapus:
│  • Semua transaksi (ledger)
│  • Semua budget
│  • Semua goals
│  • Semua data analytics
│
│  Data yang dihapus TIDAK BISA dikembalikan!
│
│  Ketik .finreset confirm untuk melanjutkan.
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    { buttonId: '.finreset confirm', buttonText: { displayText: '⚠️ KONFIRMASI RESET' } }
                ],
                ctx: ctx_local
            });
            return;
        }

        // ═══════════════════════════════════
        // EXECUTE RESET
        // ═══════════════════════════════════

        // 1. Get current counts for reporting
        const allTxs = ledger.getUserTransactions(targetId);
        const allBudgets = budget.getUserBudgets(targetId, { activeOnly: false });
        const allGoals = goals.getUserGoals(targetId, { activeOnly: false });

        const txCount = allTxs.length;
        const budgetCount = allBudgets.length;
        const goalCount = allGoals.length;

        // 2. Remove transactions from ledger
        const currentLedger = storage.getLedger();
        const filteredLedger = currentLedger.filter(tx => tx.userId !== targetId);
        storage.setLedger(filteredLedger);

        // 3. Remove budgets
        const currentBudgets = storage.getBudgets();
        const filteredBudgets = currentBudgets.filter(b => b.userId !== targetId);
        storage.setBudgets(filteredBudgets);

        // 4. Remove goals
        const currentGoals = storage.getGoals();
        const filteredGoals = currentGoals.filter(g => g.userId !== targetId);
        storage.setGoals(filteredGoals);

        // 5. Save all changes
        storage.saveAll();

        await engine.sendHybrid(m, {
            text: `
╭───〔 ✅ FINANCE RESET COMPLETE 〕───╮
│
│  ✅ Data finance berhasil di-reset!
│
│  👤 Target: ${targetName}
│
│  Data dihapus:
│  • ${txCount} transaksi
│  • ${budgetCount} budget
│  • ${goalCount} goals
│
│  📝 Ledger tetap immutable untuk user lain.
│  Hanya data target yang dihapus.
│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            ctx: ctx_local
        });

        console.log(`[fin-reset] Owner ${userId} reset finance data for ${targetId}`);

    } catch (err) {
        console.error('[fin-reset error]', err);
        await reply('❌ Terjadi error saat reset data.');
    }
};

handler.command = ['finreset', 'freset'];
handler.tags = ['finance', 'owner'];
handler.help = ['finreset — Reset data finance (OWNER ONLY)'];

module.exports = handler;
