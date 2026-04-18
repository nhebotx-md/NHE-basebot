const handler = async (m, Obj) => {
    const { args, reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // =========================
        // VALIDASI MIDDLEWARE
        // =========================
        if (!ctx || !ctx.user || !ctx.userId) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = ctx.userId;

        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb
        };

        // =========================
        // IMPORT LAYER BENAR
        // =========================
        const { getBalance, formatRupiah } = require('../src/domain/finance/engine');
        const { getUserTransactions, getCategorySummary } = require('../src/domain/finance/ledger');

        // =========================
        // PARSE PERIOD
        // =========================
        let period = 'month';

        if (args[0]) {
            const p = args[0].toLowerCase();
            if (['today', 'day', 'hari'].includes(p)) period = 'today';
            else if (['week', 'minggu'].includes(p)) period = 'week';
            else if (['year', 'tahun'].includes(p)) period = 'year';
        }

        const periodLabels = {
            today: 'Hari Ini',
            week: 'Minggu Ini',
            month: 'Bulan Ini',
            year: 'Tahun Ini'
        };

        // =========================
        // DATE FILTER
        // =========================
        const now = new Date();
        let startDate = new Date();

        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(now.getFullYear() - 1);
        }

        // =========================
        // FETCH DATA
        // =========================
        const [balanceData, txs, categorySummary] = await Promise.all([
            getBalance(userId),
            getUserTransactions(userId, { startDate }),
            getCategorySummary(userId, { startDate })
        ]);

        const totalIncome = txs
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0);

        const totalExpense = txs
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0);

        const net = totalIncome - totalExpense;

        // =========================
        // CATEGORY TEXT
        // =========================
        let categoryText = '';

        if (categorySummary.length > 0) {
            categorySummary.forEach(cat => {
                categoryText += `│  • ${cat._id}: ${formatRupiah(cat.income)} in / ${formatRupiah(cat.expense)} out\n`;
            });
        } else {
            categoryText = '│  (Tidak ada transaksi)\n';
        }

        // =========================
        // SIMPLE HEALTH SCORE
        // =========================
        let health = 'good';
        if (totalExpense > totalIncome) health = 'warning';
        if (totalExpense > totalIncome * 1.5) health = 'critical';

        const healthEmoji = {
            good: '🟢',
            warning: '🟠',
            critical: '🔴'
        };

        // =========================
        // OUTPUT
        // =========================
        await engine.sendHybrid(m, {
            text: `
╭───〔 📊 FINANCIAL REPORT 〕───╮
│
│  👤 ${ctx_local.name}
│  📅 ${periodLabels[period]}
│  🏥 Status: ${healthEmoji[health]}
│
├───〔 RINGKASAN 〕───
│  💰 Saldo: ${formatRupiah(balanceData.balance)}
│  📥 Income: ${formatRupiah(totalIncome)}
│  📤 Expense: ${formatRupiah(totalExpense)}
│  📊 Net: ${formatRupiah(net)}
│  📋 Transaksi: ${txs.length}
│
├───〔 KATEGORI 〕───
${categoryText}
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            buttons: [
                { buttonId: '.finbalance', buttonText: { displayText: '💰 SALDO' } },
                { buttonId: '.finhistory', buttonText: { displayText: '📋 HISTORY' } },
                { buttonId: '.finreport today', buttonText: { displayText: '📅 HARI INI' } },
                { buttonId: '.finreport week', buttonText: { displayText: '📅 MINGGU' } }
            ],
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-report error]', err);
        await reply('❌ Gagal membuat laporan keuangan.');
    }
};

handler.command = ['finreport', 'freport', 'laporan'];
handler.tags = ['finance'];
handler.help = ['finreport [today/week/month/year]'];

module.exports = handler;