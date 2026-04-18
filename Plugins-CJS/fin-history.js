/**
 * =========================================
 * PLUGIN: fin-history.js — Transaction History
 * =========================================
 * Command: .finhistory [limit] [type]
 * Menampilkan riwayat transaksi dari ledger
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
        const { ledger } = require('../src/domain/finance/engine');
        initFinanceDB();

        // Parse args
        let limit = 10;
        let type = null;

        for (const arg of args) {
            if (!isNaN(arg) && parseInt(arg) > 0) {
                limit = parseInt(arg);
            } else if (['income', 'expense'].includes(arg.toLowerCase())) {
                type = arg.toLowerCase();
            }
        }
        limit = Math.min(limit, 30); // Max 30 entries

        // Get transactions
        const options = { limit };
        if (type) options.type = type;

        const txs = ledger.getUserTransactions(userId, options);

        if (txs.length === 0) {
            await engine.sendHybrid(m, {
                text: `
╭───〔 📋 TRANSACTION HISTORY 〕───╮
│
│  Belum ada transaksi.
│
│  Mulai catat dengan:
│  .finadd income 5000000 gaji
│  .finadd expense 50000 makan
│
╰────────────────────╯`,
                footer: global?.botname || 'Finance System',
                buttons: [
                    { buttonId: '.finadd income ', buttonText: { displayText: '➕ INCOME' } },
                    { buttonId: '.finadd expense ', buttonText: { displayText: '➖ EXPENSE' } }
                ],
                ctx: ctx_local
            });
            return;
        }

        // Build history text
        let historyText = '';
        for (let i = txs.length - 1; i >= 0; i--) {
            const tx = txs[i];
            const emoji = tx.type === 'income' ? '🟢➕' : '🔴➖';
            const date = new Date(tx.timestamp).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            historyText += `│  ${emoji} ${formatCurrency(tx.amount)}\n│     📂 ${tx.category} | ${date}\n│     📝 ${tx.description || '-'}\n│     💰 Saldo: ${formatCurrency(tx.runningBalance || 0)}\n│\n`;
        }

        const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        await engine.send(m, {
            text: `
╭───〔 📋 RIWAYAT TRANSAKSI 〕───╮
│  Menampilkan ${txs.length} transaksi terakhir
│
├───〔 RINGKASAN 〕───
│  📥 Income: ${formatCurrency(totalIncome)}
│  📤 Expense: ${formatCurrency(totalExpense)}
│  📊 Net: ${totalIncome - totalExpense >= 0 ? '+' : ''}${formatCurrency(totalIncome - totalExpense)}
│
${historyText}╰────────────────────╯`,
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-history error]', err);
        await reply('❌ Terjadi error saat mengambil riwayat.');
    }
};

handler.command = ['finhistory', 'fhistory', 'riwayat', 'mutasi'];
handler.tags = ['finance'];
handler.help = ['finhistory [jumlah] [income/expense] — Riwayat transaksi'];

module.exports = handler;
