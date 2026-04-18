/**
 * =========================================
 * PLUGIN: fin-analytics.js — Financial Insights
 * =========================================
 * Command: .finanalytics
 * Insight keuangan berbasis analytics engine
 *
 * UPDATE:
 * - Safe null handling
 * - Robust analytics fallback
 * - No crash on empty dataset
 * =========================================
 */

const handler = async (m, Obj) => {
    const { reply, conn, createReplyEngine, global, ctx } = Obj;

    try {
        if (!createReplyEngine) {
            throw new Error('createReplyEngine is not provided');
        }

        const engine = createReplyEngine(conn, global);

        // =========================================
        // VALIDASI CTX
        // =========================================
        if (!ctx || !ctx.user) {
            await reply('⚠️ Silakan register terlebih dahulu dengan mengetik .register');
            return;
        }

        const userId = String(ctx?.user?.number || '').trim();

        if (!userId) {
            await reply('❌ User identity tidak valid.');
            return;
        }

        const ctx_local = {
            name: m.pushName || ctx.alias || 'User',
            number: userId,
            thumb: global?.thumb || null
        };

        // =========================================
        // INIT ENGINE
        // =========================================
        const {
            initFinanceDB,
            formatCurrency
        } = require('../src/domain/finance/engine');

        const { analytics } = require('../src/domain/finance/engine');

        initFinanceDB();

        // =========================================
        // FETCH REPORT SAFE
        // =========================================
        let reportRaw;
        try {
            reportRaw = analytics.generateFullReport(userId, { period: 'month' });
        } catch (e) {
            console.error('[analytics generate error]', e);
            reportRaw = {};
        }

        const report = reportRaw || {};

        const periodReport = report.periodReport || {};
        const breakdown = periodReport.categoryBreakdown || {};
        const dailyTrend = periodReport.dailyTrend || {};

        const topSpending = Array.isArray(report.topSpending)
            ? report.topSpending
            : [];

        const savingsRate = Number(report.savingsRate || 0);

        const financialHealth = report.financialHealth || {};
        const healthStatus = financialHealth.status || 'unknown';
        const healthScore = Number(financialHealth.score || 0);

        // =========================================
        // TOP SPENDING
        // =========================================
        let topSpendingText = '';

        if (topSpending.length > 0) {
            for (let i = 0; i < Math.min(5, topSpending.length); i++) {
                const item = topSpending[i] || {};
                const category = item.category || 'unknown';
                const amount = Number(item.amount || 0);
                const percent = Number(item.percentage || 0);

                topSpendingText +=
                    `│  ${i + 1}. ${category}: ${formatCurrency(amount)} (${percent}%)\n`;
            }
        } else {
            topSpendingText = '│  (Tidak ada data pengeluaran)\n';
        }

        // =========================================
        // CATEGORY BREAKDOWN
        // =========================================
        let categoryText = '';

        if (Object.keys(breakdown).length > 0) {
            const sorted = Object.entries(breakdown)
                .sort((a, b) =>
                    ((b[1]?.income || 0) + (b[1]?.expense || 0)) -
                    ((a[1]?.income || 0) + (a[1]?.expense || 0))
                )
                .slice(0, 5);

            for (const [cat, data] of sorted) {
                const income = Number(data?.income || 0);
                const expense = Number(data?.expense || 0);
                const count = Number(data?.count || 0);

                const total = income + expense;

                categoryText +=
                    `│  • ${cat}: ${count}x transaksi (${formatCurrency(total)})\n`;
            }
        } else {
            categoryText = '│  (Tidak ada data)\n';
        }

        // =========================================
        // DAILY TREND
        // =========================================
        let trendText = '';

        if (Object.keys(dailyTrend).length > 0) {
            const sortedDays = Object.entries(dailyTrend)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .slice(0, 7);

            for (const [day, data] of sortedDays) {
                const income = Number(data?.income || 0);
                const expense = Number(data?.expense || 0);

                const date = new Date(day).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                });

                const emoji = expense > income ? '🔴' : '🟢';

                trendText +=
                    `│  ${emoji} ${date}: +${formatCurrency(income)} / -${formatCurrency(expense)}\n`;
            }
        } else {
            trendText = '│  (Tidak ada data harian)\n';
        }

        // =========================================
        // RECOMMENDATION ENGINE
        // =========================================
        let recommendation = '';

        if (savingsRate >= 20) {
            recommendation =
                '│  ✅ Keuanganmu sangat sehat!\n│  Pertahankan tabungan di atas 20%.';
        } else if (savingsRate >= 10) {
            recommendation =
                '│  🟡 Keuangan cukup baik.\n│  Tingkatkan savings ke 20%.';
        } else if (savingsRate > 0) {
            recommendation =
                '│  🟠 Tabungan rendah.\n│  Kurangi pengeluaran non-esensial.';
        } else {
            recommendation =
                '│  🔴 Pengeluaran > pemasukan!\n│  Segera evaluasi finansial.';
        }

        // =========================================
        // HEALTH EMOJI
        // =========================================
        const healthEmoji = {
            excellent: '✅',
            good: '🟢',
            fair: '🟡',
            warning: '🟠',
            critical: '🔴',
            unknown: '➖'
        };

        // =========================================
        // OUTPUT
        // =========================================
        await engine.sendHybrid(m, {
            text: `
╭───〔 📈 FINANCIAL INSIGHTS 〕───╮
│
│  👤 ${ctx_local.name}
│  🏥 Kesehatan: ${healthEmoji[healthStatus] || '➖'} ${String(healthStatus).toUpperCase()} (${healthScore}/100)
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