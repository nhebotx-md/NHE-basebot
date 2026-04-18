const handler = async (m, Obj) => {
    const { args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // VALIDASI MIDDLEWARE
        if (!ctx || !ctx.user || !ctx.userId) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        // 🔥 FIX UTAMA
        const userId = ctx.userId; // JANGAN pakai ctx.user.number lagi

        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // ✅ IMPORT YANG BENAR
        const { formatRupiah } = require('../src/domain/finance/engine');
        const { getUserTransactions } = require('../src/domain/finance/ledger');

        // =========================
        // PARSE ARGS
        // =========================
        let limit = 10;
        let type = null;

        for (const arg of args) {
            if (!isNaN(arg)) limit = parseInt(arg);
            if (['income', 'expense'].includes(arg)) type = arg;
        }

        limit = Math.min(limit, 30);

        // =========================
        // FETCH DATA (ASYNC)
        // =========================
        const txs = await getUserTransactions(userId, {
            limit,
            type
        });

        if (!txs || txs.length === 0) {
            await engine.sendHybrid(m, {
                text: `
╭───〔 📋 TRANSACTION HISTORY 〕───╮
│
│  Belum ada transaksi.
│
│  Gunakan:
│  .finadd income 50000 gaji
│  .finadd expense 10000 makan
│
╰────────────────────╯`,
                footer: global?.botname,
                buttons: [
                    { buttonId: '.finadd income ', buttonText: { displayText: '➕ INCOME' } },
                    { buttonId: '.finadd expense ', buttonText: { displayText: '➖ EXPENSE' } }
                ],
                ctx: ctx_local
            });
            return;
        }

        // =========================
        // BUILD OUTPUT
        // =========================
        let historyText = '';

        txs.forEach(tx => {
            const emoji = tx.type === 'income' ? '🟢➕' : '🔴➖';

            const date = new Date(tx.createdAt).toLocaleString('id-ID');

            historyText += `│  ${emoji} ${formatRupiah(tx.amount)}\n`;
            historyText += `│     📂 ${tx.category}\n`;
            historyText += `│     📝 ${tx.note || '-'}\n`;
            historyText += `│     📅 ${date}\n│\n`;
        });

        const totalIncome = txs
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0);

        const totalExpense = txs
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0);

        await engine.send(m, {
            text: `
╭───〔 📋 RIWAYAT TRANSAKSI 〕───╮
│  Total: ${txs.length} transaksi
│
├───〔 RINGKASAN 〕───
│  📥 Income: ${formatRupiah(totalIncome)}
│  📤 Expense: ${formatRupiah(totalExpense)}
│  📊 Net: ${formatRupiah(totalIncome - totalExpense)}
│
${historyText}╰────────────────────╯`,
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-history error]', err);
        await reply('❌ Gagal mengambil riwayat transaksi.');
    }
};

handler.command = ['finhistory', 'fhistory', 'riwayat', 'mutasi'];
handler.tags = ['finance'];
handler.help = ['finhistory [jumlah] [income/expense]'];

module.exports = handler;