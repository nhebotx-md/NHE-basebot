/**
 * =========================================
 * PLUGIN: fin-analytics.js — Financial Insights
 * =========================================
 * Command: .finanalytics
 * Menampilkan insight keuangan:
 * - Pengeluaran terbesar
 * - Kategori dominan
 * - Tren harian
 * - Rekomendasi
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
        const { analytics, ledger } = require('../src/domain/finance/engine');
        initFinanceDB();

        // Get report
        const report = analytics.generateFullReport(userId, { period: 'month' });

        // ═══════════════════════════════════
        // TOP SPENDING
        // ═══════════════════════════════════
        let topSpendingText = '';
        if (report.topSpending && report.topSpending.length > 0) {
            for (let i = 0; i < Math.min(5, report.topSpending.length); i++) {
                const item = report.topSpending[i];
                topSpendingText += `│  ${i + 1}. ${item.category}: ${formatCurrency(item.amount)} (${item.percentage}%)\n`;
            }
        } else {
            topSpendingText = '│  (Tidak ada data pengeluaran)\n';
        }

        // ═══════════════════════════════════
        // CATEGORY BREAKDOWN
        // ═══════════════════════════════════
        let categoryText = '';
        const breakdown = report.periodReport.categoryBreakdown;
        if (breakdown && Object.keys(breakdown).length > 0) {
            // Sort by total activity
            const sorted = Object.entries(breakdown)
                .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
                .slice(0, 5);

            for (const [cat, data] of sorted) {
                const total = data.income + data.expense;
                categoryText += `│  • ${cat}: ${data.count}x transaksi (${formatCurrency(total)})\n`;
            }
        } else {
            categoryText = '│  (Tidak ada data)\n';
        }

        // ═══════════════════════════════════
        // DAILY TREND
        // ═══════════════════════════════════
        let trendText = '';
        const dailyData = report.periodReport.dailyTrend;
        if (dailyData && Object.keys(dailyData).length > 0) {
            const sortedDays = Object.entries(dailyData)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .slice(0, 7);

            for (const [day, data] of sortedDays) {
                const date = new Date(day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                const emoji = data.expense > data.income ? '🔴' : '🟢';
                trendText += `│  ${emoji} ${date}: +${formatCurrency(data.income)} / -${formatCurrency(data.expense)}\n`;
            }
        } else {
            trendText = '│  (Tidak ada data harian)\n';
        }

        // ═══════════════════════════════════
        // RECOMMENDATION
        // ═══════════════════════════════════
        let recommendation = '';
        const savingsRate = report.savingsRate;
        if (savingsRate >= 20) {
            recommendation = '│  ✅ Keuanganmu sangat sehat!\n│  Pertahankan tabungan di atas 20%.';
        } else if (savingsRate >= 10) {
            recommendation = '│  🟡 Keuanganmu cukup baik.\n│  Coba tingkatkan tabungan ke 20%.';
        } else if (savingsRate > 0) {
            recommendation = '│  🟠 Hati-hati, tabunganmu rendah.\n│  Kurangi pengeluaran non-esensial.';
        } else {
            recommendation = '│  🔴 PERINGATAN: Pengeluaran melebihi pemasukan!\n│  Segera evaluasi keuanganmu.';
        }

        // Health emoji
        const healthEmoji = {
            excellent: '✅',
            good: '🟢',
            fair: '🟡',
            warning: '🟠',
            critical: '🔴'
        };

        await engine.sendHybrid(m, {
            text: `
╭───〔 📈 FINANCIAL INSIGHTS 〕───╮
│
│  👤 ${ctx_local.name}
│  🏥 Kesehatan: ${healthEmoji[report.financialHealth.status] || '➖'} ${report.financialHealth.status.toUpperCase()} (${report.financialHealth.score}/100)
│  📈 Savings Rate: ${savingsRate}%
│
├───〔 🔥 PENGELUARAN TERBESAR 〕───
${topSpendingText}
├───〔 📂 KATEGORI DOMINAN 〕───
${categoryText}
├───〔 📅 TREN HARIAN (7 hari) 〕───
${trendText}
├───〔 💡 REKOMENDASI 〕───
${recommendation}
│
╰────────────────────╯`,
            footer: global?.botname || 'Finance System',
            buttons: [
                { buttonId: '.finreport', buttonText: { displayText: '📊 FULL REPORT' } },
                { buttonId: '.finbalance', buttonText: { displayText: '💰 SALDO' } },
                { buttonId: '.finhistory', buttonText: { displayText: '📋 HISTORY' } }
            ],
            ctx: ctx_local
        });

    } catch (err) {
        console.error('[fin-analytics error]', err);
        await reply('❌ Terjadi error saat menganalisis data keuangan.');
    }
};

handler.command = ['finanalytics', 'fanalytics', 'insight', 'analisis'];
handler.tags = ['finance'];
handler.help = ['finanalytics — Insight keuangan dan rekomendasi'];

module.exports = handler;
